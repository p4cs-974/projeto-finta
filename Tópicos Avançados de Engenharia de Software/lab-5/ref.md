# Laboratório 5 - Modelagem de Processo de Negócio TO-BE

**Projeto:** FINTA (FINancial Tracking & Analysis)  
**Disciplina:** Tópicos Avançados de Engenharia de Software  
**Data:** 18 de Março de 2026  
**Processo Modelado:** Consulta de Cotação de Ativos (Ações e Criptomoedas)

---

## 1. Diagrama BPMN - Processo TO-BE

### 1.1. Visão Geral do Processo

O processo de **Consulta de Cotação de Ativos** permite que usuários autenticados busquem cotações atualizadas de ações (B3) e criptomoedas através de provedores externos, com suporte a cache interno para otimização de performance.

### 1.2. Descrição Detalhada das Atividades

#### A1. Selecionar Tipo do Ativo

Usuário escolhe entre consultar ações (negociadas na B3) ou criptomoedas através de opções na interface do sistema.

#### A2. Informar Ticker

Usuário digita o código/símbolo do ativo desejado (exemplos: PETR4 para ações da Petrobras, BTC para Bitcoin, ETH para Ethereum).

#### A3. Receber Solicitação

Sistema FINTA recebe a requisição do usuário contendo o tipo de ativo e o ticker a ser consultado.

#### A4. Validar Autenticação

Sistema verifica se o usuário está autenticado validando o token de acesso. Se autenticação falhar, retorna erro ao usuário.

#### A5. Validar Ticker

Sistema valida se o ticker informado está no formato correto e se corresponde a um ativo válido conforme regras de negócio (RN02, RN03). Se inválido, retorna erro ao usuário.

#### A6. Consultar Cache Interno

Sistema busca a cotação no cache interno para verificar se já possui informação recente do ativo, evitando consultas desnecessárias aos provedores externos.

#### A7. Retornar Cotação ao Usuário (do Cache)

Quando a cotação está disponível no cache e ainda é válida, sistema retorna imediatamente ao usuário sem precisar consultar provedores externos.

#### A8. Decisão: Tipo do Ativo

Sistema identifica qual tipo de provedor externo deve consultar baseado no tipo de ativo selecionado (ações ou criptomoedas).

#### A9. Solicitar Cotação de Ações

Sistema envia requisição ao provedor externo especializado em cotações de ações da bolsa brasileira (B3).

#### A10. Solicitar Cotação de Cripto

Sistema envia requisição ao provedor externo especializado em cotações de criptomoedas.

#### A11. Buscar Cotação na B3

Provedor externo busca a cotação atualizada do ativo na Bolsa de Valores Brasileira (B3) e retorna os dados.

#### A12. Retornar Cotação (Provedor Ações)

Provedor externo retorna os dados da cotação da ação ao sistema FINTA.

#### A13. Buscar Cotação do Criptoativo

Provedor externo busca a cotação atualizada da criptomoeda em exchanges e retorna os dados.

#### A14. Retornar Cotação (Provedor Cripto)

Provedor externo retorna os dados da cotação da criptomoeda ao sistema FINTA.

#### A15. Provider Respondeu com Sucesso?

Sistema verifica se o provedor externo retornou os dados com sucesso ou se houve falha na comunicação. Em caso de falha, retorna erro ao usuário.

#### A16. Atualizar Cache

Sistema armazena a cotação recebida do provedor externo no cache interno para futuras consultas, com tempo de validade apropriado conforme o tipo de ativo (RN04).

#### A17. Montar Resposta

Sistema formata os dados recebidos do provedor externo em um formato padronizado para apresentação ao usuário.

#### A18. Retornar Cotação ao Usuário

Sistema envia a cotação formatada ao usuário para visualização.

#### A19. Retornar Erro ao Usuário

Sistema informa ao usuário quando ocorre algum erro no processo (autenticação falhou, ticker inválido, ou provedores indisponíveis).

#### A20. Aguardar Resultado

Usuário aguarda enquanto o sistema processa a solicitação e retorna a cotação ou mensagem de erro.

---

#### A2. Informar Ticker

