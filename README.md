# Feiticeiros & Maldições — Homebrew Forge

O Homebrew Forge é uma aplicação web para criar, organizar, validar e compartilhar conteúdo personalizado de **Feiticeiros & Maldições**. O projeto preserva o construtor modular, a biblioteca de Homebrews, o modo manual avançado, as validações contextuais, a leitura pública por link compartilhável e as imagens opcionais por URL ou Cloudinary.

## Construtor de Shikigami

O módulo **Shikigami & Invocações** possui ficha estruturada. O criador escolhe grau, nome, nível do usuário e bônus de proficiência, distribui atributos e registra habilidades. A aplicação calcula custo em PE, orçamento de pontos, limite por atributo, vida e defesa conforme as regras mapeadas no projeto.

O modo manual continua disponível para campanhas com exceções. Quando habilitado, permite ultrapassar limites automáticos, mantendo a exceção identificada na Homebrew e em sua leitura compartilhável.

## Arquitetura e deploy

A aplicação usa React 19, Vite 7, Express 4, tRPC 11, Drizzle ORM, TiDB Cloud compatível com MySQL, Cloudinary, Nodemailer e Vitest. A interface estática é construída pelo Vite e o backend é uma **Function Node da Vercel** em `api/trpc/[...trpc].ts`; essa Function reutiliza `server/app.ts` e nunca executa `server.listen()`.

O deploy de produção é disponibilizado em [https://feiticeiros-homebrew.vercel.app](https://feiticeiros-homebrew.vercel.app). O frontend e a API usam o mesmo domínio, permitindo que cookies de sessão `HttpOnly`, `SameSite=Lax` e `Secure` funcionem sem configuração de CORS adicional.

> O Railway foi encerrado em 27 de agosto de 2026 após a validação da Vercel e autorização explícita do proprietário. A infraestrutura operacional final é Vercel + TiDB Cloud; o registro histórico está em [`docs/railway-deployment.md`](docs/railway-deployment.md).

## Requisitos

É necessário Node.js 20 ou superior, npm 10 ou compatível, uma instância TiDB Cloud ou MySQL acessível, uma conta Cloudinary para uploads e um servidor SMTP para recuperação de senha.

## Instalação e validação local

```bash
npm install
npm run check
npm test
npm run build
npm run dev
```

Para executar o servidor Node persistente fora da Vercel, use `npm start` após o build. A Vercel não usa esse comando: ela publica `dist/public` e executa a Function tRPC sob demanda.

## Variáveis de ambiente

| Variável | Obrigatória | Onde usar | Finalidade |
|---|---:|---|---|
| `DATABASE_URL` | Sim | Vercel/servidor | URL MySQL de TiDB Cloud com o banco `homebrew_forge`. A conexão deve usar TLS. |
| `SESSION_SECRET` | Sim | Vercel/servidor | Segredo aleatório privado usado no HMAC dos tokens de sessão. |
| `APP_URL` | Sim para reset | Vercel/servidor | URL pública canônica, por exemplo `https://feiticeiros-homebrew.vercel.app`, usada nos links de recuperação. |
| `CLOUDINARY_CLOUD_NAME` | Sim para upload | Vercel/servidor | Identificador do cloud Cloudinary. |
| `CLOUDINARY_API_KEY` | Sim para upload | Vercel/servidor | Chave de API Cloudinary. |
| `CLOUDINARY_API_SECRET` | Sim para upload | Vercel/servidor | Segredo de API Cloudinary; nunca deve chegar ao navegador. |
| `SMTP_HOST` | Sim para reset por e-mail | Vercel/servidor | Host do provedor SMTP. |
| `SMTP_PORT` | Sim para reset por e-mail | Vercel/servidor | Porta SMTP, normalmente `587` ou `465`. |
| `SMTP_USER` | Sim para reset por e-mail | Vercel/servidor | Usuário SMTP. |
| `SMTP_PASSWORD` | Sim para reset por e-mail | Vercel/servidor | Senha ou token de aplicativo SMTP. |
| `SMTP_FROM` | Sim para reset por e-mail | Vercel/servidor | Remetente apresentado nas mensagens. |
| `OWNER_OPEN_ID` | Não | Vercel/servidor | Compatibilidade para promover o proprietário a administrador quando aplicável. |
| `NODE_ENV` | Não | Servidor Node persistente | Use `production` fora da Vercel; a plataforma já define esse contexto na Function. |
| `PORT` | Não | Servidor Node persistente | Porta fornecida pelo host; a aplicação não fixa esse valor. |

Não versione `.env`, URLs de banco, chaves, tokens ou senhas. O arquivo [`docs/environment.md`](docs/environment.md) detalha o contrato operacional.

## Banco de dados e TiDB Cloud

O schema está em `drizzle/schema.ts`; as migrations versionadas estão em `drizzle/`. Como TiDB Cloud exige TLS, as migrations devem reutilizar o pool seguro da aplicação:

```bash
npm run db:generate
npm run db:migrate
npm run db:verify
```

`db:migrate` aplica as migrations existentes e `db:verify` confirma conexão TLS e a presença das tabelas essenciais. Execute ambos com `DATABASE_URL` definido em ambiente seguro. Antes de alterações estruturais futuras, revise o SQL gerado e faça backup apropriado.

## Configuração na Vercel

O arquivo `vercel.json` estabelece `npm install`, executa `npm run build:client`, serve `dist/public`, mantém a Function tRPC em `api/trpc/[...trpc].ts` e limita o fallback para `index.html` às rotas que não começam por `/api/`. Portanto, links profundos como `/login` e `/s/:shareId` continuam abrindo a SPA sem interceptar a API.

Cadastre todas as variáveis obrigatórias no ambiente **Production** da Vercel. Para prévias de pull requests que precisem de banco e autenticação, registre valores independentes também em **Preview**. Nunca use variáveis `VITE_*` para segredos.

O health check público requer a entrada tRPC de `timestamp`:

```text
GET /api/trpc/system.health?input={"json":{"timestamp":0}}
```

O retorno esperado é o envelope JSON tRPC com `{ "ok": true }`.

## Testes e qualidade

```bash
npm run check
npm test
npm run build
```

Os testes cobrem regras do construtor, autenticação local, logout, recuperação de senha, configuração TiDB/TLS e o endpoint HTTP tRPC de health. O build pode avisar sobre o tamanho do bundle inicial, mas deve terminar com sucesso.

## Estrutura principal

| Caminho | Responsabilidade |
|---|---|
| `client/src/pages/Home.tsx` | Biblioteca e construtor modular. |
| `client/src/components/ShikigamiConfiguration.tsx` | Ficha estruturada e calculada de Shikigami. |
| `client/src/pages/Login.tsx` | Login, cadastro, recuperação e redefinição de senha. |
| `api/trpc/[...trpc].ts` | Entrada serverless da Function Node Vercel. |
| `server/app.ts` | Fábrica Express reutilizada localmente e na Vercel. |
| `server/routers.ts` | Contratos tRPC de autenticação e Homebrew. |
| `server/_core/sdk.ts` | Sessões locais persistentes com HMAC. |
| `server/storage.ts` | Upload, URL e exclusão de imagens no Cloudinary. |
| `drizzle/schema.ts` | Schema MySQL, usuários, sessões e conteúdo. |
| `server/*.test.ts` | Testes automatizados. |
