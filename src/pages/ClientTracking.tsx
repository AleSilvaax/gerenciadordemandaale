import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Service } from "@/types/serviceTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import {
  Layers,
  MapPin,
  Calendar,
  Clock,
  User,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const ClientTracking: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugDetail, setDebugDetail] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    const fetchServiceByToken = async () => {
      if (!token) {
        setErrorMessage("Link de rastreio inválido.");
        setIsLoading(false);
        return;
      }
      try {
        // Tenta buscar a demanda pelo ID (token)
        const { data, error } = await supabase
          .from("services")
          .select("*, technicians:profiles(id, name, avatar, role)")
          .eq("id", token)
          .maybeSingle();

        if (error) {
          console.error("Erro Supabase RLS:", error);
          setErrorMessage("Erro ao aceder à base de dados.");
          setDebugDetail(error.message);
          throw error;
        }

        if (data) {
          setService(data as any);
        } else {
          setErrorMessage("Atendimento não encontrado.");
          setDebugDetail(`Nenhum registo encontrado para o ID: ${token}`);
        }
      } catch (err: any) {
        console.error("Erro ao carregar rastreio:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceByToken();
  }, [token]);

  const handleDownloadReport = async () => {
    if (!service) return;
    setIsGeneratingPdf(true);
    const toastId = toast.loading("A descarregar o relatório oficial...");
    try {
      const { generateProfessionalServiceReport } = await import(
        "@/utils/pdf/professionalPdfGenerator"
      );
      await generateProfessionalServiceReport(service);
      toast.success("Relatório descarregado com sucesso!", { id: toastId });
    } catch (error) {
      console.error("Erro ao gerar PDF no tracking:", error);
      toast.error("Não foi possível descarregar o relatório.", { id: toastId });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-600">A carregar detalhes do atendimento...</p>
      </div>
    );
  }

  if (errorMessage || !service) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Não foi possível carregar o rastreio</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          {errorMessage}
        </p>
        {debugDetail && (
          <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 max-w-sm overflow-x-auto">
            <p className="text-[10px] font-mono text-rose-600 text-left">Detalhe técnico: {debugDetail}</p>
          </div>
        )}
      </div>
    );
  }

  const technician = service.technicians?.[0];
  const isConcluded = service.status === "concluido";

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-5">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
            <Layers className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-white">ServiceFlow</span>
          <p className="text-xs text-slate-500">Portal de Acompanhamento em Tempo Real</p>
        </div>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex flex-row items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Ordem de Serviço
              </p>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {service.title}
              </CardTitle>
            </div>
            <StatusBadge status={service.status} />
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <MapPin className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-400">Local do Atendimento</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {[service.address, service.city].filter(Boolean).join(", ") || service.location || "São Paulo"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <Calendar className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-400">Previsão / Vencimento</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white font-mono">
                    {service.dueDate ? format(new Date(service.dueDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "A definir"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Profissional Responsável
              </p>
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200/80 bg-white">
                <Avatar className="h-10 w-10 border border-slate-200">
                  <AvatarImage src={technician?.avatar} />
                  <AvatarFallback className="bg-blue-50 text-blue-600 text-xs font-bold">
                    {technician?.name ? technician.name.slice(0, 2).toUpperCase() : "T"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold text-slate-900 capitalize">
                    {technician?.name || "Técnico em designação"}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">
                    {technician?.role || "Especialista em Campo"}
                  </p>
                </div>
              </div>
            </div>

            {isConcluded && (
              <div className="pt-2">
                <Button
                  onClick={handleDownloadReport}
                  disabled={isGeneratingPdf}
                  className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      A preparar documento...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Descarregar Relatório de Atendimento (PDF)
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientTracking;
