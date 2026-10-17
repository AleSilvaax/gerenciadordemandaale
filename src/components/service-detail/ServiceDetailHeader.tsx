import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ServiceDetailHeader: React.FC<{
  title?: string;
  number?: string | number;
}> = ({ title, number }) => {
  const formatShortOS = (num?: string | number) => {
    if (!num) return null;
    const parts = String(num).split("-");
    const last = parts[parts.length - 1].replace("#", "");
    return `OS #${last}`;
  };

  const shortOS = formatShortOS(number);

  return (
    <div className="flex items-center justify-between gap-3 pb-2">
      <div className="flex items-center gap-3 min-w-0">
        <Button
          asChild
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-lg border-slate-200 bg-white hover:bg-slate-50 shadow-2xs"
        >
          <Link to="/demandas" aria-label="Voltar para demandas">
            <ArrowLeft className="h-4 w-4 text-slate-700" />
          </Link>
        </Button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {shortOS && (
              <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md">
                {shortOS}
              </span>
            )}
            <span className="text-xs font-medium text-slate-500">
              Ordem de Serviço
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate mt-0.5">
            {title || "Detalhes da Demanda"}
          </h1>
        </div>
      </div>
    </div>
  );
};
