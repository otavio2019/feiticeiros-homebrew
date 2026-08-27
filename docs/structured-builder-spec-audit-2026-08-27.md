# Auditoria da especificação estruturada do construtor

## Escopo verificado

Esta auditoria compara a especificação fornecida em `pasted_content_6.txt` com o schema Drizzle, os procedimentos tRPC, a camada transacional do banco e o editor atual. A infraestrutura externa existente — Vercel, TiDB, autenticação local, sessão HTTPS, Cloudinary e SMTP — ficou fora do escopo de alteração.

| Área solicitada | Estado atual | Evidência | Lacuna confirmada |
|---|---|---|---|
| Origem: bônus, requisitos e evoluções | Estruturado | `structuredAttributeBonuses`, `structuredRequirements` e `structuredEvolutions` | Características, talentos, penalidades e relações de evolução ainda não têm vínculo pai-filho utilizável pelo editor. |
| Mecânicas: nome, descrição e bônus | Estruturado | Elementos `mecanica`, bônus e efeitos normalizados | Nenhuma lacuna de persistência básica. |
| Votos: ganhos e perdas separados | Parcial | `structuredVowExchanges` já existe no schema | A coleção não é carregada nem salva pelos endpoints do editor e não aparece na ficha pública. |
| Técnicas: requisitos, custos, efeitos, dano, alcance e condições | Estruturado | Sete coleções normalizadas e formulários de manutenção | Tipos de dano ainda são texto validado, não catálogo fechado, pois o livro não foi usado para afirmar uma lista oficial fechada. |
| Armas: dano, requisitos e técnicas relacionadas | Estruturado | Perfil de dano, requisitos e `structuredWeaponTechniqueLinks` | Características e propriedades ainda ficam em campos planos do módulo, sem itens relacionáveis. |
| Automação e modo manual | Estruturado | Valores numéricos, validações conservadoras, `isManual` e `ruleSource` | Regras não especificadas pelo livro permanecem configuráveis em vez de receber fórmulas inventadas. |
| Imagens opcionais | Estruturado | `homebrewImages` com `moduleId` e `elementId`; URL e upload | Nenhuma lacuna confirmada. |
| Compartilhamento | Parcial | A consulta pública agrega os dados mecânicos | Ganhos/perdas de votos ainda não são exibidos por falta de persistência editor-facing. |

## Decisão de implementação

As extensões necessárias serão feitas sem usar blobs JSON para dados mecânicos pesquisáveis. O modelo existente de `homebrewStructuredElements` será aproveitado para itens filhos normalizados e ordenáveis. Cada característica, talento, evolução ou propriedade será um elemento com pai explícito, mantendo seus próprios requisitos, bônus, efeitos e marcação manual. A coleção já existente de ganhos/perdas de voto será conectada ao contrato tRPC, à interface e à leitura pública.

Não serão inventadas fórmulas, catálogos de dano ou limitações que o livro não determine. Campos cujo significado não esteja especificado continuarão disponíveis somente como configuração Homebrew/Manual, claramente identificada.
