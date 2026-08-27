# Auditoria do construtor estruturado

## Situação encontrada

A aplicação já possui nove módulos funcionais, modo manual, validações específicas de Técnica, Voto e Shikigami, imagens opcionais e leitura compartilhável. O backend, porém, ainda persiste a maior parte das regras em colunas JSON (`homebrews.data`, `homebrewModules.data` e `homebrewElements.data`). A tabela `homebrewElements` já oferece uma base relacional com `moduleId`, `parentElementId`, `type`, `position` e `isManual`, mas ainda não possui CRUD próprio nem relações entre tipos.

| Área | Estado atual | Lacuna para a nova especificação |
|---|---|---|
| Homebrew e módulos | Estrutura relacional de Homebrew e módulos, dados auxiliares em JSON | Falta persistir entidades mecânicas pesquisáveis |
| Origem | Editor genérico/narrativo | Bônus, características, talentos, requisitos e evoluções estruturados |
| Mecânicas | Editor genérico/narrativo | Bônus tipado e efeitos configuráveis |
| Votos | Duração, peso e contrapartida em chaves planas | Ganhos e perdas como coleções separadas |
| Técnicas | Tipo, nível e custo em chaves planas | Requisitos, custos, dano, alcance, efeitos e condições como coleções |
| Armas | Editor genérico/narrativo | Dano, tipo, propriedades, requisitos e técnicas relacionadas |
| Shikigami | Objeto JSON tipado no frontend | Entidades pesquisáveis para atributos e habilidades; manter cálculo existente |
| Aptidões, especializações e outros | Editor genérico | Estrutura extensível sem inventar regras ausentes |
| Imagens | Relação opcional com Homebrew, módulo e elemento | Reaproveitar a tabela atual, adicionando associações aos novos elementos |
| Modo manual | `isManual`, `manualMode`, `customFields` e `manualNotes` | Preservar override e indicar a origem oficial/manual por campo |

## Decisão arquitetural

A evolução será incremental. Os campos narrativos e o JSON legado serão preservados para compatibilidade com Homebrews existentes, enquanto novas entidades mecânicas serão armazenadas em tabelas normalizadas. Cada entidade terá `homebrewId`, `moduleId`, nome, posição, `isManual`, `ruleSource` (`official`, `homebrew` ou `manual`) e descrição quando aplicável. A informação mecânica será separada em tabelas próprias quando houver necessidade de pesquisa, validação ou relacionamento.

As listas de requisitos, efeitos, ganhos, perdas, propriedades e condições terão posições explícitas para permitir reordenação. Bônus de atributo, custos, dano e alcance usarão colunas numéricas/enums, com um campo de detalhes opcional apenas para informações que o livro não define de forma padronizada. Relações entre Armas e Técnicas serão persistidas em tabela de junção com chave única composta.

O JSON atual continuará sendo lido como fallback. Novos editores escreverão nas entidades estruturadas e poderão gerar uma projeção compatível no `data` legado durante a transição. A ficha compartilhável priorizará entidades estruturadas e manterá a renderização dos dados legados.

## Modelo inicial recomendado

| Entidade | Dados principais | Relações |
|---|---|---|
| `structuredElements` | tipo, nome, descrição, posição, origem da regra, manual | Homebrew, módulo, elemento pai |
| `attributeBonuses` | atributo, valor, posição | elemento estruturado |
| `requirements` | tipo, operador, valor numérico/textual, posição | elemento estruturado |
| `effects` | tipo, descrição, valor, posição | elemento estruturado |
| `costs` | recurso, quantidade, detalhes | elemento estruturado |
| `damageProfiles` | dados, modificador, escalonamento, tipo de dano | técnica ou arma |
| `ranges` | alcance, unidade, área, alvo | técnica |
| `conditions` | nome, efeito, duração, posição | técnica |
| `vowExchanges` | natureza ganho/perda, descrição, valor, posição | voto |
| `weaponTechniqueLinks` | arma, técnica | relação N:N |
| `evolutions` | nome, descrição, posição, origem da regra | origem ou talento |

A tabela `structuredElements` pode ser introduzida ao lado de `homebrewElements`, ou a tabela existente pode ser estendida, desde que a migration preserve os registros atuais. A escolha final deve considerar o custo de migrar os dados legados e a duplicação já existente. A recomendação é estender `homebrewElements` apenas com metadados comuns e criar tabelas filhas para propriedades mecânicas; isso reaproveita duplicação, exclusão e compartilhamento atuais.

## Regras de segurança funcional

Nenhuma fórmula ou enumeração será inventada para preencher lacunas do livro. Quando uma regra não estiver mapeada, o editor oferecerá configuração manual e marcará `ruleSource = manual` e `isManual = true`. Requisitos e efeitos não conhecidos serão aceitos como configuração descritiva estruturada, sem serem tratados como regra oficial. Toda alteração manual deverá permanecer visível na pré-visualização e na ficha compartilhável.

## Ordem de implementação

A próxima etapa deve começar pelo schema comum, requisitos, bônus, efeitos e relações de arma/técnica. Depois serão adicionados CRUDs protegidos e validações no backend. Em seguida, cada módulo receberá um editor próprio em componentes menores, começando por Origem, Votos, Técnicas e Armas. Shikigami será migrado gradualmente do JSON tipado para as entidades sem remover o editor já funcional. Por fim, a ficha compartilhável e o fluxo de duplicação receberão suporte para o novo modelo.
