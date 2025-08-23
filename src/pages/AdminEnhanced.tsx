import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Users, 
  Building2, 
  UserPlus, 
  Settings,
  BarChart3,
  Search,
  UserCog,
  AlertCircle,
  Shield
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { OrganizationSwitcher } from "@/components/admin/OrganizationSwitcher";
import { TeamManagement } from "@/components/admin/TeamManagement";
import { OrganizationManagement } from "@/components/admin/OrganizationManagement";
import { UserManagement } from "@/components/admin/UserManagement";
import { InviteManagement } from "@/components/admin/InviteManagement";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 }
  }
};

export default function AdminEnhancedPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const { toast } = useToast();

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role && ['super_admin', 'owner', 'administrador'].includes(user.role);
  const canManage = user?.role && ['super_admin', 'owner', 'administrador', 'gestor'].includes(user.role);

  const loadOrganizations = async () => {
    if (!isSuperAdmin) return;
    
    setLoadingOrgs(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setOrganizations(data || []);
      
      // Set first organization as default if none selected
      if (data && data.length > 0 && !selectedOrgId) {
        setSelectedOrgId(data[0].id);
      }
    } catch (error: any) {
      console.error('Error loading organizations:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar organizações",
        variant: "destructive",
      });
    } finally {
      setLoadingOrgs(false);
    }
  };

  const getCurrentUserOrgId = async () => {
    if (isSuperAdmin) return; // Super admin uses switcher
    
    try {
      const { data } = await supabase.rpc('get_current_user_organization_id');
      if (data) {
        setSelectedOrgId(data);
      }
    } catch (error) {
      console.error('Error getting user org:', error);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadOrganizations();
    } else {
      getCurrentUserOrgId();
    }
  }, [user]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando administração...</p>
        </motion.div>
      </div>
    );
  }

  // Access control
  if (!canManage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
              <p className="text-muted-foreground mb-4">
                Você não tem permissão para acessar a área administrativa.
              </p>
              <Button asChild>
                <Link to="/">Voltar ao Início</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Relatórios",
      description: "Visualizar relatórios do sistema",
      icon: BarChart3,
      href: "/relatorios",
      color: "blue"
    },
    {
      title: "Tipos de Serviço", 
      description: "Configurar tipos de serviço",
      icon: Settings,
      href: "/tipos-servico", 
      color: "green"
    },
    {
      title: "Buscar",
      description: "Pesquisar no sistema",
      icon: Search,
      href: "/buscar",
      color: "purple"
    },
    {
      title: "Equipe",
      description: "Gerenciar membros da equipe",
      icon: Users,
      href: "/equipe",
      color: "orange"
    }
  ];

  // Get current organization name for display
  const currentOrgName = organizations.find(org => org.id === selectedOrgId)?.name;

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Administração</h1>
              <p className="text-muted-foreground">
                Gerencie organizações, equipes e usuários do sistema
              </p>
            </div>
          </div>
        </motion.div>

        {/* Organization Switcher (Super Admin only) */}
        {isSuperAdmin && (
          <motion.div variants={itemVariants}>
            <OrganizationSwitcher
              organizations={organizations}
              selectedOrgId={selectedOrgId}
              onOrgChange={setSelectedOrgId}
              loading={loadingOrgs}
            />
          </motion.div>
        )}

        {/* Main Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className={`grid w-full ${isSuperAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
              {isSuperAdmin && (
                <TabsTrigger value="organizations" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Organizações</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Usuários</span>
              </TabsTrigger>
              <TabsTrigger value="teams" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                <span className="hidden sm:inline">Equipes</span>
              </TabsTrigger>
              <TabsTrigger value="invites" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Convites</span>
              </TabsTrigger>
            </TabsList>

            {/* Organizations Tab (Super Admin only) */}
            {isSuperAdmin && (
              <TabsContent value="organizations">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Gerenciar Organizações
                    </CardTitle>
                    <CardDescription>
                      Criar, editar e gerenciar todas as organizações do sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <OrganizationManagement />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Users Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gerenciar Usuários
                    {currentOrgName && (
                      <span className="text-sm font-normal text-muted-foreground">
                        - {currentOrgName}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Visualizar, criar e gerenciar usuários e suas permissões
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UserManagement selectedOrgId={selectedOrgId} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Teams Tab */}
            <TabsContent value="teams">
              <TeamManagement selectedOrgId={selectedOrgId} />
            </TabsContent>

            {/* Invites Tab */}
            <TabsContent value="invites">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Gerenciar Convites
                    {currentOrgName && (
                      <span className="text-sm font-normal text-muted-foreground">
                        - {currentOrgName}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Enviar convites por email e gerenciar convites pendentes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <InviteManagement selectedOrgId={selectedOrgId} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h3 className="text-lg font-semibold">Acesso Rápido</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.title}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link to={action.href}>
                    <Card className="h-full transition-all duration-200 hover:shadow-lg border-border/50 hover:border-border">
                      <CardContent className="p-4 text-center">
                        <div className={`inline-flex p-3 rounded-lg bg-${action.color}-500/10 mb-3`}>
                          <Icon className={`h-6 w-6 text-${action.color}-600`} />
                        </div>
                        <h4 className="font-semibold text-sm mb-1">{action.title}</h4>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}