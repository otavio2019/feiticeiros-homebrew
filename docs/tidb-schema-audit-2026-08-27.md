# Auditoria do schema TiDB — 27/08/2026

## Escopo

Esta auditoria foi executada usando exclusivamente `TIDB_DATABASE_URL`. A variável integrada `DATABASE_URL` não foi alterada, e nenhuma credencial foi impressa ou incluída neste documento.

## Identidade do banco consultado

| Verificação | Resultado |
|---|---|
| Host de conexão | `gateway01.us-east-1.prod.aws.tidbcloud.com:4000` |
| Banco solicitado pelo DSN | `homebrew_forge` |
| Banco ativo retornado por `SELECT DATABASE()` | `homebrew_forge` |
| Versão do servidor | `8.0.11-TiDB-v8.5.3-serverless` |

> **Conclusão:** a auditoria acessou o banco TiDB `homebrew_forge` solicitado, não o banco integrado local.

## Inventário e comparação de schema

O inventário retornou as 20 tabelas previstas pelo `drizzle/schema.ts`: `users`, `authSessions`, `authIdentities`, `passwordResetTokens`, `homebrews`, `homebrewModules`, `homebrewElements`, `homebrewImages`, `homebrewStructuredElements` e todas as tabelas mecânicas estruturadas, além de `__drizzle_migrations`.

| Critério | Resultado |
|---|---|
| Tabelas previstas ausentes | Nenhuma |
| Tabela `users` | Existe |
| Colunas previstas em `users` ausentes | Nenhuma |
| Colunas confirmadas | `id`, `openId`, `name`, `email`, `normalizedEmail`, `passwordHash`, `loginMethod`, `role`, `createdAt`, `updatedAt`, `lastSignedIn` |
| Histórico Drizzle | Quatro registros de migration, correspondentes à sequência `0000`–`0003` |

A estrutura de `users` confirma `id` como chave primária, `openId` como único, `normalizedEmail` como único, e os campos de senha local necessários para autenticação.

## Consulta de verificação

A consulta `SELECT id, email FROM users LIMIT 1` foi executada diretamente no TiDB via `TIDB_DATABASE_URL` com sucesso e retornou uma linha. Não são registrados dados pessoais neste documento.

## Decisão sobre migrations

Não foi aplicada nenhuma migration nesta rodada, pois a comparação não identificou tabelas ou colunas ausentes. Criar tabelas manualmente seria incorreto e desnecessário: o schema completo já está criado e o histórico Drizzle contém a sequência esperada.

## Diagnóstico de produção

Como a consulta direta ao mesmo TiDB funciona, a resposta HTTP 500 da Vercel não é causada por ausência de tabelas, colunas ou migrations em `homebrew_forge`. Ela indica que o runtime publicado ainda não está recebendo o mesmo DSN efetivamente auditado, ou que o deployment testado não incorporou a variável de produção esperada. A próxima validação deve se concentrar no valor e no escopo da variável `TIDB_DATABASE_URL` dentro da Vercel, sem remover nem expor a variável integrada `DATABASE_URL`.
