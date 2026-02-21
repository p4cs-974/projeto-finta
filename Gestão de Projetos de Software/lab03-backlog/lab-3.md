# Lab 03 - Backlog Inicial do Produto

**Disciplina:** Gestão de Projetos de Software  
**Projeto:** FINTA (FINancial Tracking & Analysis)  
**Data:** 21 de Fevereiro de 2026
**Link Backlog do Jira:** https://p4cs.atlassian.net/jira/software/projects/ROBERTO/boards/35/backlog

---

## 1. INTRODUÇÃO

Este documento apresenta o backlog inicial do produto FINTA, contendo as histórias de usuário priorizadas, análise INVEST, critérios de aceite em formato Gherkin, e a lista completa de Requisitos Não Funcionais (RNFs) com sua rastreabilidade às histórias impactadas.

O backlog foi construído com foco na proposta de valor do FINTA: **centralização e simplicidade no acompanhamento de indicadores financeiros**.

---

## 2. BACKLOG DO PRODUTO E PRIORIZAÇÃO MoSCoW

As histórias foram priorizadas utilizando o método **MoSCoW**, considerando o valor de negócio, urgência e dependências técnicas.

| ID | História de Usuário | Prioridade | Justificativa |
|----|---------------------|------------|---------------|
| **US01** | Como usuário, quero visualizar uma interface limpa e centralizada para acompanhar meus dados financeiros rapidamente. | **Must Have** | Essencial para a primeira impressão e usabilidade do sistema. É a base para todas as outras funcionalidades. |
| **US02** | Como usuário autenticado, quero salvar meus ativos facoritos para acessá-los rapidamente. | **Should Have** | Funcionalidade principal do sistema. |
| **US03** | Como investidor, quero ver cotações de ações e criptos em tempo real para não precisar usar ferramentas externas complexas. | **Must Have** | Diferencial competitivo e centralização de informações. Representa o valor único do FINTA. |
| **US04** | Como entusiasta, quero visualizar a Taxa Selic atualizada para entender o impacto nos meus investimentos de renda fixa. | **Should Have** | Importante para investidores brasileiros, mas não impede o uso básico do sistema. |
| **US05** | Como interessado em crédito, quero **comparar taxas de financiamento de diferentes instituições** para encontrar a melhor opção disponível no mercado. | **Should Have** | Agrega valor significativo, mas é uma ferramenta auxiliar ao core do produto. |
| **US06** | Como usuário, quero me autenticar de forma segura para que meus dados financeiros fiquem protegidos. | **Must Have** | Essencial para segurança e proteção de dados sensíveis. |

---

## 3. ANÁLISE INVEST

Cada história de usuário foi analisada segundo os critérios **INVEST** para garantir qualidade e viabilidade:

### US01 - Interface de Usuário (Home/Dashboard)

- **Independente:** Pode ser desenvolvida independentemente de outras histórias.
- **Negociável:** Layout e elementos visuais podem ser ajustados com o time de design.
- **Valiosa:** Primeira experiência do usuário, essencial para engajamento.
- **Estimável:** Componentes React padrão facilitam estimativa (5 story points).
- **Small:** Pode ser entregue em 1 Sprint.
- **Testável:** Tempo de carregamento e elementos visuais são mensuráveis.

### US02 - Favoritos



### US03 - Integração com APIs de Mercado

- **Independente:** Não depende de outras histórias para funcionar.
- **Negociável:** Frequência de atualização e ativos suportados podem ser ajustados.
- **Valiosa:** Diferencial competitivo e centralização de dados.
- **Estimável:** APIs externas bem documentadas (8 story points).
- **Small:** Pode ser entregue em 1 Sprint com integração básica.
- **Testável:** Disponibilidade e tempo de resposta são mensuráveis.

### US04 - Dashboard de Indicadores Macroeconômicos

- **Independente:** Funcionalidade isolada, sem dependências técnicas.
- **Negociável:** Formato de exibição (gráfico vs. valor) pode ser discutido.
- **Valiosa:** Indicador macroeconômico essencial para investidores.
- **Estimável:** API do Banco Central facilita estimativa (3 story points).
- **Small:** Implementação simples, viável em 1 Sprint.
- **Testável:** Confiabilidade dos dados é verificável.

### US05 - Simulador de Financiamento

