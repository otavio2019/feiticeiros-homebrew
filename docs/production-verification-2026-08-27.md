# Verificação externa da Vercel — 2026-08-27

A URL `https://feiticeiros-homebrew.vercel.app/` carregou externamente com título **Homebrew Forge — Feiticeiros & Maldições**, navegação principal, biblioteca e CTA de criação visíveis.

O primeiro probe manual para `system.health` usando `?input={}` retornou HTTP 400 com erro tRPC de entrada ausente (`expected object, received undefined`). Isso indica que o endpoint está alcançável, mas o formato de query usado pelo probe não corresponde ao envelope esperado pela versão atual do tRPC. Nenhuma mutação ou ação autenticada foi executada.

Próximo passo de verificação: usar o envelope tRPC correto (`input={"json":{}}`) e registrar o payload retornado antes de marcar o health check externo como concluído.


O probe corrigido, usando `?input={"json":{"timestamp":1}}`, retornou `{"result":{"data":{"json":{"ok":true}}}}` na URL pública da Vercel. Portanto a Function serverless está alcançável e o procedimento `system.health` respondeu com sucesso externamente.


A rota `https://feiticeiros-homebrew.vercel.app/s/compartilhar-7` também foi alcançada externamente. Após o carregamento, retornou **Ficha indisponível**, portanto esse identificador de exemplo não é uma evidência válida de leitura de dados em produção. Não foi possível testar uma ficha real sem um `shareId` público existente no ambiente final; nenhuma escrita foi executada.
