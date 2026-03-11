import XLSX from "xlsx";
import { drizzle } from "drizzle-orm/mysql2";
import { equipamentosAssistencia } from "../drizzle/schema.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não configurada");
  process.exit(1);
}

async function main() {
  console.log("🚀 Iniciando importação de dados de assistência social...\n");

  const db = drizzle(DATABASE_URL);

  try {
    // Ler planilha
    const filePath = join(__dirname, "../uploads/ConsolidadoPlanilhas.xlsx");
    console.log(`📖 Lendo planilha ${filePath}...`);
    const workbook = XLSX.readFile(filePath);

    // Limpar tabela
    console.log("🗑️  Limpando tabela existente...");
    await db.delete(equipamentosAssistencia);

    let totalInserido = 0;

    // Processar cada aba
    const abas = [
      { nome: "Base 2024", tipo: "CRAS/CREAS" },
      { nome: "Unidades de Acolhimento", tipo: "Unidade de Acolhimento" },
      { nome: "Centros Pop", tipo: "Centro Pop" }
    ];

    for (const aba of abas) {
      console.log(`\n📊 Processando aba: ${aba.nome}...`);

      if (!workbook.SheetNames.includes(aba.nome)) {
        console.log(`⚠️  Aba "${aba.nome}" não encontrada, pulando...`);
        continue;
      }

      const sheet = workbook.Sheets[aba.nome];
      const data = XLSX.utils.sheet_to_json(sheet);

      console.log(`   Total de linhas: ${data.length}`);

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

            const nome = String(row["Nome"] || row["q0_1"] || "");
            const enderecoBase = row["Endereço Tratado"] ? String(row["Endereço Tratado"]) : null;
            const enderecoAlt = row["q0_2"] && row["q0_3"] && row["q0_4"]
              ? `${row["q0_2"]} ${row["q0_3"]}, ${row["q0_4"]}`.trim()
              : null;
            const endereco = enderecoBase || enderecoAlt;

            const uf = String(row["UF"] || row["Nome_UF"] || row["q0_10"] || "");
            const bairro = row["Bairro da Cruz"] || row["Bairro"] || row["q0_6"] ? String(row["Bairro da Cruz"] || row["Bairro"] || row["q0_6"]) : null;

            return {
              codigoMunicipio,
              municipio: String(row["Município"] || row["Município2"] || row["q0_9"] || ""),
              uf,
              tipo,
              nome,
              endereco,
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
              bairro,
            };
          });

        if (values.length > 0) {
          await db.insert(equipamentosAssistencia).values(values);
          inserted += values.length;
          totalInserido += values.length;
          console.log(`   Inseridos ${inserted}/${data.length} registros...`);
        }
      }

      console.log(`   ✅ Aba "${aba.nome}" concluída: ${inserted} registros`);
    }

    console.log(`\n🎉 Importação concluída com sucesso!`);
    console.log(`📊 Total geral: ${totalInserido} equipamentos importados`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao importar dados:", error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
