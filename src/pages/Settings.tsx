
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCircle2, Bell, Moon, FileText, Shield, LogOut, Sliders } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Import our custom components
import { VisualPreferencesTab } from "@/components/settings/VisualPreferencesTab";
import { TechnicalSettingsTab } from "@/components/settings/TechnicalSettingsTab";
import { useTheme } from "@/hooks/use-theme";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Original profile tab
const ProfileTab = () => {
  const { user, updateUser, updateUserInfo } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });

  const [isUpdating, setIsUpdating] = useState(false);

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
      
      // Update user profile
      await updateUser({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
      });
      
      // Update local auth context
      if (user) {
        updateUserInfo({
          ...user,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
        });
      }
      
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Falha ao atualizar o perfil");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
  );
};

// Original preferences tab
const PreferencesTab = () => {
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
  
  return (
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
  );
};

// Original security tab
const SecurityTab = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

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

  return (
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
    </Card>
  );
};

const Settings: React.FC = () => {
  const { logout } = useAuth();
  const { isDarkMode, setDarkMode } = useTheme();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="container py-4 space-y-6 pb-24 animate-fadeIn">
      <h1 className="text-3xl font-bold">Configurações</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="profile">
            <UserCircle2 className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Bell className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Preferências</span>
          </TabsTrigger>
          <TabsTrigger value="visual">
            <Moon className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Visual</span>
          </TabsTrigger>
          <TabsTrigger value="technical">
            <Sliders className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Técnicas</span>
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="preferences">
          <PreferencesTab />
        </TabsContent>

        <TabsContent value="visual">
          <VisualPreferencesTab />
        </TabsContent>

        <TabsContent value="technical">
          <TechnicalSettingsTab />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
      </Tabs>
      
      <Card className="p-4 mt-6">
        <CardHeader className="px-0 pb-3">
          <CardTitle className="text-lg">Ações Adicionais</CardTitle>
          <CardDescription>
            Ações que afetam toda a sua conta
          </CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Baixar Dados da Conta
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
