import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, CheckCircle2, Database } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Admin() {
  const [educacaoFile, setEducacaoFile] = useState<File | null>(null);
  const [assistenciaFile, setAssistenciaFile] = useState<File | null>(null);
  const [uploadingEducacao, setUploadingEducacao] = useState(false);
  const [uploadingAssistencia, setUploadingAssistencia] = useState(false);

  const statsQuery = trpc.import.getStats.useQuery();
  const importEducacaoMutation = trpc.import.importEducacao.useMutation();
  const importAssistenciaMutation = trpc.import.importAssistencia.useMutation();

  const handleUploadEducacao = async () => {
    if (!educacaoFile) return;

    setUploadingEducacao(true);
    try {
      // Upload para S3
      const formData = new FormData();
      formData.append("file", educacaoFile);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Falha no upload do arquivo");
      }

      const { url } = await uploadResponse.json();

      // Importar dados
      await importEducacaoMutation.mutateAsync({ fileUrl: url });

      toast.success("Planilha de Educação importada com sucesso!");
      setEducacaoFile(null);
      statsQuery.refetch();
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setUploadingEducacao(false);
    }
  };

  const handleUploadAssistencia = async () => {
    if (!assistenciaFile) return;

    setUploadingAssistencia(true);
    try {
      // Upload para S3
      const formData = new FormData();
      formData.append("file", assistenciaFile);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Falha no upload do arquivo");
      }

      const { url } = await uploadResponse.json();

      // Importar dados
      await importAssistenciaMutation.mutateAsync({ fileUrl: url });

      toast.success("Planilha de Assistência Social importada com sucesso!");
      setAssistenciaFile(null);
      statsQuery.refetch();
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setUploadingAssistencia(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Administração</h1>
          <p className="text-gray-600">Importar planilhas consolidadas de Educação e Assistência Social</p>
        </div>

        {/* Estatísticas */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Dados Armazenados
            </CardTitle>
            <CardDescription>Registros atualmente no banco de dados</CardDescription>
          </CardHeader>
          <CardContent>
            {statsQuery.isLoading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {statsQuery.data?.escolas.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-600">Escolas (INEP)</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">
                    {statsQuery.data?.equipamentos.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-600">Equipamentos (SUAS)</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Educação */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Planilha de Educação (INEP)</CardTitle>
            <CardDescription>
              Faça upload da planilha consolidada do Censo Escolar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>Formato esperado:</strong> Arquivo XLSX com colunas: "Código INEP", "Escola", "Município", "UF", "Restrição de Atendimento"
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="educacao-file">Selecionar Arquivo</Label>
              <Input
                id="educacao-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setEducacaoFile(e.target.files?.[0] || null)}
                disabled={uploadingEducacao}
              />
            </div>

            <Button
              onClick={handleUploadEducacao}
              disabled={!educacaoFile || uploadingEducacao}
              className="w-full"
            >
              {uploadingEducacao ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Planilha de Educação
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Upload Assistência */}
        <Card>
          <CardHeader>
            <CardTitle>Planilha de Assistência Social (SUAS)</CardTitle>
            <CardDescription>
              Faça upload da planilha consolidada do Censo SUAS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>Formato esperado:</strong> Arquivo XLSX com colunas: "Município", "Tipo", "Nome", "Endereço Tratado"
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="assistencia-file">Selecionar Arquivo</Label>
              <Input
                id="assistencia-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setAssistenciaFile(e.target.files?.[0] || null)}
                disabled={uploadingAssistencia}
              />
            </div>

            <Button
              onClick={handleUploadAssistencia}
              disabled={!assistenciaFile || uploadingAssistencia}
              className="w-full"
            >
              {uploadingAssistencia ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Planilha de Assistência
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <a href="/" className="text-blue-600 hover:underline">
            ← Voltar para Extração
          </a>
        </div>
      </div>
    </div>
  );
}
