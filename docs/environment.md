# Contrato de ambiente

A aplicação é independente de serviços internos e recebe toda a configuração por variáveis de ambiente. Em desenvolvimento, elas podem ser carregadas por um arquivo `.env` local criado manualmente; em produção, devem ser cadastradas no painel do provedor. O arquivo `.env` não deve ser versionado.

| Grupo | Variáveis | Observações |
|---|---|---|
| Execução | `NODE_ENV`, `PORT` | Use `NODE_ENV=production`. O host normalmente injeta `PORT`; o código não fixa uma porta. |
| Banco | `DATABASE_URL` | Conexão MySQL/MariaDB usada por Drizzle. |
| Sessão | `SESSION_SECRET` | Segredo privado para configurações de sessão. Gere valor aleatório forte. |
| Imagens | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Necessárias para os uploads do construtor. O segredo nunca deve ir para o frontend. |
| SMTP | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Necessárias para envio de mensagens de recuperação de senha. |
| Compatibilidade | `OWNER_OPEN_ID` | Opcional; preserva a identificação do proprietário administrador quando aplicável. |

## Verificação

Após cadastrar as variáveis, execute:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm start
```

O processo de produção deve iniciar sem depender de OAuth, storage proxy, APIs internas ou plugins proprietários. Para validar imagens, configure as três variáveis Cloudinary e teste o fluxo de upload por uma conta autenticada.

## Cuidados operacionais

Não exponha `CLOUDINARY_API_SECRET`, `SESSION_SECRET`, `SMTP_PASSWORD` ou a senha do banco em logs, commits, screenshots ou variáveis públicas do frontend. Em Railway e Render, cadastre os valores como secrets/environment variables do serviço. Ao trocar o segredo de sessão, sessões existentes podem deixar de ser válidas, dependendo da política adotada pelo provedor.