- **Independente:** Não depende de autenticação ou outras funcionalidades.
- **Negociável:** Complexidade da fórmula (SAC vs. Price) pode ser ajustada.
- **Valiosa:** Alta conversão esperada, resolve problema real.
- **Estimável:** Lógica matemática conhecida (5 story points).
- **Small:** Pode ser entregue em 1 Sprint.
- **Testável:** Usabilidade (número de cliques) é mensurável.

### US06 - Sistema de Acesso (Segurança)

- **Independente:** Independente de outras histórias, mas outras podem depender dela.
- **Negociável:** Método de autenticação (JWT vs. sessões) pode ser discutido.
- **Valiosa:** Essencial para segurança e proteção de dados.
- **Estimável:** Padrão conhecido (5 story points).
- **Small:** Cadastro e login básicos cabem em 1 Sprint.
- **Testável:** Fluxos de sucesso/erro e segurança são testáveis.

**Ajustes Realizados:**
- Todas as histórias passaram na análise INVEST.
- US06 foi marcada como Must Have devido à criticidade de segurança.

---

## 4. CRITÉRIOS DE ACEITE (FORMATO GHERKIN)

### US01 - Interface de Usuário (Home/Dashboard)

**Critério Funcional 1:**
```gherkin
Dado que o usuário acessa a página inicial
Quando o sistema carrega
Então deve exibir o saldo consolidado
E os atalhos para os módulos
```

**Critério Funcional 2:**
```gherkin
Dado que o usuário está no dashboard
Quando clica em um indicador
Então o sistema deve expandir os detalhes desse ativo
```

**Critério Não Funcional (Desempenho - RNF01):**
```gherkin
Dado que a página principal é solicitada
Quando o servidor responde
Então o tempo de carregamento total não deve ultrapassar 3 segundos
```

---

### US02 - Cadastro de Transações

**Critério Funcional 1:**
```gherkin
Dado que preenchi o valor e a categoria
Quando clicar em salvar
Então o saldo total deve ser recalculado
```

**Critério Funcional 2:**
```gherkin
Dado que uma transação foi salva
Quando eu consultar o extrato
Então ela deve aparecer listada corretamente
```

**Critério Não Funcional (Segurança - RNF02):**
```gherkin
Dado que uma transação está sendo salva
Quando os dados viajam para o servidor
Então a conexão deve estar protegida por protocolo HTTPS/TLS
```

---

### US03 - Integração com APIs de Mercado

**Critério Funcional 1:**
```gherkin
Dado que pesquisei por um ativo (ex: BTC)
Quando a API responde
Então o preço atual e a variação do dia devem aparecer na tela
```

**Critério Funcional 2:**
```gherkin
Dado que a cotação mudou
Quando o sistema detecta a alteração
Então o valor na interface deve piscar em verde (subida) ou vermelho (descida)
```

**Critério Não Funcional (Disponibilidade - RNF03):**
```gherkin
Dado que o mercado está aberto
Quando o sistema solicita os dados
Então o serviço deve estar disponível (Uptime) em 99,5% das tentativas
```

---

### US04 - Dashboard de Indicadores Macroeconômicos

**Critério Funcional 1:**
```gherkin
Dado que o usuário abre o módulo macro
Quando o sistema busca os dados do Banco Central
Então deve exibir a Selic meta vigente
```

**Critério Funcional 2:**
```gherkin
Dado que houve uma reunião do Copom
Quando a taxa mudar na fonte
Então o FINTA deve refletir o novo valor em até 24h
```

**Critério Não Funcional (Confiabilidade - RNF04):**
```gherkin
Dado que os dados são exibidos
Quando o usuário verifica a fonte
Então a divergência de valor deve ser zero
```

---

### US05 - Simulador de Financiamento

**Critério Funcional 1:**
```gherkin
Dado que inseri o valor do bem e o prazo
Quando selecionar a taxa de juros
Então o sistema deve mostrar o valor da parcela mensal
```

**Critério Funcional 2:**
```gherkin
Dado que gerei a simulação
Quando clicar em "Ver detalhamento"
Então deve mostrar o total pago em juros ao final do período
```

**Critério Não Funcional (Usabilidade - RNF05):**
```gherkin
Dado que o usuário quer simular
Quando ele inicia o processo
Então ele deve conseguir o resultado em menos de 4 cliques
```

---

### US06 - Sistema de Acesso (Segurança)

**Critério Funcional 1:**
```gherkin
Dado que inseri e-mail e senha válidos
Quando clicar em entrar
Então devo ser redirecionado para minha área privada
```

