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

## Matriz de divergências e evidências

| Divergência ou detalhe confirmado | Decisão adotada da fonte prioritária | Código responsável | Regressão ou evidência |
| --- | --- | --- | --- |
| Nomenclatura do quinto grau | A planilha usa **Grau Especial**, não “Especial Grau”. | `SHIKIGAMI_GRADE_LABELS` em `shared/homebrewRules.ts`, reutilizado pelo editor e pela leitura. | `ShikigamiConfiguration.test.tsx` exige a opção literal; `SharedHomebrew.shikigami.test.tsx` exige o grau na ficha pública. |
| Nomenclatura das melhorias do controlador | As três opções usam o prefixo **Melhoria de Controlador:** e a última inclui **(CD)**. | Listas de opções em `ShikigamiConfiguration.tsx` e mapa de leitura em `SharedHomebrew.tsx`. | Ambos os testes de interface exigem Resistência, Mobilidade e Precisão (CD) literalmente. |
| Terceiro bônus de perícia | A planilha possui Bônus em Perícia A, B e C. | `bonusSkillA/B/C` no editor, motor, leitura e persistência; migration `0007_worthless_lily_hollister`. | Testes de editor, leitura, motor e normalização; `npm run verify:shikigami` valida 18 opções persistidas. |
| Vagas de ações e características | A planilha separa dez ações e dez características; o custo considera no máximo vinte entradas. | Limite de cada coleção no editor e `slice(0, 10)` na normalização do servidor; custo central no motor. | `server/homebrewRules.test.ts`, `server/shikigamiNormalization.test.ts` e smoke test TiDB. |
| Estado visual de vida | A planilha mostra máximos, perdidos, atuais e percentual. | `calculateShikigamiReferenceStats`, barra acessível no editor e no `ShikigamiReadCard`. | Regressão de editor exige 100%; regressão pública exige 88% no cenário com perda de vida. |
| Grade de perícias calculadas | A planilha apresenta as dezesseis perícias e seus totais, não apenas entradas brutas. | `calculateShikigamiReferenceStats` e grade pública do `ShikigamiReadCard`. | `SharedHomebrew.shikigami.test.tsx` exige a seção e a perícia Feitiçaria. |
| Bases, orçamentos e resultados derivados | Comum/Manipulação começam em 8; Técnica começa em 10; as tabelas de orçamento diferem por tipo. | Constantes e cálculo em `shared/homebrewRules.ts`; validação contextual reutiliza os mesmos defaults. | `server/homebrewRules.test.ts` cobre defaults, tipo Técnica, orçamento e estado inicial sem pendência falsa. |
| Dados não calculados | RD, dano, ataque e descrições não recebem uma regra inventada. | Ações, características e anotações persistem conteúdo livre; resultados derivados não são gravados como fonte de verdade. | Auditoria manual do editor e `server/shikigamiNormalization.test.ts` verificam normalização sem fórmula adicional. |
| PDF complementar versus planilha | Quando a planilha fornece controle ou fórmula, ela prevalece; o PDF só preenche lacunas explicitamente marcadas como manuais. | `docs/criador-de-feiticos-planilha-notas-2026-08-27.md` e o motor compartilhado. | Esta matriz, os testes acima e a abertura publicada da ficha não listada documentada em `evidencia-compartilhamento-2026-08-28.md`. |

> A matriz lista todas as divergências identificadas durante a inspeção da exportação da planilha. Não há fórmula adicional extraída do PDF aplicada para substituir uma regra fornecida pela planilha.

## Evidências de regressão

| Evidência | Cobertura |
| --- | --- |
| `server/homebrewRules.test.ts` | Defaults, orçamentos por tipo, custo limitado a 20 e três bônus em perícia. |
| `client/src/components/ShikigamiConfiguration.test.tsx` | Terceira seleção, contadores de vagas, barra de estado e rótulos literais no editor. |
| `client/src/pages/SharedHomebrew.shikigami.test.tsx` | Barra percentual, perícias calculadas, opções, rótulos literais e leitura pública. |
| `server/shikigamiNormalization.test.ts` | Normalização dos valores, limites de dez vagas por coleção e coleções fechadas. |
| `npm run verify:shikigami` | Smoke test reversível no TiDB: gravação, hidratação, cópia e exclusão das relações. |
| `docs/evidencia-compartilhamento-2026-08-28.md` | Abertura publicada da ficha não listada na rota `/s/q3CqKSMjxnK`, sem expor fichas privadas. |
