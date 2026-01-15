import XLSX from "xlsx";
import { drizzle } from "drizzle-orm/mysql2";
import { equipamentosAssistencia } from "../drizzle/schema.js";

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
    console.log("📖 Lendo planilha ConsolidadoPlanilhas.xlsx...");
    const workbook = XLSX.readFile("/home/ubuntu/conecta-cidades-extractor/uploads/ConsolidadoPlanilhas.xlsx");
    
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
          .filter((row) => row["Município"] && row["Nome"] && row["IBGE"])
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
              municipio: String(row["Município"] || row["Município2"] || ""),
              uf: String(row["UF"] || ""),
              tipo,
              nome: String(row["Nome"]),
              endereco: row["Endereço Tratado"] ? String(row["Endereço Tratado"]) : null,
              latitude: (() => {
                const val = row["latitude"] ? parseFloat(String(row["latitude"]).replace(",", ".")) : null;
                return (val && val >= -90 && val <= 90) ? val : null;
              })(),
              longitude: (() => {
                const val = row["longitude"] ? parseFloat(String(row["longitude"]).replace(",", ".")) : null;
                return (val && val >= -180 && val <= 180) ? val : null;
              })(),
              telefone: row["Telefone"] ? String(row["Telefone"]) : null,
              email: row["E-mail"] ? String(row["E-mail"]) : null,
              cep: row["CEP"] ? String(row["CEP"]) : null,
              bairro: row["Bairro da Cruz"] || row["Bairro"] ? String(row["Bairro da Cruz"] || row["Bairro"]) : null,
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
  } catch (error) {
    console.error("❌ Erro ao importar dados:", error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
