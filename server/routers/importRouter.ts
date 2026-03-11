import { z } from "zod";
import * as XLSX from "xlsx";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { escolas, equipamentosAssistencia } from "../../drizzle/schema";

export const importRouter = router({
  /**
   * Importar planilha de educação (INEP)
   */
  importEducacao: publicProcedure
    .input(
      z.object({
        fileUrl: z.string().url(), // URL do arquivo já upado no S3
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Banco de dados não disponível");

      console.log("[IMPORT] Baixando planilha de educação...");

      // Baixar arquivo
      const response = await fetch(input.fileUrl);
      const buffer = await response.arrayBuffer();

      // Ler planilha
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data: any[] = XLSX.utils.sheet_to_json(worksheet);

      console.log(`[IMPORT] Total de registros: ${data.length}`);

      // Limpar tabela anterior
      await db.delete(escolas);

      // Inserir em lotes
      const batchSize = 1000;
      let inserted = 0;

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);

        const values = batch
          .filter((row) => row["Código INEP"] && row["Escola"] && row["Município"])
          .map((row) => ({
            codigoInep: String(row["Código INEP"]),
            nome: String(row["Escola"]),
            codigoMunicipio: String(row["Código INEP"]).substring(0, 7), // Primeiros 7 dígitos
            municipio: String(row["Município"]),
            uf: String(row["UF"] || ""),
            restricaoAtendimento: row["Restrição de Atendimento"]
              ? String(row["Restrição de Atendimento"])
              : null,
          }));

        if (values.length > 0) {
          await db.insert(escolas).values(values);
          inserted += values.length;
          console.log(`[IMPORT] Inseridos ${inserted} registros...`);
        }
      }

      console.log(`[IMPORT] ✅ Importação concluída: ${inserted} escolas`);

      return {
        success: true,
        total: inserted,
      };
    }),

  /**
   * Importar planilha de assistência social (SUAS)
   */
  importAssistencia: publicProcedure
    .input(
      z.object({
        fileUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Banco de dados não disponível");

      console.log("[IMPORT] Baixando planilha de assistência...");

      // Baixar arquivo
      const response = await fetch(input.fileUrl);
      const buffer = await response.arrayBuffer();

      // Limpar tabela anterior
      await db.delete(equipamentosAssistencia);

      let totalGeral = 0;

      // Ler planilha
      const workbook = XLSX.read(buffer, { type: "buffer" });
      // Processar cada aba
      const abas = [
        { nome: "Base 2024", tipo: "CRAS/CREAS" },
        { nome: "Unidades de Acolhimento", tipo: "Unidade de Acolhimento" },
        { nome: "Centros Pop", tipo: "Centro Pop" }
      ];

      for (const aba of abas) {
        console.log(`\n[IMPORT] Processando aba: ${aba.nome}...`);

        if (!workbook.SheetNames.includes(aba.nome)) {
          console.log(`[IMPORT] ⚠️ Aba "${aba.nome}" não encontrada, pulando...`);
          continue;
        }

        const sheet = workbook.Sheets[aba.nome];
        const data: any[] = XLSX.utils.sheet_to_json(sheet);

        console.log(`[IMPORT] Total de linhas (${aba.nome}): ${data.length}`);

        // Inserir em lotes
        const batchSize = 1000;
        let inserted = 0;

        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);

          const values = batch
            .filter((row) => (row["Município"] || row["q0_9"]) && (row["Nome"] || row["q0_1"]) && row["IBGE"])
            .map((row) => {
              // Normalizar código IBGE para 6 dígitos
              const ibge = String(row["IBGE"] || "").trim();
              const codigoMunicipio = ibge.length >= 6 ? ibge.substring(0, 6) : ibge;

              // Determinar tipo baseado na aba ou coluna Tipo
              let tipo = aba.tipo;
              if (aba.nome === "Base 2024" && row["Tipo"]) {
                tipo = String(row["Tipo"]).toUpperCase();
              }

              return {
                codigoMunicipio,
                municipio: String(row["Município"] || row["Município2"] || row["q0_9"] || ""),
                uf: String(row["UF"] || row["Nome_UF"] || row["q0_10"] || ""),
                tipo,
                nome: String(row["Nome"] || row["q0_1"] || ""),
                endereco: row["Endereço Tratado"] ? String(row["Endereço Tratado"]) : (row["q0_2"] && row["q0_3"] && row["q0_4"] ? `${row["q0_2"]} ${row["q0_3"]}, ${row["q0_4"]}` : null),
                latitude: (() => {
                  const lat = row["latitude"] || row["Latitude"];
                  const val = lat ? parseFloat(String(lat).replace(",", ".")) : null;
                  return (val && val >= -90 && val <= 90) ? String(val) : null;
                })(),
                longitude: (() => {
                  const lng = row["longitude"] || row["Longitude"];
                  const val = lng ? parseFloat(String(lng).replace(",", ".")) : null;
                  return (val && val >= -180 && val <= 180) ? String(val) : null;
                })(),
                telefone: row["Telefone"] || row["q0_12"] ? String(row["Telefone"] || row["q0_12"]) : null,
                email: row["E-mail"] || row["q0_11"] ? String(row["E-mail"] || row["q0_11"]) : null,
                cep: row["CEP"] || row["q0_8"] ? String(row["CEP"] || row["q0_8"]) : null,
                bairro: row["Bairro da Cruz"] || row["Bairro"] || row["q0_6"] ? String(row["Bairro da Cruz"] || row["Bairro"] || row["q0_6"]) : null,
              };
            });

          if (values.length > 0) {
            await db.insert(equipamentosAssistencia).values(values);
            inserted += values.length;
            totalGeral += values.length;
            console.log(`[IMPORT] Inseridos ${inserted}/${data.length} registros...`);
          }
        }
        console.log(`[IMPORT] ✅ Aba "${aba.nome}" concluída: ${inserted} registros`);
      }

      console.log(`[IMPORT] ✅ Importação concluída: ${totalGeral} equipamentos`);

      return {
        success: true,
        total: totalGeral,
      };
    }),

  /**
   * Obter estatísticas dos dados importados
   */
  getStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Banco de dados não disponível");

    const { count } = await import("drizzle-orm");
    const escolasCount = await db.select({ value: count() }).from(escolas);
    const equipamentosCount = await db.select({ value: count() }).from(equipamentosAssistencia);

    return {
      escolas: escolasCount[0].value,
      equipamentos: equipamentosCount[0].value,
    };
  }),
});