**Pool/Lane:** Usuário  
**Tipo:** Tarefa Manual (User Task)  
**Descrição:** Usuário digita o ticker/símbolo do ativo desejado (ex: PETR4, VALE3, BTC, ETH).  
**Entrada:** Campo de texto para ticker  
**Saída:** String com o ticker informado  
**Regras:** Nenhuma (validação ocorre na próxima etapa)

---

#### A3. Receber Solicitação

**Pool/Lane:** Sistema FINTA  
**Tipo:** Tarefa de Serviço (Service Task)  
**Descrição:** Backend recebe a requisição HTTP com tipo de ativo e ticker informados pelo usuário.  
**Entrada:** Request HTTP (POST /api/quotes) com JSON: `{ "type": "acao", "ticker": "PETR4" }`  
**Saída:** Dados da requisição parseados  
**Regras:** Nenhuma

---

#### A4. Validar Autenticação

**Pool/Lane:** Sistema FINTA  
**Tipo:** Tarefa de Serviço (Service Task)  
**Descrição:** Sistema verifica se a requisição contém token JWT válido no header Authorization.  
**Entrada:** Token JWT do header  
**Saída:** Usuário autenticado (válido/inválido)  
**Regras:** **RN01** - Token JWT deve estar presente e válido  
**Fluxo Alternativo:** Se inválido, retorna erro 401 (Não Autorizado)

---

#### A5. Validar Ticker

**Pool/Lane:** Sistema FINTA  
**Tipo:** Tarefa de Negócio (Business Rule Task)  
**Descrição:** Sistema valida o formato e conteúdo do ticker informado.  
**Entrada:** String do ticker  
**Saída:** Ticker válido (sim/não)  
**Regras:** **RN02** (formato alfanumérico, 3-10 caracteres) e **RN03** (ticker existe no catálogo)  
**Fluxo Alternativo:** Se inválido, retorna erro 400 (Bad Request) com mensagem descritiva

---

#### A6. Consultar Cache Interno

**Pool/Lane:** Sistema FINTA  
**Tipo:** Tarefa de Serviço (Service Task)  
**Descrição:** Sistema busca a cotação no cache interno (Redis ou banco de dados) para evitar chamadas desnecessárias às APIs externas.  
**Entrada:** Ticker validado  
**Saída:** Cotação em cache (se existir e estiver válida) ou null  
**Regras:** **RN04** - Cache de ações tem validade de 5 minutos; cache de cripto tem validade de 1 minuto  
**Tecnologia:** Redis com TTL configurado

---

#### A7. Retornar Cotação ao Usuário (do Cache)

**Pool/Lane:** Sistema FINTA  
**Tipo:** Tarefa de Serviço (Service Task)  
**Descrição:** Quando cotação válida existe no cache, sistema retorna imediatamente ao usuário sem consultar provedores externos.  
**Entrada:** Cotação do cache  
**Saída:** Response HTTP 200 com JSON da cotação  
**Regras:** **RN08** (formato de resposta padronizado)

---

#### A8. Decisão: Tipo do Ativo

**Pool/Lane:** Sistema FINTA  
**Tipo:** Gateway Exclusivo (XOR)  
**Descrição:** Sistema decide qual provedor externo consultar baseado no tipo de ativo selecionado.  
**Entrada:** Tipo de ativo (Ações ou Cripto)  
**Saída:** Rota para o provedor apropriado  
**Regras:** Nenhuma

---

#### A9. Solicitar Cotação de Ações

**Pool/Lane:** Sistema FINTA  
**Tipo:** Tarefa de Serviço (Service Task)  
**Descrição:** Sistema envia requisição HTTP para provedor externo de cotações de ações (ex: Yahoo Finance, Alpha Vantage, Brapi).  
**Entrada:** Ticker da ação  
**Saída:** Requisição HTTP para API externa  
**Regras:** **RN05** - Timeout de 10 segundos, retry automático (3 tentativas com backoff exponencial)  
**Integrações:** Yahoo Finance API, Brapi API

---

#### A10. Solicitar Cotação de Cripto

