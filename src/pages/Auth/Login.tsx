
import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider";
import { Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [connectionErrorMessage, setConnectionErrorMessage] = useState("");
  const { signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Verificar se o Supabase está configurado corretamente com um timeout
  useEffect(() => {
    const checkSupabase = async () => {
      try {
        setCheckingConnection(true);
        setConnectionError(false);
        
        console.log("Verificando conexão com Supabase...");
        
        // Definir um timeout para a verificação de conexão
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Timeout na conexão com o servidor")), 3000);
        });

        // Tenta fazer uma consulta simples para verificar a conexão
        const connectionPromise = supabase
          .from('profiles')
          .select('count')
          .limit(1)
          .maybeSingle();
        
        // Usar Promise.race para limitar o tempo de espera
        await Promise.race([connectionPromise, timeoutPromise]);
        
        console.log("Conexão com Supabase estabelecida com sucesso");
        setCheckingConnection(false);
      } catch (error: any) {
        console.error("Erro ao verificar conexão:", error);
        setConnectionError(true);
        setConnectionErrorMessage(error.message || "Não foi possível conectar ao servidor");
        setCheckingConnection(false);
        toast({
          title: "Problema de conexão",
          description: "Não foi possível conectar ao servidor. Por favor, tente novamente.",
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
    } catch (error: any) {
      console.error("Erro de login:", error);
      toast({
        title: "Erro no login",
        description: error.message || "Ocorreu um erro durante o login. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipConnectionCheck = () => {
    setCheckingConnection(false);
    setConnectionError(false);
  };

  const handleTryAlternativeConnection = async () => {
    try {
      setIsLoading(true);
      
      // Tentar uma abordagem diferente de conexão
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      console.log("Verificação alternativa de conexão bem-sucedida");
      setConnectionError(false);
      setCheckingConnection(false);
    } catch (error: any) {
      console.error("Erro na verificação alternativa:", error);
      toast({
        title: "Problema persistente",
        description: "Ainda não foi possível conectar ao servidor. Verifique sua conexão com a internet.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingConnection) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center w-full max-w-md">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="mb-4">Conectando ao servidor...</p>
          <div className="flex flex-col gap-2 mt-6">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="w-full"
            >
              Tentar novamente
            </Button>
            <Button 
              onClick={handleSkipConnectionCheck} 
              variant="ghost"
              className="w-full"
            >
              Pular verificação de conexão
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center max-w-md w-full">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Erro de Conexão</h1>
          <p className="text-muted-foreground mb-6">
            {connectionErrorMessage || "Não foi possível conectar ao servidor. Verifique sua conexão com a internet ou tente novamente mais tarde."}
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Tentar novamente
            </Button>
            <Button 
              onClick={handleTryAlternativeConnection}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Verificando...
                </>
              ) : "Tentar conexão alternativa"}
            </Button>
            <Button 
              onClick={handleSkipConnectionCheck}
              variant="ghost"
              className="w-full"
            >
              Continuar mesmo assim
            </Button>
          </div>
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
