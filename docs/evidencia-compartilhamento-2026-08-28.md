# Evidência de validação do compartilhamento — 28 de agosto de 2026

## Cenário

A validação foi executada no deploy público da Vercel após a publicação do commit `9f426b9`. Foi usada exclusivamente a Homebrew de teste reversível **Validação temporária — Shikigami planilha**, sem alterar o conteúdo das demais fichas.

## Resultado observado

| Verificação | Resultado |
| --- | --- |
| Alterar visibilidade no editor | O seletor **Visibilidade e compartilhamento** aceitou o modo **Não listada — com link** e o salvamento exibiu confirmação. |
| Persistência de visibilidade | Ao retornar à biblioteca, a ficha apareceu identificada como **Não listada**. |
| Leitura por link | O botão **Abrir modo leitura** navegou para `/s/q3CqKSMjxnK` e carregou a ficha de leitura com título, resumo, módulo e dados calculados do Shikigami. |
| Proteção de ficha privada | Em uma ficha privada, o mesmo botão permaneceu no editor e mostrou a orientação para selecionar **Não listada** ou **Pública** e salvar antes de compartilhar. |

## Conclusão

O compartilhamento agora respeita a visibilidade persistida. Fichas privadas não expõem uma rota de leitura pelo controle do editor; fichas não listadas e públicas usam o `shareId` ativo e podem ser abertas na rota pública.
