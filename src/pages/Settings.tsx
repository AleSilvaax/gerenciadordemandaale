
import React, { useState } from "react";
import { ArrowLeft, Settings as SettingsIcon, Users, Shield, Palette, Wrench, UserCog, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { TechnicalSettingsTab } from "@/components/settings/TechnicalSettingsTab";
import { EnhancedVisualPreferencesTab } from "@/components/settings/EnhancedVisualPreferencesTab";
import { useAuth } from "@/context/AuthContext";

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState("technical");
  const { user } = useAuth();

  const isAdmin = user && ['super_admin', 'owner', 'administrador', 'gestor'].includes(user.role);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <motion.div 
        className="container mx-auto p-2 sm:p-6 pb-24 space-y-8 w-full max-w-full"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center gap-4 mb-8">
          <Link 
            to="/" 
            className="h-12 w-12 rounded-xl flex items-center justify-center bg-card/50 backdrop-blur-sm border border-border/50 hover:bg-accent hover:border-accent/50 transition-all duration-200 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-primary/70 text-primary-foreground">
                <SettingsIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Configurações
                </h1>
                <p className="text-muted-foreground mt-1">Personalize e configure o sistema conforme sua necessidade</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Settings Content */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg w-full max-w-full">
            <CardContent className="p-2 sm:p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className={`grid w-full bg-background/50 ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  <TabsTrigger value="technical" className="flex items-center gap-2">
                    <Wrench size={16} />
                    <span className="hidden sm:inline">Técnicas</span>
                  </TabsTrigger>
                  <TabsTrigger value="visual" className="flex items-center gap-2">
                    <Palette size={16} />
                    <span className="hidden sm:inline">Visual</span>
                  </TabsTrigger>
                  <TabsTrigger value="team" className="flex items-center gap-2">
                    <Users size={16} />
                    <span className="hidden sm:inline">Equipe</span>
                  </TabsTrigger>
                  {isAdmin && (
                    <TabsTrigger value="admin" className="flex items-center gap-2">
                      <Crown size={16} />
                      <span className="hidden sm:inline">Admin</span>
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="technical" className="mt-3 sm:mt-6">
                  <TechnicalSettingsTab />
                </TabsContent>

                <TabsContent value="visual" className="mt-3 sm:mt-6">
                  <EnhancedVisualPreferencesTab />
                </TabsContent>

                <TabsContent value="team" className="mt-3 sm:mt-6">
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Configurações da Equipe</h3>
                      <p className="text-muted-foreground">Gerencie configurações relacionadas à equipe.</p>
                    </div>
                    
                    <Card className="bg-gradient-to-r from-blue-50/50 to-blue-100/50 dark:from-blue-900/10 dark:to-blue-800/10 border border-blue-200/50 dark:border-blue-800/50">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Users className="w-5 h-5 text-blue-500" />
                          Gerenciar Membros
                        </CardTitle>
                        <CardDescription>
                          Adicione, remova e configure membros da equipe
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Link to="/equipe">
                          <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                            <Users className="w-4 h-4 mr-2" />
                            Ir para Gerenciamento de Equipe
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {isAdmin && (
                  <TabsContent value="admin" className="mt-3 sm:mt-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                          <Crown className="w-5 h-5 text-amber-500" />
                          Painel Administrativo
                        </h3>
                        <p className="text-muted-foreground">Acesso a funcionalidades avançadas de administração do sistema</p>
                      </div>

                      <div className="grid gap-4">
                        {/* Admin Panel Access */}
                        <Card className="bg-gradient-to-r from-purple-50/50 to-purple-100/50 dark:from-purple-900/10 dark:to-purple-800/10 border border-purple-200/50 dark:border-purple-800/50 hover:shadow-lg transition-all duration-200">
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Shield className="w-5 h-5 text-purple-500" />
                              Administração Geral
                            </CardTitle>
                            <CardDescription>
                              Gerencie usuários, permissões e configurações avançadas do sistema
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Link to="/admin">
                              <Button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
                                <UserCog className="w-4 h-4 mr-2" />
                                Acessar Painel Administrativo
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>

                        {/* Organization Settings */}
                        <Card className="bg-gradient-to-r from-amber-50/50 to-amber-100/50 dark:from-amber-900/10 dark:to-amber-800/10 border border-amber-200/50 dark:border-amber-800/50">
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Crown className="w-5 h-5 text-amber-500" />
                              Configurações da Organização
                            </CardTitle>
                            <CardDescription>
                              Configure informações gerais da empresa e branding
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Button variant="outline" className="w-full border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                              <SettingsIcon className="w-4 h-4 mr-2" />
                              Em Desenvolvimento
                            </Button>
                          </CardContent>
                        </Card>

                        {/* System Logs */}
                        <Card className="bg-gradient-to-r from-slate-50/50 to-slate-100/50 dark:from-slate-900/10 dark:to-slate-800/10 border border-slate-200/50 dark:border-slate-800/50">
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Shield className="w-5 h-5 text-slate-500" />
                              Logs do Sistema
                            </CardTitle>
                            <CardDescription>
                              Monitore atividades e eventos do sistema
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Button variant="outline" className="w-full border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/20">
                              <Shield className="w-4 h-4 mr-2" />
                              Em Desenvolvimento
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Settings;
