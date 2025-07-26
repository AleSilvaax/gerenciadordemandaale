
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui-custom/Rating";
import { Service, ServiceFeedback as ServiceFeedbackType } from "@/types/serviceTypes";
import { useOptimizedAuth } from "@/context/OptimizedAuthContext";
import { Star } from "lucide-react";

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
  const { user } = useOptimizedAuth();

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="w-5 h-5" />
          Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {service.feedback ? (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Avaliação do Cliente</Label>
              <div className="flex items-center gap-2 mt-1">
                <Rating value={service.feedback.clientRating} />
                <span className="text-sm text-muted-foreground">
                  ({service.feedback.clientRating}/5)
                </span>
              </div>
              {service.feedback.clientComment && (
                <div className="mt-2 p-3 bg-background/30 rounded-lg border border-border/30">
                  <p className="text-sm">{service.feedback.clientComment}</p>
                </div>
              )}
            </div>
            
            {service.feedback.technicianFeedback && (
              <div>
                <Label className="text-sm font-medium">Feedback do Técnico</Label>
                <div className="mt-1 p-3 bg-background/30 rounded-lg border border-border/30">
                  <p className="text-sm">{service.feedback.technicianFeedback}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Avaliação do Cliente</Label>
              <Rating
                value={feedback.clientRating}
                onChange={(value) => setFeedback({ ...feedback, clientRating: value })}
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">Comentário do Cliente</Label>
              <Textarea
                placeholder="Deixe seu comentário..."
                value={feedback.clientComment || ""}
                onChange={(e) => setFeedback({ ...feedback, clientComment: e.target.value })}
                className="bg-background/50 resize-none"
                rows={3}
              />
            </div>
            
            {user?.role === "tecnico" && (
              <div>
                <Label className="text-sm font-medium">Feedback do Técnico</Label>
                <Textarea
                  placeholder="Deixe seu feedback técnico..."
                  value={feedback.technicianFeedback || ""}
                  onChange={(e) => setFeedback({ ...feedback, technicianFeedback: e.target.value })}
                  className="bg-background/50 resize-none"
                  rows={3}
                />
              </div>
            )}
            
            <Button onClick={onSubmitFeedback} className="w-full">
              Salvar Feedback
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
