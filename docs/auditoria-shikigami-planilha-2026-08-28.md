# Auditoria de alinhamento — planilha de Shikigamis

## Fonte e critério

Esta auditoria confronta a implementação com a exportação somente-leitura da aba **Shikigamis**, fornecida pelo usuário como referência prioritária. O PDF complementar foi usado apenas onde a planilha não define um comportamento. Quando a planilha exibe um campo livre, o Forge o conserva como entrada manual identificada, sem criar uma fórmula nova.

| Área da planilha | Fórmula ou controle confirmado | Implementação atual | Situação |
| --- | --- | --- | --- |
| Tipo e grau | Três tipos e cinco graus; quinto rótulo é **Grau Especial**. | Listas fechadas, defaults Comum/Quarto e rótulo literal para Grau Especial. | Alinhado |
| Atributos | Base 8 para Comum/Manipulação, 10 para Técnica; modificador arredondado para baixo/acima conforme o sinal. | Seis atributos com as mesmas bases; `floor((atributo − 10) / 2)` é equivalente para valores inteiros. | Alinhado |
| Orçamento | Comum/Manipulação: 10/15/20/30/40. Técnica: 10/20/30/40/60. | Orçamentos por tipo e grau no motor e no validador. | Alinhado |
| Estado | Atuais = Máximos − Perdidos + Curados e barra percentual. | Valores derivados, limite inferior em zero e barra percentual no editor e na leitura. | Alinhado |
| Vida, CD, CA e movimento | Fórmulas por tipo, grau, atributos, nível, maestria e escolhas ativas. | Cálculo centralizado em `calculateShikigamiReferenceStats`; resultados não são persistidos. | Alinhado |
| Perícias | Bônus próprio + metade do nível + modificador + Mt./Es. + escolhas de bônus. | Dezesseis perícias nomeadas, totais no editor e na leitura pública. | Alinhado para as perícias nomeadas |
| Bônus em perícia | A planilha contém três seleções independentes. | Seleções A/B/C, cada uma com bônus por grau; a terceira também é persistida na migration `0007_worthless_lily_hollister`. | Alinhado |
| Ações e características | Dez vagas de ação e dez de característica; custo usa no máximo vinte células preenchidas. | Dois grupos com limite de dez registros, contador explícito e custo limitado a vinte entradas preenchidas. | Alinhado |
| Tamanho | Seis opções e modificadores opostos para ataques e resistências. | Lista fechada e modificadores recalculados no editor e na leitura. | Alinhado |
| Dados relacionais | Ficha, atributos, perícias, escolhas e entradas livres são dados distintos. | `shikigamiSheets`, `shikigamiAttributes`, `shikigamiSkills`, `shikigamiOptions` e `shikigamiAbilities`, com hidratação, duplicação e limpeza testadas no TiDB. | Alinhado |

## Itens deliberadamente manuais

> A planilha reserva campos livres para dano, RD, ataques e descrições. O Forge não atribui valores automáticos a esses campos. Eles permanecem em ações, características e anotações, com o texto de interface sinalizando que são valores manuais.

A exportação contém repetições de **História** e **Furtividade** em linhas posteriores à grade principal, sem rótulos ou regras independentes que permitam tratá-las como novas perícias. O editor mantém uma lista única das dezesseis perícias nomeadas e não cria duplicatas artificiais. Isso evita converter uma repetição sem semântica documentada em uma regra de jogo.

## Evidências de regressão

| Evidência | Cobertura |
| --- | --- |
| `server/homebrewRules.test.ts` | Defaults, orçamentos por tipo, custo limitado a 20 e três bônus em perícia. |
| `client/src/components/ShikigamiConfiguration.test.tsx` | Terceira seleção, contadores de vagas e barra de estado no editor. |
| `client/src/pages/SharedHomebrew.shikigami.test.tsx` | Barra percentual, perícias calculadas, opções e leitura pública. |
| `server/shikigamiNormalization.test.ts` | Normalização dos valores e coleções fechadas. |
| `npm run verify:shikigami` | Smoke test reversível no TiDB: gravação, hidratação, cópia e exclusão das relações. |
