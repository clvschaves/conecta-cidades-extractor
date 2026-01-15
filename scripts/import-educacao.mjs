import { drizzle } from "drizzle-orm/mysql2";
import { escolas } from "../drizzle/schema";
import XLSX from "xlsx";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function importEducacao() {
  console.log("🚀 Iniciando importação de dados de educação...\n");

  // Conectar ao banco
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada");
  }

  const db = drizzle(process.env.DATABASE_URL);

  // Ler planilha
  const filePath = join(__dirname, "../upload/educacao.xlsx");
  console.log(`📂 Lendo arquivo: ${filePath}`);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`📊 Total de registros encontrados: ${data.length}\n`);

  // Limpar tabela antes de importar
  console.log("🗑️  Limpando tabela de educação...");
  await db.delete(escolas);

  // Importar em lotes de 1000
  const batchSize = 1000;
  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const records = [];

    for (const row of batch) {
      // Extrair código IBGE do município (primeiros 6 ou 7 dígitos)
      const codigoInep = String(row["Código INEP"] || "").trim();
      const municipio = String(row["Município"] || "").trim();
      const nome = String(row["Escola"] || "").trim();
      const endereco = String(row["Endereço"] || "").trim();
      const uf = String(row["UF"] || "").trim();

      // Pular se não tiver dados essenciais
      if (!codigoInep || !municipio || !nome) {
        skipped++;
        continue;
      }

      // Extrair latitude e longitude
      let latitude = null;
      let longitude = null;

      const latStr = String(row["Latitude"] || "").trim();
      const lonStr = String(row["Longitude"] || "").trim();

      if (latStr && lonStr && latStr !== "" && lonStr !== "") {
        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);
        if (!isNaN(lat) && !isNaN(lon)) {
          latitude = lat;
          longitude = lon;
        }
      }

      records.push({
        codigoInep,
        municipio,
        uf,
        nome,
        endereco: endereco || null,
        latitude,
        longitude,
        restricaoAtendimento: String(row["Restrição de Atendimento"] || "").trim() || null,
        localizacao: String(row["Localização"] || "").trim() || null,
        categoriaAdministrativa: String(row["Categoria Administrativa"] || "").trim() || null,
        telefone: String(row["Telefone"] || "").trim() || null,
        dependenciaAdministrativa: String(row["Dependência Administrativa"] || "").trim() || null,
        porteEscola: String(row["Porte da Escola"] || "").trim() || null,
        etapasModalidade: String(row["Etapas e Modalidade de Ensino Oferecidas"] || "").trim() || null,
      });
    }

    if (records.length > 0) {
      await db.insert(escolas).values(records);
      imported += records.length;
      console.log(`✅ Importado lote ${Math.floor(i / batchSize) + 1}: ${imported} registros (${skipped} pulados)`);
    }
  }

  console.log(`\n✨ Importação concluída!`);
  console.log(`📊 Total importado: ${imported} registros`);
  console.log(`⚠️  Total pulado: ${skipped} registros`);

  process.exit(0);
}

importEducacao().catch((error) => {
  console.error("❌ Erro na importação:", error);
  process.exit(1);
});
