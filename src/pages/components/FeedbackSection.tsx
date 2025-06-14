
import React from "react";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle2 } from "lucide-react";

interface FeedbackSectionProps {
  service: any;
  feedbackForm: any;
  statusUpdating: boolean;
  onFinalize: () => void;
  onSubmit: (data: any) => void;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({
  service,
  feedbackForm,
  statusUpdating,
  onFinalize,
  onSubmit,
}) => {
  if (service.status !== 'concluido') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">
          O feedback estará disponível quando a demanda for concluída.
        </p>
        <Button 
          variant="outline" 
          onClick={() => onFinalize()}
          className="mt-4"
          disabled={statusUpdating}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Finalizar Demanda
        </Button>
      </div>
    );
  }
  if (service.feedback) {
    return (
      <div className="space-y-6">
        <div>
          <h4 className="font-medium mb-3">Avaliação do Cliente</h4>
          <div className="flex items-center mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-6 w-6 ${
                  star <= (service.feedback?.clientRating || 0)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="ml-2 font-medium">
              {service.feedback.clientRating}/5
            </span>
          </div>
          {service.feedback.clientComment && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-2">
              <p className="text-sm">{service.feedback.clientComment}</p>
            </div>
          )}
        </div>
        {service.feedback.technicianFeedback && (
          <div>
            <h4 className="font-medium mb-3">Feedback do Técnico</h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm">{service.feedback.technicianFeedback}</p>
            </div>
          </div>
        )}
      </div>
    );
  }
  return (
    <Form {...feedbackForm}>
      <form className="space-y-4" onSubmit={feedbackForm.handleSubmit(onSubmit)}>
        <FormField
          control={feedbackForm.control}
          name="clientRating"
          defaultValue="5"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avaliação do Cliente (1-5 estrelas)</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma nota" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">★ - Muito Insatisfeito</SelectItem>
                  <SelectItem value="2">★★ - Insatisfeito</SelectItem>
                  <SelectItem value="3">★★★ - Neutro</SelectItem>
                  <SelectItem value="4">★★★★ - Satisfeito</SelectItem>
                  <SelectItem value="5">★★★★★ - Muito Satisfeito</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={feedbackForm.control}
          name="clientComment"
          defaultValue=""
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comentário do Cliente</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} placeholder="Comentários sobre o serviço..." />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={feedbackForm.control}
          name="technicianFeedback"
          defaultValue=""
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feedback do Técnico</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  rows={3} 
                  placeholder="Observações do técnico sobre o serviço..."
                />
              </FormControl>
              <FormDescription>
                Informações técnicas, dificuldades encontradas ou sugestões de melhoria.
              </FormDescription>
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit">Salvar Feedback</Button>
        </div>
      </form>
    </Form>
  );
};
export default FeedbackSection;