**Pool/Lane:** Sistema FINTA  
**Tipo:** Tarefa de Serviço (Service Task)  
**Descrição:** Sistema envia requisição HTTP para provedor externo de cotações de criptomoedas (ex: CoinGecko, Binance API, CoinMarketCap).  
**Entrada:** Ticker da criptomoeda  
**Saída:** Requisição HTTP para API externa  
**Regras:** **RN06** - Timeout de 10 segundos, retry automático (3 tentativas)  
**Integrações:** CoinGecko API, Binance API

---

#### A11. Buscar Cotação na B3

**Pool/Lane:** Provedor de Ações (Sistema Externo)  
**Tipo:** Tarefa de Serviço (Service Task)  
**Descrição:** API externa busca cotação atualizada do ativo na B3 (Bolsa de Valores Brasileira).  
**Entrada:** Ticker da ação  
**Saída:** Dados da cotação (preço, variação, volume)  
**Regras:** Nenhuma (responsabilidade do provedor)

---

#### A12. Retornar Cotação (Provedor Ações)

**Pool/Lane:** Provedor de Ações (Sistema Externo)  
**Tipo:** Tarefa de Serviço (Service Task)  
**Descrição:** Provedor externo retorna JSON com dados da cotação para o sistema FINTA.  
**Entrada:** Dados da cotação  
**Saída:** Response HTTP com JSON  
**Regras:** Nenhuma (responsabilidade do provedor)

---

#### A13. Buscar Cotação do Criptoativo

**Pool/Lane:** Provedor de Cripto (Sistema Externo)  
**Tipo:** Tarefa de Serviço (Service Task)  
**Descrição:** API externa busca cotação atualizada da criptomoeda em exchanges.  
**Entrada:** Ticker da criptomoeda  
**Saída:** Dados da cotação (preço em USD/BRL, variação 24h, market cap)  
**Regras:** Nenhuma (responsabilidade do provedor)

---

#### A14. Retornar Cotação (Provedor Cripto)

**Pool/Lane:** Provedor de Cripto (Sistema Externo)  
**Tipo:** Tarefa de Serviço (Service Task)  
**Descrição:** Provedor externo retorna JSON com dados da cotação para o sistema FINTA.  
**Entrada:** Dados da cotação  
**Saída:** Response HTTP com JSON  
**Regras:** Nenhuma (responsabilidade do provedor)

---

#### A15. Provider Respondeu com Sucesso?

**Pool/Lane:** Sistema FINTA  
**Tipo:** Gateway Exclusivo (XOR)  
**Descrição:** Sistema verifica se o provedor externo respondeu com sucesso (HTTP 200) ou com erro (timeout, 500, 404, etc).  
**Entrada:** Status da resposta HTTP  
**Saída:** Sucesso (Sim) ou Falha (Não)  
**Regras:** Nenhuma

---

#### A16. Atualizar Cache

**Pool/Lane:** Sistema FINTA  
**Tipo:** Tarefa de Serviço (Service Task)  
**Descrição:** Sistema armazena a cotação recebida no cache (Redis) com TTL apropriado para futuras consultas.  
**Entrada:** JSON da cotação recebida  
**Saída:** Cotação armazenada no cache  
**Regras:** **RN07** - TTL de 5 minutos para ações, 1 minuto para cripto  
**Tecnologia:** Redis SET com EXPIRE

---

#### A17. Montar Resposta

**Pool/Lane:** Sistema FINTA  
**Tipo:** Tarefa de Serviço (Service Task)  
**Descrição:** Sistema formata os dados recebidos do provedor externo no padrão de resposta da API FINTA.  
**Entrada:** JSON bruto do provedor  
**Saída:** JSON formatado no padrão FINTA  
**Regras:** **RN08** - Resposta deve conter: ticker, nome, preço, variação, timestamp  
**Formato de Saída:**

```json
{
  "ticker": "PETR4",
  "name": "Petrobras PN",
  "price": 38.45,
  "change": 1.23,
  "changePercent": 3.30,
  "currency": "BRL",
  "timestamp": "2026-03-18T14:35:00Z",
  "source": "cache" | "provider"
}
```

