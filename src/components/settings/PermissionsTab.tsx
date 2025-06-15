
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { User, ShieldCheck, Loader2, Save } from "lucide-react";
import { UserRole } from "@/types/serviceTypes";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Permission {
  id: string;
  title: string;
  question: string;
  roles: UserRole[];
}

const PermissionsTab: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: "view_all",
      title: "Acessar a todos os chamados",
      question: "Quem Pode Ter Acesso?",
      roles: ["administrador", "gestor"]
    },
    {
      id: "change_status",
      title: "Modificar status dos chamados",
      question: "Quem Pode Modificar?",
      roles: ["tecnico", "administrador", "gestor"]
    },
    {
      id: "add_members",
      title: "Adicionar membros na equipe",
      question: "Quem Pode Adicionar Novos Membros?",
      roles: ["administrador", "gestor"]
    },
    {
      id: "view_stats",
      title: "Acessar as estatísticas",
      question: "Quem Pode Acessar As Estatísticas?",
      roles: ["administrador", "gestor"]
    }
  ]);
  
  const [isSaving, setIsSaving] = useState(false);

  // Load permissions from localStorage
  useEffect(() => {
    const storedPermissions = localStorage.getItem('permissions');
    if (storedPermissions) {
      try {
        const parsedPermissions = JSON.parse(storedPermissions);
        setPermissions(parsedPermissions);
      } catch (error) {
        console.error("Error loading permissions:", error);
      }
    }
  }, []);

  const handleUpdatePermission = (permissionId: string, role: UserRole) => {
    setPermissions(permissions.map(permission => {
      if (permission.id === permissionId) {
        if (permission.roles.includes(role)) {
          return {
            ...permission,
            roles: permission.roles.filter(r => r !== role)
          };
        } else {
          return {
            ...permission,
            roles: [...permission.roles, role]
          };
        }
      }
      return permission;
    }));
  };
  
  const handleSaveChanges = async () => {
    setIsSaving(true);
    
    try {
      localStorage.setItem("permissions", JSON.stringify(permissions));
      toast.success("As permissões da equipe foram atualizadas com sucesso.");
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Falha ao salvar as permissões.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Permissões do Sistema</h3>
        <p className="text-muted-foreground">Configure quais funções têm acesso a recursos específicos do sistema.</p>
      </div>
      
      <div className="space-y-4">
        {permissions.map((permission, index) => (
          <motion.div 
            key={permission.id} 
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="mb-4">
              <h4 className="font-medium text-foreground">{permission.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{permission.question}</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={permission.roles.includes("tecnico") ? "default" : "outline"}
                className="rounded-full"
                onClick={() => handleUpdatePermission(permission.id, "tecnico")}
              >
                <User size={14} className="mr-1" />
                Técnico
              </Button>
              
              <Button
                size="sm"
                variant={permission.roles.includes("administrador") ? "default" : "outline"}
                className="rounded-full"
                onClick={() => handleUpdatePermission(permission.id, "administrador")}
              >
                <ShieldCheck size={14} className="mr-1" />
                Administrador
              </Button>
              
              <Button
                size="sm"
                variant={permission.roles.includes("gestor") ? "default" : "outline"}
                className="rounded-full"
                onClick={() => handleUpdatePermission(permission.id, "gestor")}
              >
                <ShieldCheck size={14} className="mr-1" />
                Gestor
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="flex justify-end pt-4 border-t border-border/50">
        <Button 
          onClick={handleSaveChanges} 
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save size={16} className="mr-2" />
              Salvar Permissões
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PermissionsTab;
