export function getAuthErrorMessage(cause: unknown, flow: "login" | "request" | "reset") {
  if (flow === "reset") {
    return "O link de recuperação é inválido ou expirou. Solicite um novo link.";
  }

  return cause instanceof Error ? cause.message : "Não foi possível autenticar.";
}
