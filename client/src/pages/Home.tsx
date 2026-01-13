import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Loader2, Download, CheckCircle2, XCircle, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

type ExtractionPhase = "idle" | "saude" | "educacao" | "assistencia" | "geocoding" | "generating" | "completed" | "error";

export default function Home() {
  const [municipioCode, setMunicipioCode] = useState("");
  const [extractionId, setExtractionId] = useState<number | null>(null);
  const [phase, setPhase] = useState<ExtractionPhase>("idle");

  const startExtractionMutation = trpc.extraction.startExtraction.useMutation({
    onSuccess: (data) => {
      setExtractionId(data.extractionId);
      setPhase("saude");
      toast.success("Extração iniciada!");
    },
    onError: (error) => {
      toast.error(error.message);
      setPhase("error");
    },
  });

  const { data: extractionStatus, refetch } = trpc.extraction.getExtractionStatus.useQuery(
    { extractionId: extractionId! },
    { enabled: extractionId !== null, refetchInterval: 2000 }
  );

  useEffect(() => {
    if (extractionStatus) {
      if (extractionStatus.status === "completed") {
        setPhase("completed");
      } else if (extractionStatus.status === "failed") {
        setPhase("error");
        toast.error(extractionStatus.errorMessage || "Erro na extração");
      }
    }
  }, [extractionStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!municipioCode.trim()) {
      toast.error("Por favor, insira o código do município");
      return;
    }

    if (!/^\d{6,7}$/.test(municipioCode.trim())) {
      toast.error("Código IBGE deve conter 6 ou 7 dígitos numéricos");
      return;
    }

    startExtractionMutation.mutate({ municipioCode: municipioCode.trim() });
  };

  const handleReset = () => {
    setMunicipioCode("");
    setExtractionId(null);
    setPhase("idle");
  };

  const getPhaseMessage = () => {
    switch (phase) {
      case "saude":
        return "Coletando dados de Saúde (CNES)...";
      case "educacao":
        return "Coletando dados de Educação (INEP)...";
      case "assistencia":
        return "Coletando dados de Assistência Social (SUAS)...";
      case "geocoding":
        return "Geocodificando endereços...";
      case "generating":
        return "Gerando arquivo XLSX...";
      case "completed":
        return "Extração concluída com sucesso!";
      case "error":
        return "Erro durante a extração";
      default:
        return "";
    }
  };

  const getProgress = () => {
    switch (phase) {
      case "saude":
        return 20;
      case "educacao":
        return 40;
      case "assistencia":
        return 60;
      case "geocoding":
        return 80;
      case "generating":
        return 90;
      case "completed":
        return 100;
      default:
        return 0;
    }
  };

  const isProcessing = phase !== "idle" && phase !== "completed" && phase !== "error";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Conecta Cidades</h1>
          <p className="text-lg text-gray-600">Extrator de Dados Municipais</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Gerar Planilha de Equipamentos Públicos</CardTitle>
            <CardDescription>
              Insira o código IBGE do município para extrair automaticamente dados de Saúde, Educação e Assistência Social
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {phase === "idle" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="codigo" className="text-sm font-medium">
                    Código IBGE do Município
                  </label>
                  <Input
                    id="codigo"
                    type="text"
                    placeholder="Ex: 270030 ou 2700300"
                    value={municipioCode}
                    onChange={(e) => setMunicipioCode(e.target.value)}
                    maxLength={7}
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-gray-500">
                    Digite o código de 6 ou 7 dígitos do município
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Iniciar Extração
                    </>
                  )}
                </Button>
              </form>
            )}

            {isProcessing && (
              <div className="space-y-4">
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>{getPhaseMessage()}</AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progresso</span>
                    <span>{getProgress()}%</span>
                  </div>
                  <Progress value={getProgress()} className="h-2" />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {phase === "saude" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    <span>Coleta Saúde em andamento</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {phase === "educacao" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    ) : phase === "saude" ? (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    <span>Coleta Educação em andamento</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {phase === "assistencia" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    ) : ["saude", "educacao"].includes(phase) ? (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    <span>Coleta Assistência Social em andamento</span>
                  </div>
                </div>
              </div>
            )}

            {phase === "completed" && extractionStatus && (
              <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Extração concluída com sucesso!
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {extractionStatus.totalSaude || 0}
                    </div>
                    <div className="text-xs text-gray-600">Saúde</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {extractionStatus.totalEducacao || 0}
                    </div>
                    <div className="text-xs text-gray-600">Educação</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {extractionStatus.totalAssistencia || 0}
                    </div>
                    <div className="text-xs text-gray-600">Assistência</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <a href={extractionStatus.fileUrl || "#"} download="conecta-cidades.xlsx">
                      <Download className="mr-2 h-4 w-4" />
                      Download XLSX
                    </a>
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    Nova Extração
                  </Button>
                </div>
              </div>
            )}

            {phase === "error" && (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    {extractionStatus?.errorMessage || "Erro ao processar extração"}
                  </AlertDescription>
                </Alert>
                <Button variant="outline" onClick={handleReset} className="w-full">
                  Tentar Novamente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Sistema automatizado de coleta de dados de equipamentos públicos municipais
          </p>
          <p className="mt-1">Fontes: CNES (Saúde), INEP (Educação), SUAS (Assistência Social)</p>
        </div>
      </div>
    </div>
  );
}
