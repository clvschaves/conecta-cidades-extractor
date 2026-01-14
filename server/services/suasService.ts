import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { equipamentosAssistencia, municipios } from "../../drizzle/schema";
import { EstabelecimentoAssistencia } from "../../shared/estabelecimentos";

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

    const db = await getDb();
    if (!db) {
      throw new Error("Banco de dados não disponível");
    }

    // 1. Buscar nome do município
    console.log(`[SUAS] Buscando nome do município (código: ${codigoMunicipio})...`);

    const municipioResult = await db
      .select()
      .from(municipios)
      .where(eq(municipios.codigoIbge, codigoMunicipio))
      .limit(1);

    if (municipioResult.length === 0) {
      console.log(`[SUAS] ⚠️  Município não encontrado no banco de dados`);
      return [];
    }

    const municipio = municipioResult[0];
    const nomeMunicipio = municipio.nome;
    const nomeMunicipioNormalizado = normalizarTexto(nomeMunicipio);

    console.log(`[SUAS] ✅ Município encontrado: ${nomeMunicipio}/${municipio.uf}`);

    // 2. Buscar equipamentos do município
    console.log(`[SUAS] Consultando equipamentos no banco de dados...`);

    const equipamentosResult = await db
      .select()
      .from(equipamentosAssistencia);

    // Filtrar por município (normalizado)
    const equipamentosFiltrados = equipamentosResult.filter((eq) => {
      const municipioEq = normalizarTexto(eq.municipio);
      return municipioEq === nomeMunicipioNormalizado;
    });

    console.log(`[SUAS] Total de equipamentos encontrados: ${equipamentosFiltrados.length}`);

    if (equipamentosFiltrados.length === 0) {
      console.log(`[SUAS] ⚠️  Nenhum equipamento encontrado para ${nomeMunicipio}`);
      console.log(`[SUAS] Certifique-se de importar a planilha de assistência na página de administração`);
    }

    const estabelecimentos: EstabelecimentoAssistencia[] = [];

    for (let i = 0; i < equipamentosFiltrados.length; i++) {
      const equip = equipamentosFiltrados[i];
      
      if (i < 5) {
        console.log(`[SUAS] ${i + 1} - ${equip.tipo} - ${equip.nome.substring(0, 40)}`);
      }

      estabelecimentos.push({
        tipo: equip.tipo as "CRAS" | "CREAS",
        nome: equip.nome,
        endereco: equip.endereco || `${municipio.nome}/${municipio.uf}`,
      });

      if (onProgress && (i + 1) % 5 === 0) {
        onProgress(i + 1, equipamentosFiltrados.length, `Processados ${i + 1} equipamentos`);
      }
    }

    if (equipamentosFiltrados.length > 5) {
      console.log(`[SUAS] ... (${equipamentosFiltrados.length - 5} equipamentos adicionais)`);
    }

    console.log(`\n[SUAS] ========================================`);
    console.log(`[SUAS] ✅ EXTRAÇÃO CONCLUÍDA`);
    console.log(`[SUAS] Total de equipamentos encontrados: ${estabelecimentos.length}`);
    console.log(`[SUAS] ========================================\n`);

    return estabelecimentos;
  } catch (error: any) {
    console.error("[SUAS] ❌ Erro crítico na extração:");
    console.error("[SUAS] Mensagem:", error.message);
    throw new Error(`Falha ao extrair dados de assistência social do SUAS: ${error.message}`);
  }
}
