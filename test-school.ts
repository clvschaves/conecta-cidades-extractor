import { like } from "drizzle-orm";
import { getDb } from "./server/db.js";
import { escolas } from "./drizzle/schema.js";

async function test() {
    try {
        const db = await getDb();
        const e = await db.select().from(escolas).where(like(escolas.nome, "%FLOR DO AMAONAS%"));
        console.log(e);
        process.exit(0);
    } catch (error) {
        console.error(error);
    }
}
test();
