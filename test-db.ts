import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { extractions } from "./drizzle/schema.js"; // adjust path as needed

async function test() {
    try {
        const dbUrl = "mysql://root:conecta_cloud_password@localhost/conecta_cidades?socket=/cloudsql/universal-team-401112:us-central1:conecta-cidades-db";
        console.log("Connecting to:", dbUrl);
        // create raw connection
        const connection = await mysql.createConnection(dbUrl);
        console.log("Raw connection successful!");

        const db = drizzle(connection);

        // just test a select
        const result = await db.select().from(extractions).limit(1);
        console.log("Query successful", result);

        await connection.end();
    } catch (error) {
        console.error("Test failed:", error);
    }
}

test();
