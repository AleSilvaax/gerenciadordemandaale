import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Mail,
  Phone,
  Edit2,
  Save,
  ArrowLeft,
  Camera,
  Shield,
  Loader2,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Escolha um arquivo de imagem válido");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await updateUser({ avatar: data.publicUrl });
      toast.success("Foto de perfil atualizada!");
    } catch (err: any) {
      toast.error("Erro ao enviar foto", { description: err?.message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!formData.name.trim()) {
      toast.error("O nome não pode ficar em branco.");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ name: formData.name.trim() })
        .eq("id", user.id);

      if (error) throw error;

      await updateUser({ name: formData.name.trim() });
      toast.success("Perfil atualizado com sucesso!");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Erro ao salvar perfil:", error);
      toast.error("Não foi possível salvar as alterações.");
    } finally {
      setIsSaving(false);
    }
  };

  const getUserInitials = (name: string): string => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-lg border-slate-200 bg-white">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 text-slate-700" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Meu Perfil
          </h1>
          <p className="text-xs text-slate-500">
            Gerencie suas informações pessoais e credenciais
          </p>
        </div>
      </div>

      {/* Card Principal */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
              Informações do Usuário
            </CardTitle>
          </div>

          {!isEditing ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8 gap-1.5 text-xs border-slate-200"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Editar
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, name: user?.name || "" }));
                  setIsEditing(false);
                }}
                disabled={isSaving}
                className="h-8 text-xs"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleAvatar}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="relative group shrink-0 rounded-full focus:outline-none"
              aria-label="Alterar foto de perfil"
            >
              <Avatar className="h-20 w-20 border-2 border-slate-200 dark:border-slate-700 shadow-xs">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-blue-50 text-blue-600 text-xl font-bold">
                  {getUserInitials(user?.name || "U")}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm ring-2 ring-white">
                <Camera className="h-3.5 w-3.5" />
              </span>
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {user?.name || "Usuário"}
                </h2>
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 capitalize text-xs"
                >
                  {user?.role || "Técnico"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                {uploading
                  ? "Enviando nova foto..."
                  : "Toque na foto para alterar seu avatar"}
              </p>
            </div>
          </div>

          {/* Campos do Formulário */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <User className="h-3.5 w-3.5" />
                Nome Completo
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                disabled={!isEditing || isSaving}
                className="h-10 bg-slate-50/60 dark:bg-slate-950 border-slate-200 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Mail className="h-3.5 w-3.5" />
                E-mail Corporativo
              </Label>
              <Input
                value={formData.email}
                disabled
                className="h-10 bg-slate-100/80 dark:bg-slate-900 text-slate-500 border-slate-200 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Phone className="h-3.5 w-3.5" />
                Telefone
              </Label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                disabled={!isEditing || isSaving}
                placeholder="(11) 99999-9999"
                className="h-10 bg-slate-50/60 dark:bg-slate-950 border-slate-200 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Shield className="h-3.5 w-3.5" />
                Nível de Permissão
              </Label>
              <Input
                value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Técnico"}
                disabled
                className="h-10 bg-slate-100/80 dark:bg-slate-900 text-slate-500 border-slate-200 cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-400">
                Definido pelo administrador da organização.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
