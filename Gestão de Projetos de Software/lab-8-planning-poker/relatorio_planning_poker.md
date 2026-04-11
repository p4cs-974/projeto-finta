# Relatório de Planning Poker

## 1. Lista de histórias de usuário com estimativas

| Ticket | História de usuário | Estimativa |
| --- | --- | ---: |
| ROBERTO-43 | Visualizar dashboard financeiro através da CLI | 5 |
| ROBERTO-44 | Visualizar detalhes de indicadores de ativos através da CLI | 5 |
| ROBERTO-49 | Realização do cadastro do usuário através da CLI | 5 |
| ROBERTO-50 | Correção editar/adicionar favoritos através da CLI | 5 |
| ROBERTO-51 | Autenticar CLI com login existente | 1 |

## 2. Evidências das estimativas

### Evidência 1: ROBERTO-43

Estimativa: **5 pontos**.

Observação: houve divergência entre os votos, com registros em **3, 5 e 8**, mas a discussão convergiu para uma complexidade média, consolidada em **5 pontos** no ticket.

![Planning poker ROBERTO-43](/Users/pedro/agent-sandbox/jira_evidencias/roberto43_modal.png)

### Evidência 2: ROBERTO-49

Estimativa: **5 pontos**.

Observação: este foi um caso claro de divergência e discussão. Na primeira rodada, os votos ficaram divididos entre **2** e **8**, com média **5**. Após alinhamento do entendimento da história, houve uma segunda rodada, que concentrou os votos em **5**, embora ainda tenha restado um voto em **8**. O valor final estipulado foi **5 pontos**.

**Round 1**

![Planning poker ROBERTO-49 round 1](/Users/pedro/agent-sandbox/jira_evidencias/roberto-49_1.png)

**Round 2**

![Planning poker ROBERTO-49 round 2](/Users/pedro/agent-sandbox/jira_evidencias/roberto-49_2.png)

### Evidência 3: ROBERTO-51

Estimativa registrada no ticket: **1 ponto**.

Observação: houve consenso total do grupo, com todos os participantes votando **1**, o que indica entendimento comum de que se tratava de uma história simples e de baixa complexidade.

![Planning poker ROBERTO-51](/Users/pedro/agent-sandbox/jira_evidencias/roberto-51_1.png)

## 3. Total de pontos da sprint e justificativa

**Total estimado: 21 pontos**

Cálculo:

- ROBERTO-43: 5
- ROBERTO-44: 5
- ROBERTO-49: 5
- ROBERTO-50: 5
- ROBERTO-51: 1

Justificativa:

- Quatro histórias foram classificadas com **5 pontos** por envolverem fluxos de CLI com mais de um passo, validações e necessidade de maior cuidado com comportamento e experiência do usuário.
- A história **ROBERTO-51** recebeu **1 ponto** por representar um fluxo mais simples e direto, com escopo menor e menor risco técnico.
- O conjunto da sprint ficou, portanto, concentrado em histórias de complexidade média, com apenas uma entrega claramente pequena.

## 4. Breve reflexão do time

### Dificuldades encontradas

- Em algumas histórias, o escopo inicial gerou interpretações diferentes entre os participantes.
- Os principais pontos de dúvida apareceram em histórias com mais passos de interação ou com impacto em diferentes partes da CLI.

### Como o grupo chegou ao consenso

- O time comparou os votos quando houve divergência e discutiu os motivos por trás de estimativas mais baixas e mais altas.
- Nos casos mais incertos, como o **ROBERTO-49**, foi necessária uma nova rodada após o alinhamento do entendimento da história.
- O consenso final foi construído com base no entendimento compartilhado do esforço, da complexidade e do risco.

### Principais aprendizados

- Histórias com descrição mais clara tendem a gerar consenso mais rápido.
- A discussão entre votos extremos ajudou o grupo a calibrar melhor as estimativas e reduzir ruídos sobre escopo.
