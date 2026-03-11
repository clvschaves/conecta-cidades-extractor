import { eq, like, or } from "drizzle-orm";
import { getDb } from "./server/db.js";
import { municipios, escolas, equipamentosAssistencia } from "./drizzle/schema.js";

async function test() {
    try {
        const db = await getDb();
        if (!db) {
            console.error("No DB");
            return;
        }

        const codigoIbge = "110020";

        console.log("=== MUNICIPIOS ===");
        const m = await db.select().from(municipios).where(eq(municipios.codigoIbge, codigoIbge));
        console.log(m);

        console.log("=== ESCOLAS ===");
        const e = await db.select().from(escolas).where(like(escolas.municipio, "%Porto Velho%")).limit(5);
        console.log(e);

        console.log("=== SUAS ===");
        const s = await db.select().from(equipamentosAssistencia).where(like(equipamentosAssistencia.municipio, "%Porto Velho%")).limit(5);
        console.log(s);

        const s2 = await db.select().from(equipamentosAssistencia).where(like(equipamentosAssistencia.codigoMunicipio, "%110020%")).limit(5);
        console.log("SUAS por codigo:");
        console.log(s2);

        process.exit(0);
    } catch (error) {
        console.error("Test failed:", error);
    }
}

test();
