import "dotenv/config";
import express from "express";
import path from "path";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import uploadRouter from "../routes/upload";
import { sseLogsHandler } from "../routes/sse";
import fs from "fs";

export function serveStatic(app: express.Express) {
    const distPath = path.resolve(process.cwd(), "dist", "public");
    if (!fs.existsSync(distPath)) {
        console.error(
            `Could not find the build directory: ${distPath}, make sure to build the client first`
        );
    }

    app.use(express.static(distPath));

    // fall through to index.html if the file doesn't exist
    app.use("*", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
    });
}

function isPortAvailable(port: number): Promise<boolean> {
    return new Promise(resolve => {
        const server = net.createServer();
        server.listen(port, () => {
            server.close(() => resolve(true));
        });
        server.on("error", () => resolve(false));
    });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
    for (let port = startPort; port < startPort + 20; port++) {
        if (await isPortAvailable(port)) {
            return port;
        }
    }
    throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
    const app = express();
    const server = createServer(app);
    // Configure body parser with larger size limit for file uploads
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ limit: "50mb", extended: true }));
    // OAuth callback under /api/oauth/callback
    registerOAuthRoutes(app);
    // Upload route
    app.use("/api", uploadRouter);
    // Servir arquivos de uploads locais
    const uploadsDir = path.join(process.cwd(), "uploads");
    app.use("/uploads", express.static(uploadsDir));
    // SSE route for real-time logs
    app.get("/api/extraction/:extractionId/logs", sseLogsHandler);
    // tRPC API
    app.use(
        "/api/trpc",
        createExpressMiddleware({
            router: appRouter,
            createContext,
        })
    );

    // statically mapped
    serveStatic(app);

    const preferredPort = parseInt(process.env.PORT || "3000");
    const port = await findAvailablePort(preferredPort);

    if (port !== preferredPort) {
        console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
    }

    server.listen(port, () => {
        console.log(`Server running on http://localhost:${port}/`);
    });
}

startServer().catch(console.error);
