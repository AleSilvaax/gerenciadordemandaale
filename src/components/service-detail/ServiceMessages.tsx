
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Service } from "@/types/serviceTypes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquare, Send } from "lucide-react";
import SectionCard from "@/components/service-detail/SectionCard";

interface ServiceMessagesProps {
  service: Service;
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSendMessage: () => void;
}

export const ServiceMessages: React.FC<ServiceMessagesProps> = ({
  service,
  newMessage,
  setNewMessage,
  onSendMessage
}) => {
  return (
    <SectionCard 
      title="Comunicação" 
      description={`${service.messages?.length || 0} mensagens registradas`}
      rightSlot={
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
          <MessageSquare className="w-3 h-3 mr-1" />
          {service.messages?.length || 0}
        </Badge>
      }
    >
      <div className="space-y-4">
        <ScrollArea className="h-[280px] pr-3">
          {service.messages && service.messages.length > 0 ? (
            <div className="space-y-3">
              {service.messages.map((msg, index) => (
                <div key={index} className="group relative">
                  <div className="flex gap-3 p-4 bg-gradient-to-r from-background/80 to-background/40 rounded-xl border border-border/40 hover:border-border/60 transition-all duration-200 hover:shadow-sm">
                    <Avatar className="w-9 h-9 ring-2 ring-primary/20">
                      <AvatarImage src={msg.senderId} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-medium">
                        {msg.senderName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{msg.senderName}</span>
                        <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-gradient-to-r from-accent/10 to-accent/5 text-accent-foreground border-accent/20">
                          {msg.senderRole}
                        </Badge>
                        {msg.timestamp && (
                          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                            {format(new Date(msg.timestamp), "dd/MM/yy HH:mm", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                      <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg p-3 border border-border/30">
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -left-2 top-4 w-1 h-8 bg-gradient-to-b from-primary/30 to-accent/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-primary/60" />
              </div>
              <p className="text-sm font-medium mb-1">Ainda não há mensagens</p>
              <p className="text-xs opacity-70">Inicie a conversa enviando a primeira mensagem</p>
            </div>
          )}
        </ScrollArea>
        
        <div className="relative">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                placeholder="Digite sua mensagem..."
                aria-label="Mensagem da demanda"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSendMessage()}
                className="bg-gradient-to-r from-background/80 to-background/60 border-border/50 focus:border-primary/50 focus:ring-primary/20 pr-12 h-11"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <MessageSquare className="w-4 h-4 text-muted-foreground/50" />
              </div>
            </div>
            <Button 
              onClick={onSendMessage} 
              size="sm" 
              aria-label="Enviar mensagem"
              className="h-11 px-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-200"
              disabled={!newMessage.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};
