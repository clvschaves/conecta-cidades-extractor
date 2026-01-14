import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { escolas } from "../../drizzle/schema";
import { EstabelecimentoEducacao } from "../../shared/estabelecimentos";

export async function extrairEstabelecimentosEducacao(
  codigoMunicipio: string,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<EstabelecimentoEducacao[]> {
  try {
    console.log(`\n[INEP] ========================================`);
    console.log(`[INEP] INICIANDO EXTRAÇÃO - Município: ${codigoMunicipio}`);
    console.log(`[INEP] ========================================\n`);

    const db = await getDb();
    if (!db) {
      throw new Error("Banco de dados não disponível");
    }

    console.log(`[INEP] Consultando escolas no banco de dados...`);

    // Buscar escolas do município
    const escolasResult = await db
      .select()
      .from(escolas)
      .where(eq(escolas.codigoMunicipio, codigoMunicipio));

    console.log(`[INEP] Total de escolas encontradas: ${escolasResult.length}`);

    if (escolasResult.length === 0) {
      console.log(`[INEP] ⚠️  Nenhuma escola encontrada para o município ${codigoMunicipio}`);
      console.log(`[INEP] Certifique-se de importar a planilha de educação na página de administração`);
    }

    const estabelecimentos: EstabelecimentoEducacao[] = [];

    for (let i = 0; i < escolasResult.length; i++) {
      const escola = escolasResult[i];
      
      if (i < 5) {
        console.log(`[INEP] ${i + 1} - ${escola.nome.substring(0, 50)}`);
      }

      estabelecimentos.push({
        codigoInep: escola.codigoInep,
        nome: escola.nome,
        tipo: "ESCOLA",
        endereco: `${escola.municipio}/${escola.uf}`,
      });

      if (onProgress && (i + 1) % 10 === 0) {
        onProgress(i + 1, escolasResult.length, `Processadas ${i + 1} escolas`);
      }
    }

    if (escolasResult.length > 5) {
      console.log(`[INEP] ... (${escolasResult.length - 5} escolas adicionais)`);
    }

    console.log(`\n[INEP] ========================================`);
    console.log(`[INEP] ✅ EXTRAÇÃO CONCLUÍDA`);
    console.log(`[INEP] Total de escolas encontradas: ${estabelecimentos.length}`);
    console.log(`[INEP] ========================================\n`);

    return estabelecimentos;
  } catch (error: any) {
    console.error("[INEP] ❌ Erro crítico na extração:");
    console.error("[INEP] Mensagem:", error.message);
    throw new Error(`Falha ao extrair dados de educação do INEP: ${error.message}`);
  }
}
