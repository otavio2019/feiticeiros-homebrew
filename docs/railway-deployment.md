# Estado do deploy Railway

O repositório público `otavio2019/feiticeiros-homebrew` está conectado ao Railway no projeto **proactive-vibrancy**. O serviço é **feiticeiros-homebrew** e o deploy associado ao commit `e3b6347` (`feat: add structured shikigami builder`) foi confirmado como ativo.

| Item | Estado |
|---|---|
| Repositório GitHub | Conectado ao branch `main` |
| Serviço Railway | Online, região EU West, 1 réplica |
| Banco Railway | Serviço MySQL interno provisionado e online |
| Deploy de Shikigami | Ativo com sucesso |
| Domínio público | [`https://feiticeiros-homebrew-production.up.railway.app`](https://feiticeiros-homebrew-production.up.railway.app) |
| Variáveis configuradas | `DATABASE_URL` referenciando `MySQL.MYSQL_URL` e `SESSION_SECRET` aleatório |
| Variáveis restantes | Cloudinary e SMTP, conforme os recursos forem habilitados |

## Próximos passos no Railway

O frontend público e o endpoint `system.health` já foram verificados no domínio Railway. O health check respondeu `{"ok":true}` com a entrada tRPC esperada. O banco MySQL interno está conectado por `DATABASE_URL` e as sessões usam `SESSION_SECRET`, ambos mantidos apenas no painel Railway. Ainda é necessário aplicar o schema no banco e cadastrar as três variáveis Cloudinary e, se o fluxo for utilizado, as variáveis SMTP descritas em [`environment.md`](environment.md). Depois, valide os fluxos que dependem do banco e das imagens.
