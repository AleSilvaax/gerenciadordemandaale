
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
    <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Mensagens ({service.messages?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[300px] pr-4">
          {service.messages && service.messages.length > 0 ? (
            <div className="space-y-3">
              {service.messages.map((msg, index) => (
                <div key={index} className="flex gap-3 p-3 bg-background/30 rounded-lg border border-border/30">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={msg.senderId} />
                    <AvatarFallback className="text-xs">
                      {msg.senderName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{msg.senderName}</span>
                      <Badge variant="outline" className="text-xs">
                        {msg.senderRole}
                      </Badge>
                      {msg.timestamp && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.timestamp), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma mensagem ainda</p>
            </div>
          )}
        </ScrollArea>
        
        <div className="flex gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
            className="bg-background/50"
          />
          <Button onClick={onSendMessage} size="sm">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
