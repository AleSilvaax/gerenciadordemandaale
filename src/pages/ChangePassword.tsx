import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export const ChangePassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // If user doesn't need to change password, redirect
  if (!user?.must_change_password) {
    return <Navigate to="/" replace />;
  }

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "A senha deve ter pelo menos 8 caracteres";
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return "A senha deve conter pelo menos uma letra minúscula";
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return "A senha deve conter pelo menos uma letra maiúscula";
    }
    if (!/(?=.*\d)/.test(password)) {
      return "A senha deve conter pelo menos um número";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    
    try {
      // Update password with Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      // Update the must_change_password flag
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        // Don't throw here, as password was already updated successfully
      }

      // Update user context
      if (updateUser) {
        await updateUser({ must_change_password: false });
      }

      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso!",
      });

      // Redirect to dashboard
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('Error changing password:', error);
      setError(error.message || 'Erro ao alterar a senha');
    } finally {
      setLoading(false);
    }
  };

  const requirements = [
    { text: "Pelo menos 8 caracteres", valid: newPassword.length >= 8 },
    { text: "Uma letra minúscula", valid: /(?=.*[a-z])/.test(newPassword) },
    { text: "Uma letra maiúscula", valid: /(?=.*[A-Z])/.test(newPassword) },
    { text: "Um número", valid: /(?=.*\d)/.test(newPassword) },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Alterar Senha</CardTitle>
          <CardDescription>
            Por motivos de segurança, você deve alterar sua senha temporária antes de continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua nova senha"
                required
              />
            </div>

            {/* Password Requirements */}
            {newPassword && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Requisitos da senha:
                </Label>
                <div className="space-y-1">
                  {requirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle 
                        className={`h-4 w-4 ${req.valid ? 'text-green-600' : 'text-muted-foreground'}`}
                      />
                      <span className={req.valid ? 'text-green-600' : 'text-muted-foreground'}>
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !newPassword || !confirmPassword}
            >
              {loading ? "Alterando..." : "Alterar Senha"}
            </Button>
          </form>

          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Importante:</strong> Após alterar sua senha, você será redirecionado para o sistema 
              e poderá usar sua nova senha em futuros logins.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};