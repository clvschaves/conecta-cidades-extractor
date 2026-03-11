import { eq, like, or } from "drizzle-orm";
import { getDb } from "./server/db.js";
import { municipios, escolas, equipamentosAssistencia } from "./drizzle/schema.js";

async function test() {
    try {
        const db = await getDb();

        console.log("=== ESCOLAS Porto Velho ===");
        const e = await db.select().from(escolas).where(eq(escolas.municipio, "Porto Velho")).limit(5);
        console.log("Count for exactly Porto Velho:", e.length, e);

        const e2 = await db.select().from(escolas).where(like(escolas.municipio, "%Porto%")).limit(5);
        console.log("Count for %Porto%:", e2.length, e2);

        const m = await db.select().from(municipios).where(eq(municipios.codigoIbge, '110020'));
        console.log("Municipio:", m);

        process.exit(0);
    } catch (error) {
        console.error("Test failed:", error);
    }
}

test();
