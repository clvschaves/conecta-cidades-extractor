import axios from "axios";
import { drizzle } from "drizzle-orm/mysql2";
import { municipios } from "../drizzle/schema.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não configurada");
  process.exit(1);
}

async function main() {
  console.log("🚀 Iniciando população da tabela de municípios...\n");

  // Conectar ao banco
  const db = drizzle(DATABASE_URL);

  try {
    // Buscar municípios da API do IBGE
    console.log("📡 Buscando municípios da API do IBGE...");
    const response = await axios.get(
      "https://servicodados.ibge.gov.br/api/v1/localidades/municipios",
      { timeout: 30000 }
    );

    const municipiosData = response.data;
    console.log(`✅ ${municipiosData.length} municípios encontrados\n`);

    // Inserir em lotes de 1000
    const batchSize = 1000;
    let inserted = 0;

    for (let i = 0; i < municipiosData.length; i += batchSize) {
      const batch = municipiosData.slice(i, i + batchSize);
      
      const values = batch
        .filter((m) => m.microrregiao?.mesorregiao?.UF?.sigla) // Filtrar dados incompletos
        .map((m) => ({
          codigoIbge: String(m.id),
          nome: m.nome,
          uf: m.microrregiao.mesorregiao.UF.sigla,
        }));

      await db.insert(municipios).values(values).onDuplicateKeyUpdate({
        set: { nome: values[0].nome }, // Dummy update para ignorar duplicatas
      });

      inserted += batch.length;
      console.log(`✅ Inseridos ${inserted}/${municipiosData.length} municípios`);
    }

    console.log(`\n🎉 Tabela de municípios populada com sucesso!`);
    console.log(`📊 Total: ${inserted} municípios`);
  } catch (error) {
    console.error("❌ Erro ao popular tabela:", error.message);
    process.exit(1);
  }
}

main();
