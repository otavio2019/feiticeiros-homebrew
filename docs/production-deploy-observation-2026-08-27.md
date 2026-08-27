# Evidência de produção — 27/08/2026

Fonte consultada: https://vercel.com/otavio2019s-projects/feiticeiros-homebrew

O projeto `feiticeiros-homebrew` está conectado ao repositório `otavio2019/feiticeiros-homebrew`, branch `main`, e a produção está com status **Ready** no commit `939a0526fb7301dd15c14f5f45835e0fc6421f72`. O domínio exibido é https://feiticeiros-homebrew.vercel.app/.

Durante o diagnóstico, o painel mostrou 107 Edge Requests, 46 Function Invocations e Error Rate de 56,5% no período observado. O erro reproduzido por HTTP no endpoint `auth.login` foi uma consulta SQL 500; após o fallback parcial, a consulta mudou de `users.normalizedEmail` para `users.email`, confirmando que o novo bundle estava ativo, mas que a base efetivamente usada pela Vercel também não possuía as colunas selecionadas pelo fallback amplo. A correção seguinte passou a selecionar somente colunas legadas no fallback e ainda precisa ser publicada/verificada.

Após o push para `main`, a Vercel exibiu um novo deploy do commit a05fea32 em estado **Building**, enquanto o deployment de produção ainda mostrava 939a052 como Ready. A validação HTTP deve ser repetida somente depois que esse build for promovido.

O detalhe do deployment a05fea32 foi criado pela integração GitHub/Vercel e exibiu o commit correto; durante a consulta, o alias de produção ainda permanecia no deployment anterior. A página de detalhe perdeu a sessão visual ao aguardar, então a verificação final será feita diretamente pelo domínio HTTP e pelo painel do projeto.

Na tela de Environment Variables da Vercel, a produção exibe `DATABASE_URL`, `SESSION_SECRET`, `APP_URL`, Cloudinary e SMTP; não há `TIDB_DATABASE_URL` listado. Como a aplicação agora prioriza `TIDB_DATABASE_URL` e usa `DATABASE_URL` como fallback, a próxima ação operacional é confirmar que o valor de `DATABASE_URL` é o DSN do cluster TiDB que contém o schema atual, ou cadastrar `TIDB_DATABASE_URL` com esse mesmo DSN sem expor o segredo.

Depois da configuração feita pelo proprietário, o painel da Vercel passou a mostrar o deployment do commit `2e8b160` como **Building**. O domínio de produção ainda exibe o deployment anterior como Ready enquanto a reconstrução não termina; o teste de login será repetido após o novo deployment ser promovido.

A tentativa posterior de conferir a lista de variáveis pela sessão do navegador abriu a rota correta, mas a tela perdeu o carregamento ao aguardar e não permitiu confirmar visualmente o nome `TIDB_DATABASE_URL`. O valor nunca foi aberto nem exposto. A confirmação objetiva continua sendo o resultado do endpoint após a configuração e novo deploy.

Na telemetria sanitizada da Vercel, a tentativa controlada de `auth.login` retornou `ER_ACCESS_DENIED_ERROR`, errno `1045`, SQLSTATE `28000`: acesso negado para o usuário de banco configurado. Esse diagnóstico elimina ausência de schema ou migrations como causa do erro na produção. A credencial (senha ou usuário) armazenada em `TIDB_DATABASE_URL` na Vercel precisa ser substituída pela string atual copiada do botão **Connect** do mesmo cluster TiDB auditado. O identificador do usuário de banco e o endereço de origem foram redigidos.

Após a atualização inicial da variável e um novo deployment, a Vercel exibiu o commit `c4b2666` como Ready, mas uma tentativa de login ainda retornou HTTP 500. O painel de logs registrou o mesmo código de acesso negado. Assim, o redeploy ocorreu, porém o valor salvo em `TIDB_DATABASE_URL` ainda não autentica no cluster; a ação pendente é substituir a string pelo DSN atual completo emitido pelo TiDB Cloud, sem modificar schema ou migrations.

O console TiDB não permaneceu carregado na sessão automatizada durante a navegação posterior. A troca do segredo continuará sendo feita diretamente pelo proprietário em TiDB Cloud e Vercel, mantendo a string de conexão fora de logs e mensagens.

Após a substituição da URI de conexão e o redeploy confirmados pelo proprietário, uma chamada controlada a `auth.login` retornou HTTP **401** com a resposta funcional `E-mail ou senha inválidos.` para uma credencial deliberadamente inválida. Isso confirma que a Function Vercel passou a autenticar com sucesso no TiDB e que o erro `ER_ACCESS_DENIED_ERROR` foi resolvido. A validação de sessão com a conta real depende da navegação autenticada do proprietário, que confirmou que o fluxo de login deu certo.

Os logs Vercel posteriores registraram, na sequência, `POST auth.login` com HTTP **200**, `GET auth.me` com HTTP **200**, `GET homebrew.list` com HTTP **200**, `POST homebrew.create` com HTTP **200** e consultas estruturadas posteriores também com HTTP **200**. Essa sequência comprova que o cookie de sessão foi aceito na navegação real, que o backend leu a identidade autenticada e que uma operação protegida de Homebrew foi persistida após a correção da credencial TiDB.

Foi enviado ao GitHub o commit `eb6d52a`, que altera o cadastro duplicado para `CONFLICT` e aprimora a sanitização dos logs. O painel da Vercel mostrou um novo deployment desse commit em construção; a validação externa do novo comportamento de `auth.register` será feita após o status Ready.

Após a promoção do commit `eb6d52a`, uma tentativa controlada de cadastro com e-mail já existente retornou HTTP **409** com o código tRPC `CONFLICT` e a mensagem `Este e-mail já está cadastrado. Entre com sua senha ou use a recuperação de senha.` Não houve criação de conta adicional. Isso confirma a correção do erro 500 observado anteriormente em `auth.register`.