---

#### A18. Retornar Cotação ao Usuário

**Pool/Lane:** Sistema FINTA  
**Tipo:** Tarefa de Serviço (Service Task)  
**Descrição:** Sistema envia resposta HTTP 200 com JSON da cotação para o cliente.  
**Entrada:** JSON formatado  
**Saída:** Response HTTP  
**Regras:** Nenhuma

---

#### A19. Retornar Erro ao Usuário

**Pool/Lane:** Sistema FINTA  
**Tipo:** Tarefa de Serviço (Service Task)  
**Descrição:** Sistema envia resposta HTTP com código de erro apropriado e mensagem descritiva quando falhas ocorrem.  
**Entrada:** Tipo de erro (autenticação, validação, provedor indisponível)  
**Saída:** Response HTTP com erro (401, 400, 503)  
**Regras:** Nenhuma  
**Códigos de Erro:**

- 401: Token inválido ou ausente
- 400: Ticker inválido
- 503: Provedores externos indisponíveis e cache vazio

---

#### A20. Aguardar Resultado

**Pool/Lane:** Usuário  
**Tipo:** Tarefa Manual (User Task)  
**Descrição:** Usuário aguarda resposta do sistema exibindo loading na interface.  
**Entrada:** Requisição enviada  
**Saída:** Cotação exibida ou mensagem de erro  
**Regras:** Nenhuma

---

## 2. Regras de Negócio

### RN01 - Acesso Apenas para Usuários Autenticados

Apenas usuários autenticados no sistema podem consultar cotações de ativos. Usuários não autenticados devem realizar login antes de acessar a funcionalidade.

### RN02 - Formato Válido do Ticker

O código do ativo (ticker) deve seguir padrões do mercado financeiro: conter apenas letras e números, com tamanho entre 3 e 10 caracteres. Exemplos válidos: PETR4, VALE3, BTC, ETH.

### RN03 - Ativos Negociáveis

Apenas ativos que são negociados oficialmente (ações listadas na B3 ou criptomoedas reconhecidas em exchanges) podem ser consultados no sistema.

### RN04 - Atualização de Cotações

Cotações de ações devem ter validade de até 5 minutos durante horário de pregão. Cotações de criptomoedas devem ter validade de até 1 minuto devido à alta volatilidade do mercado cripto.

### RN05 - Horário de Funcionamento da Bolsa

Cotações de ações da B3 refletem valores atualizados apenas durante o horário de pregão (10h às 17h30, dias úteis). Fora desse horário, são exibidos valores do último fechamento.

### RN06 - Variação Percentual

A variação percentual exibida para cada ativo deve ser calculada em relação ao fechamento do dia anterior (para ações) ou às últimas 24 horas (para criptomoedas).

### RN07 - Limite de Consultas por Usuário

Cada usuário pode realizar até 100 consultas de cotação por hora para evitar sobrecarga no sistema e uso abusivo dos provedores externos.

### RN08 - Moeda de Cotação

Ações brasileiras devem ser exibidas em Reais (BRL). Criptomoedas podem ser exibidas em BRL ou USD conforme preferência do usuário, mas sempre com conversão clara da moeda base.

### RN09 - Transparência da Fonte dos Dados

O sistema deve sempre informar ao usuário se a cotação exibida é em tempo real (obtida do provedor naquele momento) ou se é um dado recente em cache, incluindo o timestamp da última atualização.

### RN10 - Ativo Não Encontrado

Caso o ticker informado não seja encontrado em nenhum dos provedores externos (ação não existe na B3 ou criptomoeda não reconhecida), o sistema deve informar claramente ao usuário que o ativo não foi localizado.

### 3.1. Descrição dos Casos de Uso

#### UC01: Realizar Login

**Ator:** Usuário Não Autenticado  
**Pré-condição:** Usuário possui conta cadastrada no sistema  
**Fluxo Principal:**

1. Usuário acessa página de login
2. Usuário informa email e senha
3. Sistema valida credenciais contra banco de dados
4. Sistema gera token JWT com validade de 24h
5. Sistema retorna token ao cliente
6. Cliente armazena token no localStorage

