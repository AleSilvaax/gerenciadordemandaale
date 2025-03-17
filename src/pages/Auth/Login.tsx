
import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const { signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Verificar se o Supabase está configurado corretamente com um timeout
  useEffect(() => {
    const checkSupabase = async () => {
      try {
        // Definir um timeout para a verificação de conexão
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Timeout na conexão com o servidor")), 5000);
        });

        // Tenta fazer uma consulta simples para verificar a conexão
        const connectionPromise = supabase.from('profiles').select('count').limit(1);
        
        // Usar Promise.race para limitar o tempo de espera
        await Promise.race([connectionPromise, timeoutPromise]);
        
        setCheckingConnection(false);
      } catch (error) {
        console.error("Erro ao verificar conexão:", error);
        setConnectionError(true);
        setCheckingConnection(false);
        toast({
          title: "Problema de conexão",
          description: "Não foi possível conectar ao servidor. Por favor, tente novamente mais tarde.",
          variant: "destructive",
        });
      }
    };

    checkSupabase();
  }, [toast]);

  // Se o usuário já estiver autenticado, redirecionar
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Redirecionar para a página anterior caso exista
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("Tentando fazer login...");
      const success = await signIn(email, password);
      
      if (success) {
        console.log("Login bem-sucedido, redirecionando para:", from);
        navigate(from, { replace: true });
      } else {
        console.log("Login falhou");
        toast({
          title: "Falha no login",
          description: "Verifique suas credenciais e tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro de login:", error);
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro durante o login. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingConnection) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Conectando ao servidor...</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 text-primary hover:underline text-sm"
          >
            Clique aqui se demorar muito
          </button>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Erro de Conexão</h1>
          <p className="text-muted-foreground mb-6">
            Não foi possível conectar ao servidor. Verifique sua conexão com a internet ou tente novamente mais tarde.
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            Entre com seu email e senha para acessar o sistema
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Entrando...
                </>
              ) : "Entrar"}
            </Button>
            <div className="text-center text-sm">
              Não possui uma conta?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Cadastre-se
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
