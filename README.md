# Feiticeiros & Maldições — Homebrew Forge

O Homebrew Forge é uma aplicação web para criar, organizar, validar e compartilhar conteúdo personalizado de **Feiticeiros & Maldições**. O projeto preserva o construtor modular existente, a biblioteca de Homebrews, o modo manual avançado, as validações contextuais, a leitura pública por link compartilhável e o upload opcional de imagens.

## Construtor de Shikigami

O módulo **Shikigami & Invocações** possui uma ficha estruturada. O criador escolhe o grau, informa o nome, nível do usuário, bônus de proficiência e distribui atributos. A aplicação calcula custo em PE, orçamento de pontos, limite por atributo, vida e defesa a partir das regras mapeadas no projeto. Habilidades também são registradas como itens estruturados, com nome e descrição, e não apenas como um bloco de texto.

O modo manual continua disponível para campanhas que usem exceções. Quando habilitado, a ficha permite ultrapassar os limites automáticos, mantendo a exceção identificada na Homebrew e na leitura compartilhável.

## Stack

A aplicação usa React 19, Vite 7, Express 4, tRPC 11, Drizzle ORM, MySQL, Cloudinary, Nodemailer e Vitest. A autenticação é local: usuários são armazenados no banco, senhas usam `scrypt` do Node.js e as sessões são tokens aleatórios persistidos apenas em forma de hash.

## Requisitos

É necessário Node.js 20 ou superior, pnpm 10 ou compatível, um banco MySQL/MariaDB acessível pela aplicação, uma conta Cloudinary para imagens e um servidor SMTP para recuperação de senha quando esse fluxo for habilitado pela interface.

## Instalação local

```bash
pnpm install
cp .env.example .env
pnpm check
pnpm test
pnpm build
pnpm start
```

O servidor lê `PORT` do ambiente e serve o frontend compilado a partir de `dist/public`. Em desenvolvimento, use `pnpm dev`.

## Variáveis de ambiente

| Variável | Obrigatória | Uso |
|---|---:|---|
| `DATABASE_URL` | Sim | URL de conexão MySQL/MariaDB usada pelo Drizzle. |
| `SESSION_SECRET` | Sim | Segredo auxiliar da aplicação; mantenha privado e aleatório. |
| `CLOUDINARY_CLOUD_NAME` | Sim para uploads | Nome do cloud Cloudinary. |
| `CLOUDINARY_API_KEY` | Sim para uploads | Chave de API do Cloudinary. |
| `CLOUDINARY_API_SECRET` | Sim para uploads | Segredo de API do Cloudinary. |
| `SMTP_HOST` | Para e-mail | Host SMTP para recuperação de senha. |
| `SMTP_PORT` | Para e-mail | Porta SMTP, normalmente `587` ou `465`. |
| `SMTP_USER` | Para e-mail | Usuário SMTP. |
| `SMTP_PASSWORD` | Para e-mail | Senha SMTP. |
| `SMTP_FROM` | Para e-mail | Remetente exibido nas mensagens. |
| `OWNER_OPEN_ID` | Opcional | Identificador legado usado apenas para preservar a promoção do proprietário a administrador. |
| `NODE_ENV` | Não | Use `production` no servidor publicado. |
| `PORT` | Não | Porta fornecida pelo host; não fixe esse valor no código. |

Nunca versionar `.env` ou credenciais. O arquivo [`docs/environment.md`](docs/environment.md) contém um modelo expandido do contrato de ambiente.

## Banco de dados

O schema está em `drizzle/schema.ts`. Para gerar e aplicar migrações em um ambiente controlado, use o fluxo do Drizzle configurado no projeto:

```bash
pnpm db:push
```

Antes de aplicar mudanças em produção, faça backup do banco e revise o SQL gerado. A aplicação não cria dados de demonstração automaticamente.

## Deploy no Railway

Crie um serviço a partir do repositório GitHub, configure as variáveis da seção anterior e use os comandos padrão do projeto. O build deve executar `pnpm install --frozen-lockfile && pnpm build`; o start deve executar `pnpm start`. Configure o banco MySQL/MariaDB como serviço ou forneça uma conexão gerenciada em `DATABASE_URL`. Depois do primeiro deploy, aplique as migrações do banco a partir de um ambiente administrativo seguro.

## Deploy no Render

Crie um **Web Service** conectado ao repositório, selecione um ambiente Node e configure `pnpm install --frozen-lockfile && pnpm build` como build command e `pnpm start` como start command. Cadastre as mesmas variáveis de ambiente e use um banco MySQL/MariaDB externo compatível. O Render fornece a porta pelo ambiente; por isso o projeto usa `PORT` e não depende de uma porta fixa.

## Testes e qualidade

```bash
pnpm check
pnpm test
pnpm build
```

Os testes cobrem autenticação de logout, hashing de senha, regras de Homebrew e fluxos de dados do construtor. O build pode emitir um aviso sobre tamanho do bundle do frontend, mas deve terminar com sucesso.

## Estrutura principal

| Caminho | Responsabilidade |
|---|---|
| `client/src/pages/Home.tsx` | Biblioteca e construtor modular. |
| `client/src/components/ShikigamiConfiguration.tsx` | Ficha estruturada e calculada de Shikigami. |
| `client/src/pages/Login.tsx` | Login e cadastro locais. |
| `server/routers.ts` | Contratos tRPC de autenticação e Homebrew. |
| `server/_core/sdk.ts` | Sessões locais persistentes. |
| `server/storage.ts` | Upload, URL e exclusão de imagens no Cloudinary. |
| `drizzle/schema.ts` | Schema MySQL, usuários, sessões e conteúdo. |
| `server/*.test.ts` | Testes automatizados. |
