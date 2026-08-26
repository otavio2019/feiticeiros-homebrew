import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const [, navigate] = useLocation();
  const [registerMode, setRegisterMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const login = trpc.auth.login.useMutation();
  const register = trpc.auth.register.useMutation();
  const mutation = registerMode ? register : login;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      if (registerMode) await register.mutateAsync({ name, email, password });
      else await login.mutateAsync({ email, password });
      await utils.auth.me.invalidate();
      navigate("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível autenticar.");
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground">
      <section className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Homebrew Forge</p>
        <h1 className="mt-3 text-3xl font-semibold">{registerMode ? "Criar sua conta" : "Entrar na forja"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Use uma conta local para salvar e compartilhar suas criações.</p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          {registerMode && <div className="space-y-2"><Label htmlFor="name">Nome</Label><Input id="name" value={name} onChange={event => setName(event.target.value)} required maxLength={120} /></div>}
          <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email" /></div>
          <div className="space-y-2"><Label htmlFor="password">Senha</Label><Input id="password" type="password" value={password} onChange={event => setPassword(event.target.value)} required minLength={8} autoComplete={registerMode ? "new-password" : "current-password"} /></div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <Button className="w-full" type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Processando…" : registerMode ? "Criar conta" : "Entrar"}</Button>
        </form>
        <button className="mt-5 text-sm text-primary underline-offset-4 hover:underline" type="button" onClick={() => { setRegisterMode(value => !value); setError(null); }}>
          {registerMode ? "Já tenho uma conta" : "Ainda não tenho conta"}
        </button>
      </section>
    </main>
  );
}
