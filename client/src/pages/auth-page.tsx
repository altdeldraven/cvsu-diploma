import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin, useRegister, useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Loader2 } from "lucide-react";
import logoImage from "@assets/logo-image_1772160673349.png";
import { insertUserSchema } from "@shared/schema";

const loginSchema = z.object({
  username: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email").refine(
    (val) => val.endsWith("@cvsu.edu.ph"),
    { message: "Only @cvsu.edu.ph email addresses are accepted" }
  ),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const [_, setLocation] = useLocation();
  const { user } = useUser();
  const { mutateAsync: login, isPending: isLoginPending } = useLogin();
  const { mutateAsync: register, isPending: isRegisterPending } = useRegister();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') setLocation('/admin');
      else setLocation('/student');
    }
  }, [user, setLocation]);

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[#004d01] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#004d01] via-[#004d01]/50 to-transparent" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <img src={logoImage} alt="CvSU Logo" className="h-12 w-12 object-contain" />
            <h1 className="text-xl text-white font-serif font-bold leading-tight">CvSU-Trece Martires City Campus</h1>
          </div>
          <h2 className="text-5xl font-display font-bold leading-tight mb-6">
            Secure Credentials for the Future.
          </h2>
          <p className="text-lg text-slate-300 max-w-md leading-relaxed">
            Manage academic records, issue blockchain-verified diplomas, and enable instant verification for graduates.
          </p>
        </div>

        <div className="relative z-10 text-sm text-slate-400">
          © 2025 CvSU-Trece Martires City Campus. Diploma Issuance and Verification System.
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Welcome Back</h2>
            <p className="mt-2 text-slate-600">Sign in to access your dashboard</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register Student</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginForm 
                onSubmit={async (data) => {
                  try {
                    await login(data);
                  } catch (e) {
                  }
                }} 
                isLoading={isLoginPending} 
              />
            </TabsContent>

            <TabsContent value="register">
              <RegisterForm 
                onSubmit={async (data) => {
                  try {
                    await register({
                      username: data.email,
                      email: data.email,
                      password: data.password,
                      role: "student",
                    });
                  } catch (e) {
                  }
                }} 
                isLoading={isRegisterPending} 
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onSubmit, isLoading }: { onSubmit: (data: any) => Promise<void>, isLoading: boolean }) {
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" }
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <Label htmlFor="username">Email or Username</Label>
        <Input id="username" {...form.register("username")} placeholder="Enter your email or username" data-testid="input-login-username" />
        {form.formState.errors.username && <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" {...form.register("password")} placeholder="••••••••" data-testid="input-login-password" />
        {form.formState.errors.password && <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full h-11 text-base" disabled={isLoading} data-testid="button-login">
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
        {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
      </Button>
    </form>
  );
}

function RegisterForm({ onSubmit, isLoading }: { onSubmit: (data: any) => Promise<void>, isLoading: boolean }) {
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" }
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="space-y-2">
        <Label htmlFor="reg-email">CvSU Email</Label>
        <Input id="reg-email" type="email" {...form.register("email")} placeholder="yourname@cvsu.edu.ph" data-testid="input-register-email" />
        {form.formState.errors.email && <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>}
        <p className="text-xs text-slate-500">Only @cvsu.edu.ph email addresses are accepted.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-password">Password</Label>
        <Input id="reg-password" type="password" {...form.register("password")} placeholder="At least 6 characters" data-testid="input-register-password" />
        {form.formState.errors.password && <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input id="confirmPassword" type="password" {...form.register("confirmPassword")} placeholder="Re-enter your password" data-testid="input-register-confirm" />
        {form.formState.errors.confirmPassword && <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>}
      </div>
      <Button type="submit" className="w-full h-11" disabled={isLoading} data-testid="button-register">
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Student Account"}
      </Button>
    </form>
  );
}