**Pós-condição:** Usuário autenticado, token armazenado  
**Fluxos Alternativos:**

- **3a.** Credenciais inválidas: Sistema retorna erro 401 "Email ou senha incorretos"

---

#### UC02: Criar Conta

**Ator:** Usuário Não Autenticado  
**Pré-condição:** Email não cadastrado no sistema  
**Fluxo Principal:**

1. Usuário acessa página de cadastro
2. Usuário informa nome, email e senha
3. Sistema valida unicidade do email
4. Sistema valida força da senha (mínimo 8 caracteres)
5. Sistema cria hash BCrypt da senha
6. Sistema cria registro no banco de dados
7. Sistema envia email de confirmação
8. Sistema gera token JWT e retorna ao cliente

**Pós-condição:** Conta criada, usuário autenticado  
**Fluxos Alternativos:**

- **3a.** Email já cadastrado: Sistema retorna erro 400 "Email já existe"
- **4a.** Senha fraca: Sistema retorna erro 400 "Senha deve ter no mínimo 8 caracteres"

---

#### UC03: Consultar Cotação de Ação

**Ator:** Usuário Autenticado  
**Pré-condição:** Usuário possui token JWT válido  
**Fluxo Principal:**

1. Usuário seleciona tipo "Ação" na interface
2. Usuário informa ticker (ex: PETR4)
3. Sistema valida autenticação (UC05)
4. Sistema valida ticker (UC06)
5. Sistema consulta cache (UC07)
6. Se cache vazio, sistema busca no provedor externo (UC08)
7. Sistema retorna cotação formatada ao usuário

**Pós-condição:** Cotação exibida na interface  
**Relacionamentos:** `<<include>>` UC05, UC06, UC07; `<<extend>>` UC08

---

#### UC04: Consultar Cotação de Criptomoeda

**Ator:** Usuário Autenticado  
**Pré-condição:** Usuário possui token JWT válido  
**Fluxo Principal:**

1. Usuário seleciona tipo "Cripto" na interface
2. Usuário informa ticker (ex: BTC, ETH)
3. Sistema valida autenticação (UC05)
4. Sistema valida ticker (UC06)
5. Sistema consulta cache (UC07)
6. Se cache vazio, sistema busca no provedor externo (UC10)
7. Sistema retorna cotação formatada ao usuário

**Pós-condição:** Cotação exibida na interface  
**Relacionamentos:** `<<include>>` UC05, UC06, UC07; `<<extend>>` UC10

---

#### UC05: Validar Autenticação

**Ator:** Sistema  
**Pré-condição:** Requisição recebida com header Authorization  
**Fluxo Principal:**

1. Sistema extrai token do header Authorization (Bearer)
2. Sistema verifica assinatura do JWT
3. Sistema verifica expiração do token (máximo 24h)
4. Sistema extrai userId do payload do token
5. Sistema retorna usuário autenticado

**Pós-condição:** Autenticação validada  
**Fluxos Alternativos:**

- **1a.** Token ausente: Retorna erro 401 "Token não fornecido"
- **2a.** Assinatura inválida: Retorna erro 401 "Token inválido"
- **3a.** Token expirado: Retorna erro 401 "Token expirado"

---

#### UC06: Validar Ticker

**Ator:** Sistema  
**Pré-condição:** Ticker informado na requisição  
**Fluxo Principal:**

1. Sistema verifica formato do ticker (RN02)
2. Sistema verifica se ticker existe no catálogo de ativos conhecidos
3. Sistema retorna ticker válido

**Pós-condição:** Ticker validado  
**Fluxos Alternativos:**

- **1a.** Formato inválido: Retorna erro 400 "Ticker inválido: deve conter 3-10 caracteres alfanuméricos"
- **2a.** Ticker desconhecido: Sistema prossegue (validação ocorrerá no provedor)

---

#### UC07: Consultar Cache

**Ator:** Sistema  
**Pré-condição:** Ticker validado  
**Fluxo Principal:**

1. Sistema monta chave do cache: `quote:{type}:{ticker}`
2. Sistema consulta Redis usando a chave
3. Sistema verifica se dados existem e estão dentro do TTL (RN04)
4. Sistema retorna dados do cache

