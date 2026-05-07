# Lab 9 — Rascunho de alinhamento

## Decisões alinhadas

1. O domínio considerado é o **Finta inteiro**, mas com a ressalva de que o Finta **não** é um sistema de gestão financeira completo. Ele é um sistema para consultar cotações e criar uma biblioteca de favoritos com ativos, como ações e criptomoedas.
2. O **Core Domain** será **Consulta de Cotação de Ativos**.
3. **Cache de Cotações** será tratado como detalhe de infraestrutura, não como Bounded Context próprio.
4. A proposta manterá **orquestração síncrona** no fluxo principal, por meio de um API Orchestrator/Gateway.
5. O termo escolhido para a seção de Linguagem Ubíqua será **Ticker**.
6. O context map será gerado em **PlantUML**.
7. A entrega pode propor uma evolução conceitual idealizada, sem ficar restrita ao estado atual da implementação.
8. O serviço SOA escolhido para evolução será o **Serviço de Consulta de Cotação**.
9. A entrega final será consolidada em `entrega.md`.

## Artefatos produzidos

- [`enunciado.md`](./enunciado.md): transcrição do enunciado da imagem.
- [`entrega.md`](./entrega.md): resposta consolidada do Lab 9.
- [`diagramas/context-map.puml`](./diagramas/context-map.puml): Context Map em PlantUML.

## Estrutura final proposta

### Subdomínios

| Subdomínio | Classificação |
|---|---|
| Consulta de cotação de ativos | Core |
| Biblioteca de favoritos | Suporte |
| Identidade e acesso | Genérico |
| Integração com provedores de mercado | Suporte |
| Cache de cotações | Infraestrutura |
| Observabilidade/padronização de erros | Genérico/Infraestrutura |

### Bounded Contexts

1. Consulta de Cotação de Ativos.
2. Biblioteca de Favoritos.
3. Identidade e Acesso.
4. Integração com Provedores de Mercado.
5. Experiência de Consulta/API Orchestrator.

### Microserviços candidatos

| Microserviço | Contexto |
|---|---|
| `query-api-orchestrator` | Experiência de Consulta/API Orchestrator |
| `asset-quote-service` | Consulta de Cotação de Ativos |
| `favorite-library-service` | Biblioteca de Favoritos |
| `identity-access-service` | Identidade e Acesso |
| `market-provider-integration-service` | Integração com Provedores de Mercado |

## Observação

O arquivo `entrega.md` já incorpora essas decisões. Se necessário, ainda podemos ajustar nomes dos serviços/contextos para ficarem mais próximos do vocabulário usado em sala ou nos laboratórios anteriores.
