
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { UserCircle2, Bell, Moon, FileText, Shield, LogOut, Upload, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { updateTeamMember } from "@/services/api";
import { toast } from "sonner";

// Custom hook for theme management
const useTheme = () => {
  const [darkMode, setDarkMode] = useState<boolean>(
    window.matchMedia('(prefers-color-scheme: dark)').matches || 
    localStorage.getItem('theme') === 'dark'
  );
  
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);
  
  return { darkMode, setDarkMode };
};

// Custom hook for managing user preferences
const useUserPreferences = () => {
  const [notifications, setNotifications] = useState<boolean>(
    localStorage.getItem('notifications') !== 'false'
  );
  const [emailNotifications, setEmailNotifications] = useState<boolean>(
    localStorage.getItem('emailNotifications') === 'true'
  );

  useEffect(() => {
    localStorage.setItem('notifications', notifications.toString());
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('emailNotifications', emailNotifications.toString());
  }, [emailNotifications]);
  
  return { notifications, setNotifications, emailNotifications, setEmailNotifications };
};

const Settings: React.FC = () => {
  const { user, logout, updateUserInfo } = useAuth();
  const { darkMode, setDarkMode } = useTheme();
  const { notifications, setNotifications, emailNotifications, setEmailNotifications } = useUserPreferences();
  
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Update profile when user changes
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name,
        email: user.email || '',
        role: user.role || '',
        phone: user.phone || '',
        avatar: user.avatar,
      });
    }
  }, [user]);

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      await updateTeamMember(user.id, {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
      });
      
      // Update local auth context
      updateUserInfo({
        ...user,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
      });
      
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Falha ao atualizar o perfil");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordUpdate = async () => {
    // Reset error
    setPasswordError('');
    
    // Validate passwords
    if (!currentPassword) {
      setPasswordError('Senha atual é obrigatória');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não conferem');
      return;
    }
    
    try {
      setIsUpdating(true);
      
      // In a real app, this would call an API to update the password
      // For this demo, we'll just simulate a successful password change
      setTimeout(() => {
        toast.success("Senha atualizada com sucesso!");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsUpdating(false);
      }, 1000);
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Falha ao atualizar a senha");
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, this would upload the file to a server
      // For this demo, we'll just simulate a successful upload
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfile({
          ...profile,
          avatar: result
        });
        
        if (user) {
          // Update local auth context
          updateUserInfo({
            ...user,
            avatar: result
          });
        }
        
        toast.success("Foto de perfil atualizada");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="container py-4 space-y-6 pb-24">
      <h1 className="text-3xl font-bold">Configurações</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="profile">
            <UserCircle2 className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Bell className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Preferências</span>
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>
                Gerencie informações do seu perfil e configurações da conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <TeamMemberAvatar 
                  src={profile.avatar} 
                  name={profile.name} 
                  size="lg" 
                  className="w-20 h-20"
                />
                <div className="flex-1">
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('avatar-upload')?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Alterar foto
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input 
                      id="name" 
                      value={profile.name} 
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Cargo</Label>
                    <Input 
                      id="role" 
                      value={profile.role === "tecnico" ? "Técnico" : 
                             profile.role === "administrador" ? "Administrador" : 
                             profile.role === "gestor" ? "Gestor" : 
                             profile.role || ""} 
                      readOnly
                      className="bg-muted/50"
                    />
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={profile.email} 
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      value={profile.phone} 
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      placeholder="(XX) XXXXX-XXXX"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={handleProfileUpdate} 
                disabled={isUpdating}
              >
                {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar alterações
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferências</CardTitle>
              <CardDescription>
                Personalize sua experiência no aplicativo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Modo escuro</Label>
                  <p className="text-sm text-muted-foreground">
                    Ative o tema escuro para reduzir o brilho da tela.
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Notificações no aplicativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba alertas sobre novas demandas e atualizações.
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Notificações por e-mail</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba alertas por e-mail sobre novas demandas.
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>
                Gerencie as configurações de segurança da sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Senha atual</Label>
                  <Input 
                    id="current-password" 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova senha</Label>
                    <Input 
                      id="new-password" 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                    <Input 
                      id="confirm-password" 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                {passwordError && (
                  <p className="text-sm text-red-500">{passwordError}</p>
                )}
                <Button 
                  onClick={handlePasswordUpdate}
                  disabled={isUpdating || !currentPassword || !newPassword || !confirmPassword}
                >
                  {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Atualizar senha
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
              <Button variant="outline" className="w-full sm:w-auto">
                <FileText className="mr-2 h-4 w-4" />
                Baixar dados da conta
              </Button>
              <Button variant="destructive" className="w-full sm:w-auto" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
