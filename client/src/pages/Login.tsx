import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthErrorMessage } from "@/lib/authError";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const [, navigate] = useLocation();
  const [recoveryMode, setRecoveryMode] = useState<"login" | "request" | "reset">(() =>
    new URLSearchParams(window.location.search).has("reset") ? "reset" : "login",
  );
  const [registerMode, setRegisterMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const login = trpc.auth.login.useMutation();
  const register = trpc.auth.register.useMutation();
  const requestPasswordReset = trpc.auth.requestPasswordReset.useMutation();
  const resetPassword = trpc.auth.resetPassword.useMutation();
  const mutation = registerMode ? register : login;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      if (recoveryMode === "request") {
        await requestPasswordReset.mutateAsync({ email });
        setError("Se esse e-mail estiver cadastrado, enviaremos um link de recuperação.");
        return;
      }
      if (recoveryMode === "reset") {
        const token = new URLSearchParams(window.location.search).get("reset");
        if (!token) throw new Error("Link de recuperação inválido.");
        await resetPassword.mutateAsync({ token, password });
        setRecoveryMode("login");
        setError("Senha redefinida. Entre com sua nova senha.");
        return;
      }
      if (registerMode) await register.mutateAsync({ name, email, password });
      else await login.mutateAsync({ email, password });
      await utils.auth.me.invalidate();
      navigate("/");
    } catch (cause) {
      setError(getAuthErrorMessage(cause, recoveryMode));
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground">
      <section className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Homebrew Forge</p>
        <h1 className="mt-3 text-3xl font-semibold">{recoveryMode === "request" ? "Recuperar senha" : recoveryMode === "reset" ? "Definir nova senha" : registerMode ? "Criar sua conta" : "Entrar na forja"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{recoveryMode === "request" ? "Enviaremos um link seguro se o e-mail estiver cadastrado." : recoveryMode === "reset" ? "Escolha uma senha nova com pelo menos oito caracteres." : "Use uma conta local para salvar e compartilhar suas criações."}</p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          {registerMode && recoveryMode === "login" && <div className="space-y-2"><Label htmlFor="name">Nome</Label><Input id="name" value={name} onChange={event => setName(event.target.value)} required maxLength={120} /></div>}
          {recoveryMode !== "reset" && <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email" /></div>}
          {recoveryMode !== "request" && <div className="space-y-2"><Label htmlFor="password">Senha</Label><Input id="password" type="password" value={password} onChange={event => setPassword(event.target.value)} required minLength={8} autoComplete={registerMode || recoveryMode === "reset" ? "new-password" : "current-password"} /></div>}
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <Button className="w-full" type="submit" disabled={mutation.isPending || requestPasswordReset.isPending || resetPassword.isPending}>{mutation.isPending || requestPasswordReset.isPending || resetPassword.isPending ? "Processando…" : recoveryMode === "request" ? "Enviar link" : recoveryMode === "reset" ? "Salvar nova senha" : registerMode ? "Criar conta" : "Entrar"}</Button>
        </form>
        {recoveryMode === "login" ? <div className="mt-5 flex flex-col gap-3 text-sm"><button className="text-left text-primary underline-offset-4 hover:underline" type="button" onClick={() => { setRegisterMode(value => !value); setError(null); }}>{registerMode ? "Já tenho uma conta" : "Ainda não tenho conta"}</button>{!registerMode && <button className="text-left text-primary underline-offset-4 hover:underline" type="button" onClick={() => { setRecoveryMode("request"); setError(null); }}>Esqueci minha senha</button>}</div> : <button className="mt-5 text-sm text-primary underline-offset-4 hover:underline" type="button" onClick={() => { setRecoveryMode("login"); setError(null); }}>Voltar para entrar</button>}
      </section>
    </main>
  );
}