**Pós-condição:** Dados do cache retornados ou null  
**Fluxos Alternativos:**

- **3a.** Cache vazio ou expirado: Retorna null (dispara UC08 ou UC10)

---

#### UC08: Buscar no Provedor de Ações

**Ator:** Sistema  
**Pré-condição:** Cache vazio ou expirado  
**Fluxo Principal:**

1. Sistema seleciona provedor de ações (Yahoo Finance, Brapi)
2. Sistema monta URL da API externa
3. Sistema envia requisição HTTP GET com timeout de 10s (RN05)
4. Sistema recebe resposta JSON do provedor
5. Sistema parseia dados (preço, variação, timestamp)
6. Sistema atualiza cache (UC09)
7. Sistema retorna dados ao fluxo principal

**Pós-condição:** Cotação obtida do provedor externo  
**Relacionamentos:** `<<include>>` UC09  
**Fluxos Alternativos:**

- **3a.** Timeout ou erro HTTP: Sistema tenta retry (até 3x conforme RN05)
- **3b.** Todas as tentativas falharam: Retorna erro 503 "Provedor indisponível"
- **4a.** Ticker não encontrado no provedor: Retorna erro 404 "Ativo não encontrado"

---

#### UC09: Atualizar Cache

**Ator:** Sistema  
**Pré-condição:** Cotação obtida de provedor externo  
**Fluxo Principal:**

1. Sistema monta chave do cache: `quote:{type}:{ticker}`
2. Sistema serializa dados da cotação para JSON
3. Sistema armazena no Redis com TTL apropriado (RN07):
   - Ações: 5 minutos (300s)
   - Cripto: 1 minuto (60s)
4. Sistema registra log de atualização

**Pós-condição:** Cache atualizado

---

#### UC10: Buscar no Provedor de Cripto

**Ator:** Sistema  
**Pré-condição:** Cache vazio ou expirado  
**Fluxo Principal:**

1. Sistema seleciona provedor de cripto (CoinGecko, Binance)
2. Sistema monta URL da API externa
3. Sistema envia requisição HTTP GET com timeout de 10s (RN06)
4. Sistema recebe resposta JSON do provedor
5. Sistema parseia dados (preço USD/BRL, variação 24h, market cap)
6. Sistema atualiza cache (UC09)
7. Sistema retorna dados ao fluxo principal

**Pós-condição:** Cotação obtida do provedor externo  
**Relacionamentos:** `<<include>>` UC09  
**Fluxos Alternativos:**

- **3a.** Timeout ou erro HTTP: Sistema tenta retry (até 3x conforme RN06)
- **3b.** Todas as tentativas falharam: Retorna erro 503 "Provedor indisponível"
- **4a.** Criptomoeda não encontrada: Retorna erro 404 "Criptoativo não encontrado"

---

#### UC11: Visualizar Favoritos

**Ator:** Usuário Autenticado  
**Pré-condição:** Usuário possui favoritos cadastrados  
**Fluxo Principal:**

1. Usuário acessa página de favoritos
2. Sistema busca lista de tickers favoritos do usuário no banco
3. Para cada ticker, sistema consulta cotação atual (UC03 ou UC04)
4. Sistema exibe lista com cotações atualizadas

**Pós-condição:** Lista de favoritos exibida

---

#### UC12: Adicionar aos Favoritos

**Ator:** Usuário Autenticado  
**Pré-condição:** Usuário está visualizando cotação de um ativo  
**Fluxo Principal:**

1. Usuário clica em botão "Adicionar aos Favoritos"
2. Sistema verifica se ativo já está nos favoritos (evitar duplicata)
3. Sistema verifica se usuário atingiu limite de 50 favoritos
4. Sistema cria registro na tabela `favorites`
5. Sistema exibe confirmação visual

**Pós-condição:** Ativo adicionado aos favoritos  
**Fluxos Alternativos:**

- **2a.** Ativo já favoritado: Sistema exibe mensagem "Ativo já está nos favoritos"
- **3a.** Limite atingido: Sistema retorna erro "Limite de 50 favoritos atingido"

