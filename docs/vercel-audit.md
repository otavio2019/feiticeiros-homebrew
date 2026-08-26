# Auditoria de migração para Vercel

> **Escopo da auditoria:** análise sem mudança de runtime, rotas ou configuração de deploy. Este documento descreve o estado encontrado antes da adaptação serverless.

## Resumo executivo

O **Homebrew Forge** está funcional como aplicação Node.js independente em sua forma atual. A linha de base passou em TypeScript, build e suíte Vitest, com **14 testes aprovados**. O código-fonte ativo não contém referências a OAuth, Storage, APIs ou plugins proprietários Manus. Porém, o runtime atual foi montado para um servidor Express persistente e, portanto, **não pode ser publicado diretamente na Vercel**: `server/_core/index.ts` cria um servidor HTTP e chama `server.listen()`.

A migração é viável sem reconstruir o produto. A mudança central será separar a fábrica Express/tRPC do inicializador local e expor uma Function em `api/trpc/[...trpc].ts`, com **export default do app Express** e sem listener. A Vercel suporta exportar uma aplicação Express como Function; seu próprio runtime gerencia invocações e escalonamento.[1]

| Área | Estado auditado | Resultado para Vercel |
|---|---|---|
| React + Vite | Build estático concluído em `dist/public` | Compatível; exige output estático e rewrite de SPA |
| Express + tRPC | Funciona sob `/api/trpc`, mas inicia listener próprio | Requer Function catch-all sem `listen()` |
| Sessões | Token aleatório, hash SHA-256, cookie HTTP-only e persistência MySQL | Compatível após ajuste de proxy/cookie HTTPS |
| Drizzle + MySQL | Cliente singleton e schema com 8 tabelas | Compatível com URL MySQL pública e SSL; banco Railway privado não serve após abandono |
| Cloudinary | Adaptador independente por SDK oficial | Compatível; depende dos três secrets Cloudinary |
| SMTP/reset | Variáveis e tabela existem, mas não há transporte, endpoints ou tela ativos | **Lacuna funcional: precisa ser implementado** |
| Homebrew e compartilhamento | CRUD, módulos, imagens e rota `/s/:shareId` existentes | Compatível; necessita rewrite de SPA |
| Manus | Nenhuma referência em fontes ativas | `template.json` ainda conserva conteúdo histórico, mas não é importado no runtime |

## Linha de base validada

O projeto passou nas verificações locais antes da migração:

| Verificação | Resultado |
|---|---|
| `pnpm check` | Aprovado, sem erros TypeScript |
| `pnpm test` | 4 arquivos e 14 testes aprovados |
| `pnpm build` | Aprovado; Vite gerou frontend estático e esbuild gerou o bundle do servidor atual |
| Busca por referências Manus nas fontes ativas | Nenhum resultado em `client`, `server`, `drizzle`, `shared`, `package.json`, `vite.config.ts` e `drizzle.config.ts` |

O build atual emite apenas um aviso de chunk inicial acima de 500 kB. É uma oportunidade de otimização posterior e **não bloqueia** o deploy.

## Achados técnicos

### Runtime e tRPC

O entrypoint atual constrói Express, registra `express.json`, monta `createExpressMiddleware` em `/api/trpc`, serve Vite ou estáticos e chama `server.listen()`. Esse desenho é apropriado para Railway/Render, mas não para a Function solicitada. O contrato tRPC em si é portátil: `client/src/main.tsx` consome a URL relativa `/api/trpc` e envia `credentials: "include"`; logo, mantendo esse caminho, o frontend não exigirá uma URL de API separada.

A adaptação recomendada é criar uma fábrica reutilizável de app Express, usá-la no desenvolvimento local e exportá-la por uma Function catch-all em `api/trpc/[...trpc].ts`. A Function deverá ter `trust proxy` habilitado, corpo JSON limitado ao upload máximo aceito e middleware tRPC idêntico ao atual. A Vercel documenta que Functions são acionadas por invocação e não exigem gerenciamento de servidor; também documenta o export default de Express como modo suportado de execução.[1] [2]

### Cookies e autenticação

O login e cadastro são locais e persistem sessões em `authSessions`, contendo somente hashes de tokens aleatórios. O cookie é `httpOnly`, com caminho `/`, sem domínio fixo e `secure` baseado no protocolo encaminhado. Isso preserva a segurança essencial para Vercel, desde que o app trate `x-forwarded-proto` e confie no proxy.

Como frontend e API permanecerão no mesmo domínio `feiticeiros-homebrew.vercel.app`, a recomendação é usar `sameSite: "lax"` em vez de `"none"`. Isso mantém o cookie de sessão nas chamadas tRPC same-origin sem exigir a política cross-site mais permissiva. O atributo `secure` deverá ser sempre verdadeiro em produção HTTPS.

### Banco e Drizzle

