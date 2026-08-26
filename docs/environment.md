# Contrato de ambiente

A aplicação é independente de serviços internos. Em desenvolvimento, as variáveis podem ser carregadas manualmente por `.env`; em produção, cadastre-as como variáveis protegidas do provedor. O arquivo `.env` nunca deve ser versionado.

| Grupo | Variáveis | Obrigatoriedade | Observações |
|---|---|---:|---|
| Banco | `DATABASE_URL` | Sim | URL MySQL para TiDB Cloud e o banco `homebrew_forge`. O endpoint público TiDB requer TLS; use a porta `4000`. |
| Sessão | `SESSION_SECRET` | Sim | Valor forte, aleatório e privado. Em produção, a aplicação não aceita seu valor padrão de desenvolvimento. |
| URL pública | `APP_URL` | Para reset de senha | URL canônica da aplicação, sem barra final. Na produção atual: `https://feiticeiros-homebrew.vercel.app`. |
| Imagens | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Para upload | Necessárias para o upload de capa e imagens por seção. O segredo fica exclusivamente no servidor. |
| SMTP | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Para reset de senha por e-mail | Dados do provedor SMTP. `SMTP_PORT=465` normalmente usa TLS implícito; `587` normalmente usa STARTTLS. |
| Compatibilidade | `OWNER_OPEN_ID` | Não | Preserva a identificação do proprietário administrador quando aplicável. |
| Execução local | `NODE_ENV`, `PORT` | Não na Vercel | Necessárias apenas para o servidor Node persistente. A Vercel não exige porta manual. |

## Vercel

Cadastre `DATABASE_URL`, `SESSION_SECRET` e `APP_URL` em **Production** antes do deploy. Quando Cloudinary e SMTP forem habilitados, cadastre também seus respectivos grupos de variáveis no mesmo ambiente. Para deploys de Preview que usem operações protegidas, inclua configurações de Preview apropriadas; nunca reutilize segredos de produção sem necessidade.

As variáveis não devem ter prefixo `VITE_`, pois segredos com esse prefixo podem ser embutidos no bundle do cliente. A Function Node lê todas as variáveis somente no servidor.

## Verificação

Após configurar um ambiente seguro com `DATABASE_URL`, execute:

```bash
npm install
npm run check
npm test
npm run build
npm run db:verify
```

Para aplicar migrations já revisadas no TiDB Cloud:

```bash
npm run db:migrate
```

Em produção, valide `GET /api/trpc/system.health?input={"json":{"timestamp":0}}`, o cadastro/login/logout, uma Homebrew protegida e um link compartilhável. Testes de upload Cloudinary e de entrega SMTP requerem credenciais reais desses provedores.

## Cuidados operacionais

Não exponha `DATABASE_URL`, `SESSION_SECRET`, `CLOUDINARY_API_SECRET` ou `SMTP_PASSWORD` em logs, commits, screenshots, mensagens ou variáveis públicas do frontend. Ao rotacionar `SESSION_SECRET`, todas as sessões existentes deixam de ser válidas porque o hash armazenado depende dele. Ao rotacionar a senha TiDB, atualize primeiro o ambiente da Vercel e redeploy a aplicação antes de remover acessos necessários de outros consumidores.
