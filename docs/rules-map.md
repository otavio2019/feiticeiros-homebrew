# Mapa de Regras — Construtor Inicial

Este documento registra o recorte de regras confirmado nos materiais enviados e que orienta a primeira versão do construtor. O projeto não deve exibir como oficial nenhum valor ou limitação que não esteja modelado a partir desses materiais. Campos em modo manual são sempre marcados como personalizados.

| Domínio | Classificação | Estrutura confirmada | Automação inicial |
|---|---|---|---|
| Ficha-base | Oficial | Seis atributos: Força, Destreza, Constituição, Inteligência, Sabedoria e Presença. | Exibir modificador calculado e avisar valores fora do limite padrão de 20. |
| Distribuição | Oficial | Valores fixos, rolagem e compra por pontos. A compra usa base 10, 17 pontos e limite 15 por atributo. | Mostrar método, pontos consumidos e pendências de distribuição. |
| Origens | Oficial | Inato, Herdado, Derivado, Restringido, Feto Amaldiçoado Híbrido, Sem Técnica e Corpo Amaldiçoado Mutante. | Exigir uma origem quando o módulo estiver ativo; Herdado solicita clã; Restringido orienta sua especialização relacionada. |
| Especializações | Oficial | Lutador, Especialista em Combate, Especialista em Técnica, Controlador, Suporte e Restringido; possuem atributo-chave, progressão e habilidades. | Exigir especialização e nível quando este módulo estiver ativo; expor atributos-chave e pré-requisitos informados. |
| Armas e equipamentos | Oficial | Inventário usa espaços; armas trazem categoria, dano, crítico, propriedades, espaços, custo e grupo. | Somar espaços, calcular limite de carga a partir da Força e avisar sobre sobrecarga. |
| Técnicas | Oficial | Funcionamento Básico, atributo de técnica e Feitiços. Feitiços podem ser de nível 0, dano, auxiliar, curativo, especial ou passivo. | Calcular custo-padrão por nível, aviso de faixa de nível e CD de técnica quando dados suficientes existirem. |
| Feitiços | Oficial | Níveis 0 a 5, custo-padrão de 0/2/5/8/12/20 PE e requisitos com dificuldade. | Exigir nome, tipo e efeito; sinalizar custo divergente fora do modo manual. |
| Aptidões | Oficial | Categorias Aura, Controle e Leitura, Barreira, Domínio e Energia Reversa, em níveis de 0 a 5, com pré-requisitos específicos. | Exigir categoria e nível; marcar pré-requisitos ausentes quando eles forem registrados. |
| Votos | Oficial | Próprios temporários/permanentes, emergenciais, contratuais e restrição congênita. Pesos leve, médio, pesado e extremo. | Exigir contrapartida e benefício; sinalizar combinações incompatíveis de duração e peso. |
| Invocações | Oficial | Corpos Amaldiçoados, Maldições Domadas e Shikigamis; fichas com grau, atributos, vida, defesa, deslocamento, ações e características. | Calcular custo de invocação, pontos de atributo, vida e defesa conforme o grau e dados do usuário. |
| Regras opcionais | Opcional | Nível 0, Origem Civil, Não-Feiticeiro, Origem Não-Feiticeiro e Artimanhas. | Disponibilizar como módulos opcionais, sem misturá-los silenciosamente à criação padrão. |
| Modo manual avançado | Personalizado | Texto, efeitos, limites, custos e requisitos livres que não têm validação oficial registrada. | Manter o conteúdo, mas identificá-lo visualmente como personalizado e evitar afirmá-lo como regra oficial. |

## Referências de modelagem

| Assunto | Fonte fornecida |
|---|---|
| Aspectos pessoais, atributos e métodos de distribuição | *Feiticeiros & Maldições — Livro de Regras v2.5.2*, p. 15–26. |
| Origens, clãs e relações de especialização | *Feiticeiros & Maldições — Livro de Regras v2.5.2*, p. 27–48 e p. 49–128. |
| Inventário, equipamentos e armas | *Feiticeiros & Maldições — Livro de Regras v2.5.2*, p. 129–152. |
| Aptidões amaldiçoadas | *Feiticeiros & Maldições — Livro de Regras v2.5.2*, p. 173–195. |
| Técnicas, Feitiços, requisitos e cálculo de CD | *Feiticeiros & Maldições — Livro de Regras v2.5.2*, p. 196–204. |
| Invocações, graus e ficha de invocação | *Feiticeiros & Maldições — Livro de Regras v2.5.2*, p. 256–275. |
| Votos próprios, contratuais e restrições congênitas | *Feiticeiros & Maldições — Livro de Regras v2.5.2*, p. 351–364. |
| Nível 0 e Não-Feiticeiros | *Regras Opcionais*, p. 1–4. |

## Limite da primeira versão

O construtor inicial oferece estrutura e validação contextual para os módulos planejados. Regras avançadas ou exceções que dependam de análise narrativa do Narrador permanecem assistidas, e não são tratadas como validações automáticas definitivas.
