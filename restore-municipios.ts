import fs from "fs";
import mysql from "mysql2/promise";

async function main() {
  console.log("Reading sql...");
  const sql = fs.readFileSync("/tmp/municipios_seed.sql", "utf8").trim();
  if (!sql) {
    console.error("No SQL found");
    process.exit(1);
  }
  
  console.log("Connecting...");
  const pool = mysql.createPool(process.env.DATABASE_URL!);
  
  console.log("Truncating table...");
  await pool.query("TRUNCATE TABLE `municipios`");
  
  console.log("Inserting data (this might take a few seconds)...");
  await pool.query(sql);

  console.log("Done!");
  
  const [rows] = await pool.query("SELECT COUNT(*) as count FROM municipios");
  console.log("New count:", rows);

  process.exit(0);
}

main().catch(console.error);
