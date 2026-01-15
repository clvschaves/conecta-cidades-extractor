import { z } from "zod";
import * as XLSX from "xlsx";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { escolas, equipamentosAssistencia } from "../../drizzle/schema";

export const importRouter = router({
  /**
   * Importar planilha de educação (INEP)
   */
  importEducacao: protectedProcedure
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
  importAssistencia: protectedProcedure
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

      // Ler planilha
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data: any[] = XLSX.utils.sheet_to_json(worksheet);

      console.log(`[IMPORT] Total de registros: ${data.length}`);

      // Limpar tabela anterior
      await db.delete(equipamentosAssistencia);

      // Inserir em lotes
      const batchSize = 1000;
      let inserted = 0;

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        const values = batch
          .filter((row) => row["Município"] && row["Nome"] && row["IBGE"] && row["UF"])
          .map((row) => ({
            codigoMunicipio: String(row["IBGE"]).substring(0, 6),
            municipio: String(row["Município"]),
            uf: String(row["UF"]),
            tipo: String(row["Tipo"] || "CRAS"),
            nome: String(row["Nome"]),
            endereco: row["Endereço Tratado"] ? String(row["Endereço Tratado"]) : null,
            latitude: row["latitude"] ? String(row["latitude"]) : null,
            longitude: row["longitude"] ? String(row["longitude"]) : null,
            telefone: row["Telefone"] ? String(row["Telefone"]) : null,
            email: row["E-mail"] ? String(row["E-mail"]) : null,
            cep: row["CEP"] ? String(row["CEP"]) : null,
            bairro: row["Bairro da Cruz"] ? String(row["Bairro da Cruz"]) : null,
          }));

        if (values.length > 0) {
          await db.insert(equipamentosAssistencia).values(values);
          inserted += values.length;
          console.log(`[IMPORT] Inseridos ${inserted} registros...`);
        }
      }

      console.log(`[IMPORT] ✅ Importação concluída: ${inserted} equipamentos`);

      return {
        success: true,
        total: inserted,
      };
    }),

  /**
   * Obter estatísticas dos dados importados
   */
  getStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Banco de dados não disponível");

    const escolasCount = await db.select().from(escolas);
    const equipamentosCount = await db.select().from(equipamentosAssistencia);

    return {
      escolas: escolasCount.length,
      equipamentos: equipamentosCount.length,
    };
  }),
});
