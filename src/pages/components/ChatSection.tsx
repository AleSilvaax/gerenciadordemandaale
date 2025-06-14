
import React, { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send } from "lucide-react";
import { format } from "date-fns";

interface IMessage {
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: string;
}

interface ChatSectionProps {
  messages: IMessage[];
  newMessage: string;
  setNewMessage: (msg: string) => void;
  onSend: () => void;
}

const ChatSection: React.FC<ChatSectionProps> = ({
  messages = [],
  newMessage,
  setNewMessage,
  onSend,
}) => {
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Chat da Demanda</h3>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 h-96 overflow-y-auto mb-4">
        {messages && messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.senderId === 'user-1' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.senderId === 'user-1'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-100'
                  }`}
                >
                  <div className="flex items-center mb-1">
                    <span className="font-medium text-sm">{msg.senderName}</span>
                    <span className="text-xs ml-2 opacity-75">
                      {msg.timestamp && format(new Date(msg.timestamp), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                </div>
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <MessageSquare className="h-12 w-12 mb-3 opacity-20" />
            <p>Nenhuma mensagem ainda...</p>
            <p className="text-sm">Inicie a conversa abaixo!</p>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1"
          onKeyPress={(e) => e.key === 'Enter' && onSend()}
        />
        <Button onClick={onSend} disabled={!newMessage.trim()}>
          <Send className="h-4 w-4 mr-2" />
          Enviar
        </Button>
      </div>
    </div>
  );
};

export default ChatSection;