O schema atual é completo para o núcleo do produto: `users`, `authSessions`, `passwordResetTokens`, `authIdentities`, `homebrews`, `homebrewModules`, `homebrewElements` e `homebrewImages`. As rotas preservam os módulos **Origem, Votos/Restrições, Técnicas, Armas, Shikigami, Mecânicas, Aptidões, Especializações e Outros** por enums e dados JSON estruturados.

O cliente Drizzle é lazy e singleton por instância de Function, o que é uma base válida para serverless. A implementação será ajustada para um pool `mysql2/promise` reutilizável e URL de banco externa com TLS, reduzindo o risco de exaustão de conexões em instâncias quentes.

O MySQL criado no Railway está em rede privada e não pode ser a solução final caso Railway seja abandonado. A Vercel não fornece um MySQL nativo neste projeto; será necessário um serviço MySQL/MariaDB compatível e acessível externamente, por exemplo via integração de marketplace ou provedor gerenciado. Migrations não devem rodar automaticamente a cada build de preview; a opção segura é versioná-las e executá-las explicitamente contra o banco de destino.

### Cloudinary e imagens opcionais

O adaptador `server/storage.ts` usa o SDK oficial Cloudinary, recebe credenciais apenas no servidor e faz upload por stream. Ele suporta exclusão por `public_id` e URLs HTTPS. As duas modalidades solicitadas continuam contempladas: a imagem por URL é salva como metadado e o upload passa por Cloudinary. O upload atual restringe JPEG, PNG e WebP a 1 MB de bytes decodificados, dentro de uma entrada tRPC base64 de até 1,5 MB.

O código não depende de Manus Storage. O teste de upload real só poderá ser marcado como aprovado quando as variáveis Cloudinary forem cadastradas na Vercel.

### SMTP e recuperação de senha

Esta é a única lacuna funcional importante encontrada. Apesar de `passwordResetTokens` existir no schema e `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` e `SMTP_FROM` constarem no contrato de ambiente, não há `nodemailer` no manifesto, transporte SMTP, procedimentos tRPC de solicitação/confirmação de reset, helpers de persistência ou interface ativa de recuperação.

Para atender ao escopo solicitado, a adaptação incluirá `nodemailer`, criação e hash de token de reset com expiração, invalidação de token usado, endpoint para solicitar reset, endpoint para redefinir senha, link absoluto baseado em `APP_URL` e testes unitários. O envio real exigirá uma conta SMTP configurada no projeto Vercel.

### Frontend, compartilhamento e rotas SPA

O frontend possui rotas Wouter para `/`, `/login` e `/s/:shareId`. A URL compartilhável usa um procedimento público por `shareId`. A Vercel recomenda um rewrite para `/index.html` em SPAs Vite para permitir deep links; esse comportamento deverá coexistir com o caminho de Function `/api/trpc`.[3]

## Itens que não podem ser considerados aprovados antes dos secrets

| Teste solicitado | Situação atual | Pré-requisito para aprovação real |
|---|---|---|
| Banco | Schema existe, mas o banco final Vercel ainda não foi escolhido | `DATABASE_URL` de MySQL externo e migrations aplicadas |
| Autenticação | Teste unitário cobre cookie/logout | Banco final + `SESSION_SECRET` no ambiente Vercel |
| Cloudinary | Adaptador e testes locais estão prontos para uso | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| SMTP | Não implementado no código ativo | Implementação, `APP_URL` e secrets SMTP válidos |

## Decisões necessárias antes da publicação

1. Definir o provedor do MySQL externo. Para abandonar Railway, o banco não pode continuar dependendo da URL interna dele.
2. Cadastrar os secrets de Cloudinary e SMTP diretamente no painel Vercel ou por integração segura. Eles não serão copiados para código, Git ou mensagens.
3. Autorizar a importação/conexão do repositório `otavio2019/feiticeiros-homebrew` na conta Vercel quando a adaptação estiver validada.
4. Confirmar a desativação definitiva dos recursos Railway somente após o domínio Vercel e os testes de produção funcionarem.

## Arquitetura alvo proposta

```text
Navegador
  │  SPA React/Vite (CDN da Vercel)
  ├── /, /login, /s/:shareId ──────────────► rewrite para index.html
  └── /api/trpc/* ─────────────────────────► Function Node: Express + tRPC
                                                    │
                                                    ├── MySQL externo via Drizzle/mysql2
                                                    ├── Cloudinary via SDK server-side
                                                    └── SMTP via Nodemailer server-side
```

Essa configuração mantém um único domínio HTTPS, preserva o endpoint relativo já consumido pelo cliente e dispensa qualquer servidor persistente ou serviço Manus.

## Referências

[1]: https://vercel.com/docs/functions "Vercel Functions"
[2]: https://vercel.com/docs/frameworks/backend/express "Express on Vercel"
[3]: https://vercel.com/docs/frameworks/frontend/vite "Vite on Vercel"
