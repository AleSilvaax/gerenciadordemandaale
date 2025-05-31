
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TeamManagement: React.FC = () => {
  return (
    <div className="container mx-auto p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Equipe</h1>
      
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          O sistema agora funciona com uma equipe única compartilhada. Todos os usuários cadastrados fazem parte da mesma equipe automaticamente.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2" size={20} />
            Equipe Única
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Todos os usuários do sistema compartilham os mesmos dados e podem colaborar entre si. 
            Não é mais necessário criar ou gerenciar equipes separadas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamManagement;
