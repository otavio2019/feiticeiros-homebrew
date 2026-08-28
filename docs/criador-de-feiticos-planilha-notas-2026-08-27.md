# Notas de Análise — CriadordeFeitiços.xlsx

## Evidências iniciais

A planilha contém uma única aba, **Criação de Feitiços**, com 114 linhas e 89 colunas. A experiência é um formulário amplo que centraliza entradas controladas, cálculos e resultados no mesmo modelo, em vez de um cadastro livre por texto.

Os controles identificados até aqui são: nível (`T10`, opções de 0 a 6), duração (`AD10`, Imediata, Duradoura ou Sustentada), tipo de ação (`Z10`, Comum, Bônus ou Completo), modo de aplicação (`AG10`, Área ou Alvo) e alternativas binárias para controles complementares (`AP10` e `AS10`, Sim ou Não).

As fórmulas observadas usam essas seleções para calcular resultados como efeitos disponíveis, alcance/área, alvos, invocação e custo permanente. A continuação da análise deve extrair os títulos e as faixas de cada bloco antes de qualquer nova reformulação do construtor.

## Estrutura confirmada

O modelo da planilha é especificamente um **criador de Feitiços/Técnicas**. Sua primeira área concentra nome, nível e resultados-base calculados: gasto, ação, duração, alvo/área, alcance, área, resistência, FC, condição máxima, dano e dado. A segunda área permite escolher grupos de efeitos, incluindo RD, atributo, movimento, DDA, DAA, DF, ND, menos RD, menos perícia, VT e DPG.

Outros blocos permitem configurar CD, defesa, teste de resistência, perícia, acerto, alcance corpo a corpo, alcance à distância, crítico, transformação, criação de Shikigami e criação de itens. A planilha também tem regras explicativas para condição, sangramento, múltiplos efeitos, concentração e as trocas entre ação, alcance, área e dano.

Os cálculos observados dependem principalmente de **nível**, **ação**, **duração**, **modo Área/Alvo**, **resistência** e seletores de efeito. Eles incluem custo base por nível, teto de alcance/área, dano, categoria máxima de condição e efeitos disponíveis. Há avisos na própria planilha de que alguns cálculos são apenas apoio e que as regras do livro devem prevalecer quando houver conflito.

## Implicação para o produto

O editor de **Técnicas** precisa deixar de ser somente um CRUD de requisitos, custo, dano e alcance. Ele deve ser uma tela-calculadora em seções, inspirada diretamente nesta sequência: **Identidade → Base (nível, ação, duração) → Alvo/Área e resistência → Dano e alcance → Efeitos selecionáveis → Resultados calculados → Ajustes manuais e justificativa**. Os resultados calculados precisam ser persistidos separadamente dos valores de entrada e marcar qualquer sobrescrita como `isManual`.

## Referência de Shikigami — CópiadeCópia.pdf

O PDF define uma ficha-calculadora de Shikigami com duas áreas principais: **estado e atributos da invocação** e **opções estruturadas do controlador**. A ficha apresenta grau, custo, CD, classe de armadura, movimento, vida máxima/atual/perdida, nível, maestria, tipo de Shikigami, atributos, modificadores, perícias, ações, características, anotações e RD.

Os limites de atributo variam por grau: Quarto 16, Terceiro 20, Segundo 24, Primeiro 26 e Especial 30. O documento também calcula quantidade de perícias ainda não treinadas e pontos de atributo restantes para distribuir. Esses dois resultados devem ser derivados da distribuição persistida, não digitados pelo autor.

As opções de controlador são seletores de habilidades: Concentrar Poder, Fantoche Supremo, Invocações Móveis, Invocações Econômicas, Invocações Resistentes e melhorias de Controlador para Resistência, Mobilidade e Precisão/CD. O PDF contém progressões explícitas por nível para essas opções e marca certas automações como incompletas, como RD e teste de ataque; essas exceções devem permanecer editáveis e identificadas como manuais.

As características de Shikigami formam grupos selecionáveis: Movimento Alternativo com atributo escolhido, Defesa Alternativa com atributo escolhido, Bônus em Perícia, Tamanho, Defensor, Robustez, Móvel, Perito e campos adicionais de características e ações. A interface precisa organizar essas escolhas, mostrar seus efeitos calculados quando o PDF definir a fórmula e manter campos de anotação para os casos que o próprio PDF determina como manuais.

