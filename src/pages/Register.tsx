// Arquivo: src/pages/Register.tsx (VERSÃO CORRIGIDA)

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { UserPlus, Loader2, LogIn } from 'lucide-react';
// ✅ ALTERAÇÃO: Trocamos para o hook de autenticação correto
import { useOptimizedAuth } from '@/context/OptimizedAuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  // ✅ ALTERAÇÃO: Usamos o hook correto
  const { register } = useOptimizedAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg("Por favor, preencha todos os campos.");
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const success = await register({ name, email, password });
      if (success) {
        // O toast de sucesso já está no contexto, aqui apenas redirecionamos
        navigate('/login');
      } else {
        setErrorMsg("Não foi possível realizar o cadastro. Verifique os dados.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full animate-scaleIn">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Crie sua Conta</h1>
          <p className="text-muted-foreground mt-2">Rápido e fácil, comece a gerenciar suas demandas.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Registro</CardTitle>
            <CardDescription>
              Preencha os campos abaixo para criar sua conta.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {errorMsg && (
                <Alert variant="destructive">
                  <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isSubmitting} />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} className="mr-2" />
                    Registrar
                  </>
                )}
              </Button>
              <div className="text-sm text-center mt-4">
                Já possui uma conta?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  <LogIn className="inline-block h-3 w-3 mr-1" />
                  Faça Login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
