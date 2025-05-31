
import React, { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EyeIcon, EyeOffIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/serviceTypes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

// Schema para validação do formulário
const formSchema = z.object({
  name: z.string().min(3, {
    message: "Nome deve ter pelo menos 3 caracteres.",
  }),
  email: z.string().email({
    message: "Email inválido.",
  }),
  password: z.string().min(6, {
    message: "Senha deve ter pelo menos 6 caracteres.",
  }),
  confirmPassword: z.string(),
  role: z.enum(['tecnico', 'administrador', 'gestor']),
  terms: z.boolean({
    required_error: "Você deve aceitar os termos."
  }).refine(val => val === true, {
    message: "Você deve aceitar os termos."
  }),
})
.refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não conferem.",
  path: ["confirmPassword"],
});

interface RegisterFormProps {
  setRegistrationInProgress?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function RegisterForm({ setRegistrationInProgress }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { register } = useAuth();

  // Inicializar o formulário com Hook Form e validação Zod
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "tecnico",
      terms: false,
    },
  });

  // Função executada ao submeter o formulário
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      console.log("Iniciando registro com valores:", values);
      setIsLoading(true);
      if (setRegistrationInProgress) {
        setRegistrationInProgress(true);
      }
      
      // Cria o objeto de registro com os dados necessários
      const registerData = {
        name: values.name,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        role: values.role as UserRole,
      };
      
      console.log("Dados de registro preparados:", registerData);
      
      // Chama a função de registro do contexto de autenticação
      const success = await register(registerData);
      
      if (!success) {
        console.error("Falha no registro");
        // O erro já foi mostrado no contexto
      }
      
    } catch (error) {
      console.error("Erro no registro:", error);
      toast.error("Erro ao criar conta. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
      if (setRegistrationInProgress) {
        setRegistrationInProgress(false);
      }
    }
  }

  return (
    <div className="max-w-md w-full mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Seu nome completo" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="seu@email.com" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="********" 
                      {...field} 
                      disabled={isLoading} 
                    />
                  </FormControl>
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar Senha</FormLabel>
                <FormControl>
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="********" 
                    {...field} 
                    disabled={isLoading} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Função</FormLabel>
                <Select 
                  disabled={isLoading}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma função" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="administrador">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Eu aceito os termos de uso e política de privacidade
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          
          <div className="space-y-4 pt-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar Conta"
              )}
            </Button>
            <div className="text-center text-sm">
              Já possui conta? <Link to="/login" className="font-medium underline">Faça login</Link>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
