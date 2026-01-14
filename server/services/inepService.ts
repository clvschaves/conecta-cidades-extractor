import axios from "axios";
import * as XLSX from "xlsx";
import { EstabelecimentoEducacao } from "../../shared/estabelecimentos";

const PLANILHA_EDUCACAO_URL =
  "https://docs.google.com/spreadsheets/d/1wA0KrufO1nnyoUKuqi8ZLbGRlH_UWqB5/export?format=xlsx";

function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function extrairEstabelecimentosEducacao(
  codigoMunicipio: string,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<EstabelecimentoEducacao[]> {
  try {
    console.log(`\n[INEP] ========================================`);
    console.log(`[INEP] INICIANDO EXTRAÇÃO - Município: ${codigoMunicipio}`);
    console.log(`[INEP] ========================================\n`);

    console.log(`[INEP] Baixando planilha consolidada...`);
    
    // Baixar planilha
    const response = await axios.get(PLANILHA_EDUCACAO_URL, {
      responseType: "arraybuffer",
      timeout: 60000,
    });

    console.log(`[INEP] Planilha baixada, processando dados...`);

    // Ler planilha
    const workbook = XLSX.read(response.data, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    console.log(`[INEP] Total de registros na planilha: ${data.length}`);

    // Buscar nome do município pelo código IBGE
    // Primeiro, vamos extrair o município de um registro qualquer que tenha o código
    let nomeMunicipioBusca = "";
    
    // Tentar encontrar o município pelo código IBGE (primeiros 6 dígitos)
    const codigoBase = codigoMunicipio.substring(0, 6);
    
    // Como não temos uma API de municípios, vamos filtrar diretamente
    // A planilha tem a coluna "Município" que podemos usar
    
    console.log(`[INEP] Filtrando escolas do município (código: ${codigoMunicipio})...`);

    const estabelecimentos: EstabelecimentoEducacao[] = [];
    let processados = 0;

    for (const row of data) {
      // A planilha tem as colunas: "Restrição de Atendimento", "Escola", "Código INEP", "UF", "Município"
      const codigoINEP = String(row["Código INEP"] || "");
      const municipio = String(row["Município"] || "");
      const uf = String(row["UF"] || "");
      const nomeEscola = String(row["Escola"] || "");
      const restricao = String(row["Restrição de Atendimento"] || "");

      // Filtrar apenas escolas ativas (não paralisadas)
      if (restricao.includes("PARALISADA")) {
        continue;
      }

      // O código INEP tem 8 dígitos, os 7 primeiros são o código do município
      // Comparar os primeiros 6 ou 7 dígitos
      if (codigoINEP.startsWith(codigoBase) || codigoINEP.startsWith(codigoMunicipio)) {
        processados++;
        
        if (processados <= 5) {
          console.log(`[INEP] ${processados} - ${nomeEscola.substring(0, 50)}`);
        }

        estabelecimentos.push({
          codigoInep: codigoINEP,
          nome: nomeEscola,
          tipo: "Escola",
          endereco: `${municipio}/${uf}`, // Endereço básico, pode ser melhorado
        });

        if (onProgress && processados % 10 === 0) {
          onProgress(processados, processados, `Processadas ${processados} escolas`);
        }
      }
    }

    if (processados > 5) {
      console.log(`[INEP] ... (${processados - 5} escolas adicionais)`);
    }

    console.log(`\n[INEP] ========================================`);
    console.log(`[INEP] ✅ EXTRAÇÃO CONCLUÍDA`);
    console.log(`[INEP] Total de escolas encontradas: ${estabelecimentos.length}`);
    console.log(`[INEP] ========================================\n`);

    return estabelecimentos;
  } catch (error) {
    console.error("[INEP] ❌ Erro crítico na extração:", error);
    throw new Error("Falha ao extrair dados de educação do INEP");
  }
}