## Mapeamento persistente proposto para Shikigami

| Bloco do PDF | Dado persistente | Resultado derivado |
|---|---|---|
| Informações | Um registro de ficha por módulo: nome, tipo, grau, nível do controlador, maestria e modo manual. | Custo, teto de atributos, pontos distribuíveis, pontos restantes, perícias restantes, vida, CA, movimento e CD. |
| Atributos | Linhas por atributo: Força, Destreza, Constituição, Inteligência, Sabedoria e Carisma. | Modificador individual e total distribuído. |
| Perícias | Linhas por perícia, com atributo associado, treinada e bônus manual. | Total por perícia e quantidade de perícias faltantes. |
| Habilidades do controlador | Linhas por código de habilidade, com estado ativo e, quando necessário, alvo/atributo configurável. | Bônus e progressões disponíveis conforme nível e maestria. |
| Características do Shikigami | Linhas por código de característica, estado ativo e configuração opcional. | Efeitos de defesa, movimento, vida, perícia e atributos quando o PDF os define. |
| Ações e características livres | Elementos estruturados filhos da ficha. | Sem cálculo inventado; textos adicionais permanecem manualmente identificados. |

O modelo persiste entradas e escolhas separadamente de resultados desde a migration `0006_famous_khan`. A tabela `shikigamiSheets` armazena a ficha-base por Homebrew/módulo; atributos, perícias, opções e ações/características livres vivem respectivamente em `shikigamiAttributes`, `shikigamiSkills`, `shikigamiOptions` e `shikigamiAbilities`. Os resultados continuam derivados pelo motor compartilhado, sem serem duplicados no banco. Fórmulas só são implementadas quando explícitas nas referências; qualquer caso sem automação documentada é mantido como entrada manual identificada.

## Planilha Google de Shikigamis — referência prioritária

A planilha indicada pelo usuário está publicamente acessível e foi baixada para análise somente de leitura. Ela tem uma aba, **Shikigamis**, com 65 linhas e 26 colunas. Esta fonte substitui o PDF como referência de implementação quando ambos divergirem; o PDF será consultado apenas para explicações que não estiverem representadas na planilha.

### Mapeamento confirmado da planilha prioritária

| Área | Entradas | Cálculos identificados |
|---|---|---|
| Estado | Máximos, curados e perdidos. | Atuais = máximos − perdidos + curados; também é exibida uma barra percentual. |
| Informações | Grau, nível, maestria e tipo: Shikigami Comum, Shikigami de Técnica ou Manipulação de Maldições. | Tipo e grau alteram o orçamento de atributos, custo, vida, movimento e quantidade de perícias. |
| Atributos | Força, Destreza, Constituição, Inteligência, Sabedoria e Carisma. | Modificador = piso de `(atributo − 10) / 2`; o valor-base é 8 para Comum/Manipulação e 10 para Shikigami de Técnica. |
| Estatísticas | Constituição, atributo de defesa, grau, nível, maestria e escolhas. | Vida, custo, CD, CA e movimento usam fórmulas explícitas da planilha, incluindo as opções habilitadas. |
| Perícias | Bônus próprio, atributo, Treinada e Maestria. | Total = bônus próprio + metade do nível + modificador do atributo + bônus do tipo + opções de característica; as vagas restantes são calculadas. |
| Habilidades do controlador | Concentrar Poder, Fantoche Supremo, Invocações Móveis/Econômicas/Resistentes e melhorias de Resistência/Mobilidade/Precisão. | Cada opção aplica apenas os acréscimos previstos nas fórmulas da planilha. |
| Características | Movimento/Defesa alternativa, dois bônus em perícia, tamanho, Defensor, Robustez, Móvel e Perito. | Características alteram atributo-base de movimento/defesa, perícias, vida, CA e movimento; o tamanho aplica modificadores opostos a ataques e testes de resistência. |

As opções validadas na planilha incluem os cinco graus, os três tipos de Shikigami, os seis atributos, seis tamanhos e seleção de perícias para características. A implementação deve preservar essas listas fechadas e permitir sobrescrita manual apenas com marcação explícita.
