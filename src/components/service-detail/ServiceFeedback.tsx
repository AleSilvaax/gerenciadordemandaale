
import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui-custom/Rating";
import { Service, ServiceFeedback as ServiceFeedbackType } from "@/types/serviceTypes";
import { useAuth } from "@/context/AuthContext";
import { Star, MessageCircle, ThumbsUp } from "lucide-react";
import SectionCard from "@/components/service-detail/SectionCard";

interface ServiceFeedbackProps {
  service: Service;
  feedback: ServiceFeedbackType;
  setFeedback: (feedback: ServiceFeedbackType) => void;
  onSubmitFeedback: () => void;
}

export const ServiceFeedback: React.FC<ServiceFeedbackProps> = ({
  service,
  feedback,
  setFeedback,
  onSubmitFeedback
}) => {
  const { user } = useAuth();

  return (
    <SectionCard 
      title="Avaliação & Feedback" 
      description="Qualidade e observações do atendimento"
      rightSlot={
        service.feedback ? (
          <Badge variant="default" className="bg-gradient-to-r from-success/10 to-success/5 text-success border-success/30">
            <ThumbsUp className="w-3 h-3 mr-1" />
            Avaliado
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
            <Star className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        )
      }
    >
      {service.feedback ? (
        <div className="space-y-6">
          <div className="relative">
            <div className="bg-gradient-to-br from-primary/5 via-background/50 to-accent/5 rounded-xl p-6 border border-border/40">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                  <Star className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-foreground">Avaliação do Cliente</Label>
                  <p className="text-xs text-muted-foreground">Qualidade geral do atendimento</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <Rating value={service.feedback.clientRating} />
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">{service.feedback.clientRating}</span>
                  <span className="text-sm text-muted-foreground">/5 estrelas</span>
                </div>
              </div>
              
              {service.feedback.clientComment && (
                <div className="bg-gradient-to-br from-background/80 to-background/40 rounded-lg p-4 border border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Comentário do Cliente</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{service.feedback.clientComment}</p>
                </div>
              )}
            </div>
          </div>
          
          {service.feedback.technicianFeedback && (
            <div className="bg-gradient-to-br from-accent/5 via-background/50 to-secondary/5 rounded-xl p-6 border border-border/40">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-accent/20 to-secondary/20 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-foreground">Observações do Técnico</Label>
                  <p className="text-xs text-muted-foreground">Detalhes técnicos do atendimento</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-background/80 to-background/40 rounded-lg p-4 border border-border/30">
                <p className="text-sm leading-relaxed text-muted-foreground">{service.feedback.technicianFeedback}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary/5 via-background/50 to-accent/5 rounded-xl p-6 border border-border/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label className="text-sm font-semibold text-foreground">Avaliação do Cliente</Label>
                <p className="text-xs text-muted-foreground">Como você avalia este atendimento?</p>
              </div>
            </div>
            
            <div className="mb-4">
              <Rating
                value={feedback.clientRating}
                onChange={(value) => setFeedback({ ...feedback, clientRating: value })}
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-2 block">Comentário (opcional)</Label>
              <Textarea
                placeholder="Conte-nos sobre sua experiência com este atendimento..."
                value={feedback.clientComment || ""}
                onChange={(e) => setFeedback({ ...feedback, clientComment: e.target.value })}
                className="bg-gradient-to-br from-background/80 to-background/40 border-border/50 focus:border-primary/50 resize-none min-h-[80px]"
                rows={3}
              />
            </div>
          </div>
          
          {user?.role === "tecnico" && (
            <div className="bg-gradient-to-br from-accent/5 via-background/50 to-secondary/5 rounded-xl p-6 border border-border/40">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-accent/20 to-secondary/20 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-foreground">Observações Técnicas</Label>
                  <p className="text-xs text-muted-foreground">Detalhes sobre o atendimento realizado</p>
                </div>
              </div>
              <Textarea
                placeholder="Descreva os procedimentos realizados, observações técnicas ou recomendações..."
                value={feedback.technicianFeedback || ""}
                onChange={(e) => setFeedback({ ...feedback, technicianFeedback: e.target.value })}
                className="bg-gradient-to-br from-background/80 to-background/40 border-border/50 focus:border-accent/50 resize-none min-h-[80px]"
                rows={3}
              />
            </div>
          )}
          
          <Button 
            onClick={onSubmitFeedback} 
            className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-200"
            disabled={!feedback.clientRating}
          >
            <Star className="w-4 h-4 mr-2" />
            Salvar Avaliação
          </Button>
        </div>
      )}
    </SectionCard>
  );
};