**Critério Funcional 2:**
```gherkin
Dado que tentei logar com senha errada 3 vezes
Quando houver a quarta tentativa
Então o sistema deve exibir um aviso de segurança
```

**Critério Não Funcional (Segurança/Privacidade - RNF06):**
```gherkin
Dado que a senha foi criada
Quando armazenada no banco de dados
Então ela deve ser protegida por um algoritmo de Hash (como BCrypt ou SHA-256)
```

---

## 5. REQUISITOS NÃO FUNCIONAIS (RNFs) MENSURÁVEIS

A lista abaixo contém os RNFs do sistema FINTA, todos com métricas claras de aceitação e rastreabilidade às histórias de usuário impactadas.

| ID | Categoria | Descrição | Métrica de Aceitação | Histórias Impactadas |
|----|-----------|-----------|----------------------|----------------------|
| **RNF01** | **Desempenho** | O sistema deve carregar rapidamente para garantir boa experiência | Tempo de carregamento da página principal inferior a 3 segundos | US01 |
| **RNF02** | **Segurança** | Comunicações devem ser criptografadas para proteger dados | Todas as requisições devem usar HTTPS/TLS | US02, US06 |
| **RNF03** | **Disponibilidade** | APIs externas devem estar disponíveis para consultas | Uptime de 99,5% ao mês nas integrações | US03 |
| **RNF04** | **Confiabilidade** | Dados exibidos devem ser precisos e confiáveis | Divergência zero entre fonte oficial e sistema | US04 |
| **RNF05** | **Usabilidade** | Interface deve ser intuitiva e fácil de usar | Simulação completa em menos de 4 cliques | US05 |
| **RNF06** | **Segurança** | Senhas devem ser armazenadas de forma segura | Hash BCrypt ou SHA-256 para todas as senhas | US06 |
| **RNF07** | **Escalabilidade** | Sistema deve suportar crescimento de usuários | Suportar até 5.000 usuários simultâneos sem degradação | Todas |
| **RNF08** | **Compatibilidade** | Funcionar em diferentes dispositivos e navegadores | Compatível com Chrome, Firefox, Safari, Edge (últimas 2 versões) | Todas |

---

## 6. RASTREABILIDADE RNFs × HISTÓRIAS

A tabela abaixo mapeia explicitamente quais RNFs impactam cada história de usuário:

| História | RNFs Aplicados | Observações |
|----------|----------------|-------------|
| **US01** | RNF01, RNF07, RNF08 | Performance crítica para primeira impressão |
| **US02** | RNF02, RNF07, RNF08 | Segurança essencial para dados financeiros |
| **US03** | RNF03, RNF07, RNF08 | Disponibilidade crítica para cotações em tempo real |
| **US04** | RNF04, RNF07, RNF08 | Confiabilidade dos dados é essencial |
| **US05** | RNF05, RNF07, RNF08 | Usabilidade impacta conversão |
| **US06** | RNF02, RNF06, RNF07, RNF08 | Segurança é prioridade máxima |

---

## 7. DEFINIÇÃO DE PRONTO (DEFINITION OF DONE)

Para que uma história seja considerada concluída, ela deve atender a:

1. **Código Implementado:** Funcionalidade desenvolvida conforme critérios de aceite
2. **Testes Automatizados:** Testes unitários e de integração com cobertura mínima de 70%
3. **Code Review:** Aprovação de pelo menos 1 membro da equipe
4. **RNFs Validados:** Métricas de RNFs aplicáveis foram verificadas
5. **Documentação:** README e comentários de código atualizados
6. **Deploy em Homologação:** Funcionalidade testada em ambiente de staging
7. **Aprovação do PO:** Product Owner validou a entrega

---

## 8. FERRAMENTAS UTILIZADAS

- **Gerenciamento do Backlog:** Jira
- **Repositório Git:** GitHub (https://github.com/p4cs-974/projeto-finta)
- **Framework de Priorização:** MoSCoW
- **Análise de Qualidade:** INVEST
- **Formato de Critérios de Aceite:** Gherkin (BDD)

---

**Equipe FINTA:**
- **Kawan Mark** - Product Owner (PO)
- **Pedro Custódio** - Scrum Master (SM)
- **Alexandre Pierri** - Desenvolvedor
- **Lucas Roberto** - Desenvolvedor
- **Gabriel Albertini** - Desenvolvedor

**Data de Criação do Backlog:** 21 de Fevereiro de 2026  
**Versão do Documento:** 1.0
