# Evidência de validação publicada — Shikigami

Em 27 de agosto de 2026, após o deploy Vercel do commit `97abe36`, foi criada uma Homebrew privada temporária contendo apenas o módulo **Shikigami & Invocações**.

O formulário publicado apresentou os defaults esperados: **Shikigami Comum**, **Quarto Grau**, seis atributos em **8**, distribuição de atributos em **0/10** e **10 atributos restantes**. O painel de validação mostrou somente três pendências legítimas — resumo, narrativa e nome do Shikigami — sem a pendência falsa de grau ou de orçamento de atributos.

O artefato temporário criado para essa checagem foi identificado como `Validação temporária — Shikigami padrão` e removido da biblioteca após a evidência ser registrada. A biblioteca voltou a exibir apenas a ficha anterior do usuário.

Posteriormente, a migration `0006_famous_khan` foi aplicada ao TiDB externo. A auditoria confirmou as cinco tabelas relacionais de Shikigami e um smoke test reversível confirmou gravação, hidratação, duplicação e remoção em cascata da ficha, seus seis atributos, dezesseis perícias, dezessete opções e duas entradas livres.