---

## 4. Requisitos Não Funcionais (RNF)

### RNF01: Desempenho de Consulta

**Descrição:** O tempo de resposta total (do clique do usuário até exibição da cotação) não deve ultrapassar 2 segundos em 95% das requisições quando dados estão em cache, e 5 segundos quando consulta provedor externo.  
**Categoria:** Performance  
**Prioridade:** Alta  
**Relacionado a:** UC03, UC04, UC07, UC08, UC10  
**Critérios de Aceitação:**

- Tempo de resposta do cache: ≤ 200ms (p95)
- Tempo de resposta com provedor: ≤ 5s (p95)
- Throughput: 100 requisições/segundo por instância

**Justificativa:** Usuários esperam dados financeiros rapidamente para tomar decisões de investimento. Latência alta causa má experiência.

---

### RNF02: Disponibilidade do Sistema

**Descrição:** O sistema FINTA deve manter disponibilidade de 99,5% ao mês (uptime) durante horário comercial (9h-18h BRT, seg-sex).  
**Categoria:** Confiabilidade  
**Prioridade:** Alta  
**Relacionado a:** Todos os casos de uso  
**Critérios de Aceitação:**

- Uptime mensal: ≥ 99,5%
- Downtime máximo: 3,6 horas/mês
- Implementar health checks em `/health` endpoint
- Monitoramento com alertas automáticos (Prometheus + Grafana)

**Justificativa:** Usuários precisam acessar dados de mercado durante horário de negociação. Indisponibilidade causa perda de oportunidades.

---

### RNF03: Resiliência a Falhas de Provedores Externos

**Descrição:** O sistema deve implementar mecanismos de resiliência (circuit breaker, retry, fallback) para lidar com instabilidades de APIs externas sem degradar experiência do usuário.  
**Categoria:** Confiabilidade  
**Prioridade:** Alta  
**Relacionado a:** UC08, UC10  
**Critérios de Aceitação:**

- Implementar circuit breaker (padrão: 5 falhas em 30s abre circuito por 60s)
- Retry automático com backoff exponencial (RN05, RN06)
- Fallback para cache mesmo expirado em caso de emergência (com aviso ao usuário)
- Taxa de sucesso de fallback: ≥ 90%
- Registro de todas as falhas em logs centralizados

**Justificativa:** APIs externas (Yahoo, CoinGecko) podem ter instabilidades. Sistema não pode depender 100% delas.

---

### RNF04: Segurança da Autenticação

**Descrição:** O sistema deve implementar autenticação e autorização seguras para proteger dados dos usuários e prevenir acessos não autorizados.  
**Categoria:** Segurança  
**Prioridade:** Crítica  
**Relacionado a:** UC01, UC02, UC05  
**Critérios de Aceitação:**

- Senhas armazenadas com BCrypt (≥ 12 rounds)
- Tokens JWT assinados com RS256 (chave privada RSA)
- Comunicação exclusivamente via HTTPS/TLS 1.3
- Implementar rate limiting: 5 tentativas de login por IP a cada 15 minutos
- Implementar rate limiting: 100 requisições de cotação por usuário por hora (RN10)
- Headers de segurança: HSTS, CSP, X-Frame-Options
- Conformidade com LGPD (não armazenar dados sensíveis desnecessários)

**Justificativa:** Proteção de credenciais e dados dos usuários. Prevenção de ataques DDoS e brute force.

---

### RNF05: Escalabilidade Horizontal

**Descrição:** A arquitetura do sistema deve permitir escalabilidade horizontal (adição de instâncias) para suportar crescimento de usuários sem degradação de performance.  
**Categoria:** Escalabilidade  
**Prioridade:** Média  
**Relacionado a:** Arquitetura geral do sistema  
**Critérios de Aceitação:**

- Backend stateless (sem sessões em memória local)
- Cache centralizado (Redis Cluster) compartilhado entre instâncias
- Banco de dados com suporte a read replicas (PostgreSQL)
- Load balancer (Cloudflare Workers, AWS ALB)
- Suportar até 10.000 usuários simultâneos com 5 instâncias backend
- Auto-scaling baseado em métricas (CPU > 70%, latência > 2s)

