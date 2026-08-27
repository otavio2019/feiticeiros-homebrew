# Evidência de produção — 27/08/2026

Fonte consultada: https://vercel.com/otavio2019s-projects/feiticeiros-homebrew

O projeto `feiticeiros-homebrew` está conectado ao repositório `otavio2019/feiticeiros-homebrew`, branch `main`, e a produção está com status **Ready** no commit `939a0526fb7301dd15c14f5f45835e0fc6421f72`. O domínio exibido é https://feiticeiros-homebrew.vercel.app/.

Durante o diagnóstico, o painel mostrou 107 Edge Requests, 46 Function Invocations e Error Rate de 56,5% no período observado. O erro reproduzido por HTTP no endpoint `auth.login` foi uma consulta SQL 500; após o fallback parcial, a consulta mudou de `users.normalizedEmail` para `users.email`, confirmando que o novo bundle estava ativo, mas que a base efetivamente usada pela Vercel também não possuía as colunas selecionadas pelo fallback amplo. A correção seguinte passou a selecionar somente colunas legadas no fallback e ainda precisa ser publicada/verificada.
