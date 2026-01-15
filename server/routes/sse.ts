import { Request, Response } from "express";
import {
  getLogs,
  isCompleted,
  registerSSECallback,
} from "../services/logManager";

/**
 * Endpoint SSE para transmitir logs em tempo real
 */
export function sseLogsHandler(req: Request, res: Response) {
  const extractionId = parseInt(req.params.extractionId);

  if (isNaN(extractionId)) {
    res.status(400).send("Invalid extraction ID");
    return;
  }

  // Configurar headers SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Nginx

  // Enviar logs existentes
  const existingLogs = getLogs(extractionId);
  for (const log of existingLogs) {
    const data = JSON.stringify({
      timestamp: log.timestamp.toISOString(),
      message: log.message,
      level: log.level,
    });
    res.write(`data: ${data}\n\n`);
  }

  // Verificar se já está concluído
  if (isCompleted(extractionId)) {
    res.write(`event: complete\ndata: {}\n\n`);
    res.end();
    return;
  }

  // Registrar callback para novos logs
  const cleanup = registerSSECallback(extractionId, (log) => {
    const data = JSON.stringify({
      timestamp: log.timestamp.toISOString(),
      message: log.message,
      level: log.level,
    });
    res.write(`data: ${data}\n\n`);

    // Se completou, enviar evento de conclusão e fechar
    if (isCompleted(extractionId)) {
      res.write(`event: complete\ndata: {}\n\n`);
      res.end();
    }
  });

  // Cleanup ao fechar conexão
  req.on("close", () => {
    cleanup();
  });

  // Keepalive a cada 30 segundos
  const keepalive = setInterval(() => {
    res.write(": keepalive\n\n");
  }, 30000);

  req.on("close", () => {
    clearInterval(keepalive);
  });
}
