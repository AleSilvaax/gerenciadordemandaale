
import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, User, Camera, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";
import { updateProfileAvatar } from "@/services/userProfile";

const UserProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      const success = await updateProfile({ name });
      
      if (success) {
        toast.success("Perfil atualizado com sucesso");
      }
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file || !user) return;
    
    setIsUploading(true);
    
    try {
      const success = await updateProfileAvatar(user.id, file);
      
      if (success) {
        // Recarregar a página para mostrar o novo avatar
        window.location.reload();
      }
    } catch (error) {
      console.error("Erro ao atualizar avatar:", error);
      toast.error("Erro ao atualizar foto de perfil");
    } finally {
      setIsUploading(false);
      
      // Limpar o input file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Você precisa estar logado para acessar esta página.</p>
          <Button variant="default" className="mt-4" onClick={() => navigate('/login')}>
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="flex items-center mb-6">
        <Link to="/" className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary border border-white/10 mr-4">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold">Meu Perfil</h1>
      </div>
      
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="relative">
          <TeamMemberAvatar
            src={user.avatar}
            name={user.name}
            size="lg"
            className="w-24 h-24 cursor-pointer"
          />
          
          <button
            className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 border-2 border-background shadow-md"
            onClick={handleAvatarClick}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Camera size={18} />
            )}
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
        
        <h2 className="mt-4 text-lg font-medium">{user.name}</h2>
        <p className="text-sm text-muted-foreground capitalize">{user.role || 'Técnico'}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={user.id}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
        </div>
        
        <div className="pt-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserProfile;
