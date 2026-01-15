/**
 * Gerenciador de logs em memória para transmissão via SSE
 */

type LogEntry = {
  timestamp: Date;
  message: string;
  level: "info" | "success" | "error" | "warning";
};

type ExtractionLogs = {
  logs: LogEntry[];
  completed: boolean;
};

// Armazenar logs em memória (por extractionId)
const extractionLogs = new Map<number, ExtractionLogs>();

// Callbacks SSE (por extractionId)
const sseCallbacks = new Map<number, Set<(log: LogEntry) => void>>();

/**
 * Adicionar log para uma extração
 */
export function addLog(
  extractionId: number,
  message: string,
  level: "info" | "success" | "error" | "warning" = "info"
): void {
  const log: LogEntry = {
    timestamp: new Date(),
    message,
    level,
  };

  // Armazenar em memória
  if (!extractionLogs.has(extractionId)) {
    extractionLogs.set(extractionId, { logs: [], completed: false });
  }

  const extraction = extractionLogs.get(extractionId)!;
  extraction.logs.push(log);

  // Limitar a 1000 logs por extração
  if (extraction.logs.length > 1000) {
    extraction.logs.shift();
  }

  // Notificar callbacks SSE
  const callbacks = sseCallbacks.get(extractionId);
  if (callbacks) {
    callbacks.forEach((callback) => callback(log));
  }

  // Log no console do servidor também
  const timestamp = log.timestamp.toLocaleTimeString("pt-BR");
  const prefix = `[${extractionId}]`;
  console.log(`${prefix} [${timestamp}] ${log.message}`);
}

/**
 * Marcar extração como concluída
 */
export function markCompleted(extractionId: number): void {
  const extraction = extractionLogs.get(extractionId);
  if (extraction) {
    extraction.completed = true;
  }
}

/**
 * Obter logs de uma extração
 */
export function getLogs(extractionId: number): LogEntry[] {
  return extractionLogs.get(extractionId)?.logs || [];
}

/**
 * Verificar se extração está concluída
 */
export function isCompleted(extractionId: number): boolean {
  return extractionLogs.get(extractionId)?.completed || false;
}

/**
 * Registrar callback SSE
 */
export function registerSSECallback(
  extractionId: number,
  callback: (log: LogEntry) => void
): () => void {
  if (!sseCallbacks.has(extractionId)) {
    sseCallbacks.set(extractionId, new Set());
  }

  const callbacks = sseCallbacks.get(extractionId)!;
  callbacks.add(callback);

  // Retornar função de cleanup
  return () => {
    callbacks.delete(callback);
    if (callbacks.size === 0) {
      sseCallbacks.delete(extractionId);
    }
  };
}

/**
 * Limpar logs antigos (chamar periodicamente)
 */
export function cleanupOldLogs(maxAgeMinutes: number = 60): void {
  const now = Date.now();
  const maxAge = maxAgeMinutes * 60 * 1000;

  for (const [extractionId, extraction] of Array.from(extractionLogs.entries())) {
    if (extraction.completed && extraction.logs.length > 0) {
      const lastLog = extraction.logs[extraction.logs.length - 1];
      const age = now - lastLog.timestamp.getTime();

      if (age > maxAge) {
        extractionLogs.delete(extractionId);
        sseCallbacks.delete(extractionId);
      }
    }
  }
}

// Limpar logs antigos a cada 10 minutos
setInterval(() => cleanupOldLogs(60), 10 * 60 * 1000);