**Justificativa:** Sistema pode crescer rapidamente. Arquitetura deve permitir escalar sem reescrever código ou causar downtime.

---

## 5. Considerações Finais

### 5.1. Integrações Externas Identificadas

O processo TO-BE requer integração com os seguintes sistemas externos:

1. **Provedores de Cotações de Ações**
   - **Yahoo Finance API** ou **Brapi (API brasileira)**
   - Finalidade: Cotações de ações negociadas na B3
   - Protocolo: REST API (HTTP GET)
   - Formato: JSON
   - Frequência: Sob demanda (com cache de 5 minutos)
   - Rate Limit: Variável (depende do provedor)

2. **Provedores de Cotações de Criptomoedas**
   - **CoinGecko API** (gratuito) ou **Binance API**
   - Finalidade: Cotações de criptoativos em tempo real
   - Protocolo: REST API (HTTP GET)
   - Formato: JSON
   - Frequência: Sob demanda (com cache de 1 minuto)
   - Rate Limit: 50 req/min (CoinGecko free tier)

3. **Sistema de Cache Distribuído**
   - **Redis** (Upstash Redis ou Redis Cloud)
   - Finalidade: Cache de cotações para otimizar performance
   - Protocolo: Redis Protocol
   - Formato: JSON serializado
   - TTL: 5 min (ações) / 1 min (cripto)

4. **Banco de Dados Relacional**
   - **PostgreSQL** (Supabase, Neon ou Cloudflare D1)
   - Finalidade: Armazenar usuários, favoritos, alertas
   - Protocolo: SQL
   - Formato: Tabelas relacionais

### 5.2. Arquitetura Proposta

```
┌─────────────┐
│   Cliente   │  (React/Next.js)
│  (Browser)  │
└──────┬──────┘
       │ HTTPS
       ↓
┌─────────────────────────────┐
│   Cloudflare Workers        │
│   (Backend FINTA)           │
│   - API REST                │
│   - Autenticação JWT        │
│   - Validações (RN01-RN10)  │
└───┬─────────┬───────────┬───┘
    │         │           │
    │         │           └────────────┐
    │         │                        │
    ↓         ↓                        ↓
┌─────────┐  ┌──────────────┐  ┌──────────────────┐
│  Redis  │  │ PostgreSQL/D1│  │ Provedores       │
│ (Cache) │  │ (Dados)      │  │ Externos         │
│         │  │              │  │ - Yahoo Finance  │
│         │  │ - users      │  │ - CoinGecko      │
│         │  │ - favorites  │  │                  │
│         │  │ - alerts     │  │                  │
└─────────┘  └──────────────┘  └──────────────────┘
```

### 5.3. Próximos Passos

Com o processo TO-BE modelado, as próximas etapas incluem:

1. **Especificação de APIs:** Documentar endpoints REST com OpenAPI/Swagger
   - `POST /api/auth/login`
   - `POST /api/auth/register`
   - `GET /api/quotes/stocks/:ticker`
   - `GET /api/quotes/crypto/:ticker`
   - `GET /api/favorites`
   - `POST /api/favorites`

2. **Modelagem de Dados:** Criar diagrama ER do banco de dados
   - Tabelas: `users`, `favorites`, `alerts`, `quote_cache_meta`

3. **Implementação do Backend:** Desenvolver Cloudflare Worker com:
   - Rotas e controladores
   - Middlewares de autenticação
   - Serviços de integração com provedores externos
   - Cache Redis

4. **Prototipação de UI:** Wireframes das telas principais
   - Tela de login/cadastro
   - Dashboard com busca de cotações
   - Página de favoritos

5. **Planejamento de Testes:**
   - Testes unitários de validações (RN01-RN10)
   - Testes de integração com APIs externas
   - Testes de carga (performance)
   - Testes de resiliência (circuit breaker, retry)

---

**Documento elaborado por:** Equipe FINTA  
**Revisão:** v2.0  
**Data de Atualização:** 18 de Março de 2026
