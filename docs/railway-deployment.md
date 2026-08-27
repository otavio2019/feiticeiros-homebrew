# Registro histórico do deploy Railway

O projeto público `otavio2019/feiticeiros-homebrew` foi anteriormente executado no Railway, no projeto **proactive-vibrancy**, com o serviço `feiticeiros-homebrew` e um banco MySQL interno. Esse ambiente foi usado como contingência durante a migração para a Vercel.

## Status em 27 de agosto de 2026

Conforme confirmação explícita do responsável pelo projeto nesta data, a aplicação e os serviços Railway foram desativados. O Railway não faz mais parte da infraestrutura operacional do Homebrew Forge. O domínio Railway abaixo é mantido somente como referência histórica e não deve ser usado para novos acessos ou configurações.

| Componente | Status final | Substituição atual |
|---|---|---|
| Serviço Railway `feiticeiros-homebrew` | Encerrado conforme confirmação do responsável | Vercel Functions e frontend Vite |
| MySQL interno Railway | Encerrado conforme confirmação do responsável | TiDB Cloud, banco `homebrew_forge`, conexão TLS |
| Domínio Railway | Histórico, sem uso operacional | `https://feiticeiros-homebrew.vercel.app/` |
| Repositório | Público, branch `main` | GitHub `otavio2019/feiticeiros-homebrew` |

## Infraestrutura final

A produção usa o frontend Vite servido pela Vercel e uma Function Node serverless para o Express/tRPC. O banco externo é o TiDB Cloud com TLS. A autenticação é local, baseada em sessões persistidas no banco e cookies HTTPS. O Cloudinary fornece o armazenamento de imagens e o SMTP configurado fornece a recuperação de senha.

Nenhuma variável, domínio ou referência operacional do Railway deve ser adicionada a novos ambientes. As credenciais históricas do Railway não devem ser reutilizadas.

## Referência histórica

O Railway anteriormente hospedava a aplicação e um MySQL interno, com deploy associado ao commit `e3b6347` e domínio `https://feiticeiros-homebrew-production.up.railway.app`. Esses dados documentam a origem do ambiente, mas não representam o estado atual da produção.
