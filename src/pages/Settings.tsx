
import React, { useState } from "react";
import { ArrowLeft, Settings as SettingsIcon, Users, Shield, Palette, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { TechnicalSettingsTab } from "@/components/settings/TechnicalSettingsTab";
import EnhancedVisualPreferencesTab from "@/components/settings/EnhancedVisualPreferencesTab";
import PermissionsTab from "@/components/settings/PermissionsTab";

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState("technical");

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
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Configurações
            </h1>
            <p className="text-muted-foreground mt-1">Personalize e configure o sistema conforme sua necessidade</p>
          </div>
        </motion.div>

        {/* Settings Content */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg w-full max-w-full">
            <CardContent className="p-2 sm:p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-background/50">
                  <TabsTrigger value="technical" className="flex items-center gap-2">
                    <Wrench size={16} />
                    Técnicas
                  </TabsTrigger>
                  <TabsTrigger value="permissions" className="flex items-center gap-2">
                    <Shield size={16} />
                    Permissões
                  </TabsTrigger>
                  <TabsTrigger value="visual" className="flex items-center gap-2">
                    <Palette size={16} />
                    Visual
                  </TabsTrigger>
                  <TabsTrigger value="team" className="flex items-center gap-2">
                    <Users size={16} />
                    Equipe
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="technical" className="mt-3 sm:mt-6">
                  <TechnicalSettingsTab />
                </TabsContent>

                <TabsContent value="permissions" className="mt-3 sm:mt-6">
                  <PermissionsTab />
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
                    
                    <Card className="bg-background/30 border border-border/30">
                      <CardHeader>
                        <CardTitle className="text-base">Gerenciar Membros</CardTitle>
                        <CardDescription>
                          Adicione, remova e configure membros da equipe
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Link to="/equipe">
                          <Button className="w-full">
                            <Users className="w-4 h-4 mr-2" />
                            Ir para Gerenciamento de Equipe
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Settings;
