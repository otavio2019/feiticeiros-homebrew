# TiDB Cloud — Homebrew Forge

> Este registro não contém senha, URL de conexão completa ou qualquer outra credencial.

## Recurso criado

| Campo | Valor |
|---|---|
| Instância | `homebrew-forge` |
| Plano | TiDB Cloud Starter |
| Limite mensal | US$ 0,00 (somente cota gratuita) |
| Provedor/região | AWS, N. Virginia (`us-east-1`) |
| Endpoint público | `gateway01.us-east-1.prod.aws.tidbcloud.com:4000` |
| TLS | Obrigatório para endpoint público |
| Banco lógico alvo | `homebrew_forge` (criado e confirmado no SQL Editor) |

## Uso no deploy

A aplicação usa Drizzle com `mysql2/promise`, pool reutilizável e TLS 1.2 para hosts `*.tidbcloud.com`. A `DATABASE_URL` será cadastrada apenas no ambiente Vercel; ela não deve ser inserida neste repositório, em arquivos `.env` versionados ou nesta documentação.

O TiDB Cloud Starter requer TLS em conexões de endpoint público e recomenda o uso de pools em aplicações Node.js.[1]

## Referências

[1]: https://docs.pingcap.com/developer/dev-guide-sample-application-nodejs-mysql2/ "Connect to TiDB with node-mysql2"
