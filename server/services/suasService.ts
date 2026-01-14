import axios from "axios";
import * as XLSX from "xlsx";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { municipios } from "../../drizzle/schema";
import { EstabelecimentoAssistencia } from "../../shared/estabelecimentos";

const PLANILHA_ASSISTENCIA_URL =
  "https://docs.google.com/spreadsheets/d/1_Y5aFIhg2MVz-AB0o-yWiLOxFmeHu27W/export?format=xlsx";

function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function extrairEstabelecimentosAssistencia(
  codigoMunicipio: string,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<EstabelecimentoAssistencia[]> {
  try {
    console.log(`\n[SUAS] ========================================`);
    console.log(`[SUAS] INICIANDO EXTRAÇÃO - Município: ${codigoMunicipio}`);
    console.log(`[SUAS] ========================================\n`);

    // 1. Buscar nome do município no banco de dados
    console.log(`[SUAS] Buscando nome do município (código: ${codigoMunicipio})...`);
    const db = await getDb();
    
    if (!db) {
      throw new Error("Banco de dados não disponível");
    }

    const municipioResult = await db
      .select()
      .from(municipios)
      .where(eq(municipios.codigoIbge, codigoMunicipio))
      .limit(1);

    if (municipioResult.length === 0) {
      console.log(`[SUAS] ⚠️  Município não encontrado no banco de dados`);
      console.log(`[SUAS] Código IBGE: ${codigoMunicipio}`);
      return [];
    }

    const municipio = municipioResult[0];
    const nomeMunicipio = municipio.nome;
    const nomeMunicipioNormalizado = normalizarTexto(nomeMunicipio);

    console.log(`[SUAS] ✅ Município encontrado: ${nomeMunicipio}/${municipio.uf}`);

    // 2. Baixar planilha
    console.log(`[SUAS] Baixando planilha consolidada...`);
    
    const response = await axios.get(PLANILHA_ASSISTENCIA_URL, {
      responseType: "arraybuffer",
      timeout: 60000,
    });

    console.log(`[SUAS] Planilha baixada, processando dados...`);

    // 3. Ler planilha (primeira aba: "Base 2024")
    const workbook = XLSX.read(response.data, { type: "buffer" });
    const sheetName = workbook.SheetNames[0]; // "Base 2024"
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    console.log(`[SUAS] Total de registros na planilha: ${data.length}`);
    console.log(`[SUAS] Filtrando equipamentos de ${nomeMunicipio}...`);

    // 4. Filtrar por município
    const estabelecimentos: EstabelecimentoAssistencia[] = [];
    let processados = 0;

    for (const row of data) {
      // Colunas: "Município", "Tipo", "Nome", "Endereço Tratado"
      const municipioRow = String(row["Município"] || "");
      const tipo = String(row["Tipo"] || "");
      const nome = String(row["Nome"] || "");
      const endereco = String(row["Endereço Tratado"] || "");

      // Normalizar e comparar
      const municipioRowNormalizado = normalizarTexto(municipioRow);

      if (municipioRowNormalizado === nomeMunicipioNormalizado) {
        processados++;
        
        if (processados <= 5) {
          console.log(`[SUAS] ${processados} - ${tipo} - ${nome.substring(0, 40)}`);
        }

        // Determinar tipo (CRAS ou CREAS)
        let tipoFinal: "CRAS" | "CREAS" = "CRAS";
        if (tipo.toUpperCase().includes("CREAS")) {
          tipoFinal = "CREAS";
        }

        estabelecimentos.push({
          tipo: tipoFinal,
          nome: nome || `${tipo} - ${municipioRow}`,
          endereco: endereco || `${municipioRow}/${municipio.uf}`,
        });

        if (onProgress && processados % 5 === 0) {
          onProgress(processados, processados, `Processados ${processados} equipamentos`);
        }
      }
    }

    if (processados > 5) {
      console.log(`[SUAS] ... (${processados - 5} equipamentos adicionais)`);
    }

    console.log(`\n[SUAS] ========================================`);
    console.log(`[SUAS] ✅ EXTRAÇÃO CONCLUÍDA`);
    console.log(`[SUAS] Total de equipamentos encontrados: ${estabelecimentos.length}`);
    console.log(`[SUAS] ========================================\n`);

    return estabelecimentos;
  } catch (error) {
    console.error("[SUAS] ❌ Erro crítico na extração:", error);
    throw new Error("Falha ao extrair dados de assistência social do SUAS");
  }
}
