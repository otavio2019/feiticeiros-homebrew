# Divergências do Modelo Estruturado

## Referência analisada

Este documento compara o construtor atual com o modelo enviado em `pasted_content_6.txt`. A referência exige editores próprios e dados normalizados para Origem, Mecânica, Votos, Técnicas e Armas; campos de texto servem somente para descrição, nunca como substituto de uma relação, cálculo ou requisito estruturado.

| Bloco do modelo | Estado atual | Divergência que precisa ser corrigida |
|---|---|---|
| Origem | Há um painel de campos específicos e um painel genérico de elementos. | `originBenefit` e `originRestriction` ainda são textos; a tela não apresenta, na própria Origem, listas dedicadas de bônus, características, talentos, penalidades, requisitos e evoluções. |
| Mecânica | Nome/descrição vêm do elemento e o painel específico contém categoria, gatilho, recurso e fórmula. | O modelo pede nome, descrição e bônus estruturado; o editor não mostra esses três campos como um bloco de Mecânica próprio nem vincula o bônus de modo evidente. |
| Voto | Há `vowTrade` narrativo e uma coleção estruturada de `vowExchanges`. | O campo legado mistura ganho e perda e a nova coleção foi adicionada dentro de um painel secundário, em vez de substituir o campo misto como estrutura central do Voto. |
| Técnica | O painel base oferece coleções de requisitos, efeitos, custos, dano, alcance e condições. | Os tipos de dano continuam texto livre e as coleções aparecem para todos os módulos, não organizadas em etapas próprias da Técnica. |
| Arma | Há campos de categoria/dano/alcance e relação Arma–Técnica persistida. | `weaponProperty` e `weaponRequirement` ainda são textos. Características e Propriedades não aparecem como grupos próprios da Arma. |
| Evolução de Origem | A relação pai-filho já foi adicionada no banco. | O modelo precisa que uma evolução apresente requisitos, bônus, penalidades, características e talentos adicionados; o editor atual ainda não monta esse bloco próprio. |
| Modo manual e fonte | `isManual` e `ruleSource` estão no schema. | A classificação começou a ser exposta no formulário, mas o fluxo precisa estar integrado dentro de cada bloco específico, e não apenas ao redor de um elemento genérico. |

## Direção de correção

O próximo editor deve abandonar a composição `SpecificModuleConfiguration` mais `StructuredElementsPanel` como experiência principal para esses módulos. Cada módulo deve renderizar um formulário próprio, com subseções correspondentes ao modelo: por exemplo, **Origem → Bônus, Características, Talentos, Penalidades, Requisitos, Evoluções**; **Voto → Ganhos, Perdas**; e **Arma → Características, Propriedades, Dano, Requisitos, Técnicas relacionadas**.

As tabelas normalizadas existentes serão reutilizadas para bônus, requisitos, efeitos, custos, dano, alcance, condições, trocas de voto, evoluções e vínculo Arma–Técnica. Se uma relação adicional for necessária para registrar itens que uma evolução adiciona, ela será modelada em tabela própria com migration Drizzle, em vez de texto ou JSON.

## Modelo-alvo de persistência

| Necessidade do modelo | Persistência normalizada | Regra de interface |
|---|---|---|
| Bônus de Origem, Talento, Mecânica e Evolução | `structuredAttributeBonuses` por `elementId` | O usuário seleciona o atributo e informa um inteiro; o resultado nunca é salvo dentro da descrição. |
| Características, Talentos, Penalidades e Propriedades | `homebrewStructuredElements` filhos, identificados por tipo e `parentElementId` | Cada grupo tem uma lista própria no editor do seu pai, com criar, editar, remover e reordenar. |
| Evolução de Origem | Elemento filho de tipo `evolucao` | A evolução ganha seus próprios requisitos, bônus e penalidades. Uma tabela de relações registra quais características e talentos existentes ela libera. |
| Ganhos e Perdas de Voto | `structuredVowExchanges`, separados por `kind = gain | loss` | O formulário de Voto substitui o campo narrativo misto por duas listas visíveis e independentes. |
| Técnica e Arma | Requisitos, efeitos, custos, dano, alcance e condições nas tabelas já existentes | Cada conjunto fica na subseção correspondente do editor do módulo, não como uma caixa genérica reutilizada. |
| Tipos de dano | Valor canônico selecionável em `structuredDamageProfiles.damageType`; valor manual somente com marcação manual | O seletor oficial exibirá os 15 tipos do livro: Cortante, Perfurante, Impacto, Ácido, Congelante, Chocante, Queimante, Sônico, na Alma, Energia Reversa, Energético, Psíquico, Radiante, Necrótico e Venenoso. |
| Técnicas liberadas por Arma | `structuredWeaponTechniqueLinks` | O seletor lista somente elementos de tipo Arma e Técnica pertencentes à mesma Homebrew. |

## Fluxo de edição que será implementado

O editor continuará por etapas e módulos. Ao abrir um elemento de **Origem**, a tela terá as subseções **Informações**, **Bônus de atributos**, **Características**, **Talentos**, **Penalidades**, **Requisitos** e **Evoluções**. Ao abrir uma evolução, serão mostradas as subseções **Requisitos**, **Bônus**, **Penalidades**, **Características adicionadas** e **Talentos adicionados**.

Os módulos de **Mecânica**, **Voto**, **Técnica** e **Arma** receberão editores próprios com apenas os grupos previstos para cada um. A camada genérica continuará somente para `Outros` e para compatibilidade dos elementos já criados, e não será mais a experiência principal desses módulos.
