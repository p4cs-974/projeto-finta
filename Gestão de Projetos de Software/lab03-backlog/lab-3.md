# rLab 03 - Backlog Inicial do Produto

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

| ID            | História de Usuário                                                                                                                                    | Prioridade            | Justificativa                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------- |
| **HN1** | Como usuário, quero visualizar uma interface limpa e centralizada para acompanhar meus dados financeiros rapidamente.                                   | **Must Have**   | Essencial para a primeira impressão e usabilidade do sistema. É a base para todas as outras funcionalidades. |
| **HN2** | Como usuário autenticado, quero salvar meus ativos favoritos para acessá-los rapidamente.                                                              | **Should Have** | Funcionalidade principal do sistema que agrega valor à experiência do usuário.                              |
| **HN3** | Como investidor, quero ver cotações de ações e criptos em tempo real para não precisar usar ferramentas externas complexas.                         | **Must Have**   | Diferencial competitivo e centralização de informações. Representa o valor único do FINTA.                |
| **HN4** | Como entusiasta, quero visualizar a Taxa Selic atualizada para entender o impacto nos meus investimentos de renda fixa.                                  | **Should Have** | Importante para investidores brasileiros, mas não impede o uso básico do sistema.                            |
| **HN5** | Como interessado em crédito, quero comparar taxas de financiamento de diferentes instituições para encontrar a melhor opção disponível no mercado. | **Should Have** | Agrega valor significativo, mas é uma ferramenta auxiliar ao core do produto.                                 |
| **HN6** | Como usuário, quero me autenticar de forma segura para que meus dados financeiros fiquem protegidos.                                                    | **Must Have**   | Essencial para segurança e proteção de dados sensíveis.                                                    |

---

## 3. ANÁLISE INVEST

Cada história de usuário foi analisada segundo os critérios **INVEST** para garantir qualidade e viabilidade:

### HN1 - Interface de Usuário (Home/Dashboard)

**História:** Como usuário, quero visualizar ude maneira simples o login, além de acompanhar meus dados financeiros rapidamente.

**Análise INVEST:**

- **I (Independente):** Pode ser desenvolvida independentemente de outras histórias.
- **N (Negociável):** Layout e elementos visuais podem ser ajustados com o time de design.
- **V (Valiosa):** Primeira experiência do usuário, essencial para engajamento.
- **E (Estimável):** Componentes padrão de reuso facilitam estimativa (5 story points).
- **S (Small):** Pode ser entregue em 1 Sprint.
- **T (Testável):** Tempo de carregamento e elementos visuais são mensuráveis.

---

### HN2 - Favoritos

**História:** Como usuário autenticado, quero salvar meus ativos favoritos para acessá-los rapidamente.

**Análise INVEST:**

- **I (Independente):** Depende de HN6 (autenticação) para funcionar.
- **N (Negociável):** Quantidade máxima de favoritos pode ser ajustada.
- **V (Valiosa):** Incrementa simplicidade no acesso às informações.
- **E (Estimável):** CRUD simples (3 story points).
- **S (Small):** Implementação rápida após HN6.
- **T (Testável):** Ações de adicionar/remover são testáveis.

---

### HN3 - Integração com APIs de Mercado

**História:** Como investidor, quero ver cotações de ações e criptos em tempo real para não precisar usar ferramentas externas complexas.

**Análise INVEST:**

- **I (Independente):** Não depende de outras histórias para funcionar.
- **N (Negociável):** Frequência de atualização e ativos suportados podem ser ajustados.
- **V (Valiosa):** Diferencial competitivo e centralização de dados.
- **E (Estimável):** APIs externas bem documentadas (8 story points).
- **S (Small):** Pode ser entregue em 1 Sprint com integração básica.
- **T (Testável):** Disponibilidade e tempo de resposta são mensuráveis.

---

### HN4 - Dashboard de Indicadores Macroeconômicos

**História:** Como entusiasta, quero visualizar a Taxa Selic atualizada para entender o impacto nos meus investimentos de renda fixa.

**Análise INVEST:**

- **I (Independente):** Funcionalidade isolada, sem dependências técnicas.
- **N (Negociável):** Formato de exibição (gráfico vs. valor) pode ser discutido.
- **V (Valiosa):** Indicador macroeconômico essencial para investidores.
- **E (Estimável):** API do Banco Central facilita estimativa (3 story points).
- **S (Small):** Implementação simples, viável em 1 Sprint.
- **T (Testável):** Confiabilidade dos dados é verificável.

---

### HN5 - Comparação de Taxas de Financiamento

**História:** Como interessado em crédito, quero comparar taxas de financiamento de diferentes instituições para encontrar a melhor opção disponível no mercado.

**Análise INVEST:**

- **I (Independente):** Não depende de autenticação ou outras funcionalidades.
- **N (Negociável):** Complexidade da fórmula (SAC vs. Price) pode ser ajustada.
- **V (Valiosa):** Alta conversão esperada, resolve problema real.
- **E (Estimável):** Lógica matemática conhecida (5 story points).
- **S (Small):** Pode ser entregue em 1 Sprint.
- **T (Testável):** Usabilidade (número de cliques) é mensurável.

---

### HN6 - Sistema de Acesso (Segurança)

**História:** Como usuário, quero me autenticar de forma segura para que meus dados financeiros fiquem protegidos.

**Análise INVEST:**

- **I (Independente):** Independente de outras histórias, mas outras podem depender dela.
- **N (Negociável):** Método de autenticação (JWT vs. sessões) pode ser discutido.
- **V (Valiosa):** Essencial para segurança e proteção de dados.
- **E (Estimável):** Padrão conhecido (5 story points).
- **S (Small):** Cadastro e login básicos cabem em 1 Sprint.
- **T (Testável):** Fluxos de sucesso/erro e segurança são testáveis.

**Ajustes Realizados:**

- Todas as histórias passaram na análise INVEST.
- HN6 foi marcada como Must Have devido à criticidade de segurança.
- HN2 depende de HN6 para funcionar.

---

## 4. CRITÉRIOS DE ACEITE (FORMATO GHERKIN)

### HN1 - Interface de Usuário (Home/Dashboard)

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

### HN2 - Favoritos

**Critério Funcional 1:**

```gherkin
Dado que estou autenticado
E visualizo um ativo
Quando clico no ícone de "Adicionar aos Favoritos"
Então o ativo deve ser salvo na minha lista de favoritos
E o ícone deve mudar para "Favoritado"
```

**Critério Funcional 2:**

```gherkin
Dado que tenho ativos favoritados
Quando acesso a página de favoritos
Então o sistema deve listar todos os ativos salvos
E exibir suas cotações atualizadas
```

**Critério Não Funcional (Usabilidade - RNF05):**

```gherkin
Dado que quero adicionar um ativo aos favoritos
Quando estou na página do ativo
Então o botão de favoritar deve estar visível
E ser acessível em no máximo 1 clique
```

---

### HN3 - Integração com APIs de Mercado

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

### HN4 - Dashboard de Indicadores Macroeconômicos

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

### HN5 - Comparação de Taxas de Financiamento

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
Dado que o usuário quer comparar taxas
Quando ele inicia o processo
Então ele deve conseguir o resultado em menos de 4 cliques
```

---

### HN6 - Sistema de Acesso (Segurança)

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

| ID              | Categoria                 | Descrição                                                        | Métrica de Aceitação                                             | Histórias Impactadas |
| --------------- | ------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- | --------------------- |
| **RNF01** | **Desempenho**      | O sistema deve carregar rapidamente para garantir boa experiência | Tempo de carregamento da página principal inferior a 3 segundos    | HN1                   |
| **RNF02** | **Segurança**      | Comunicações devem ser criptografadas para proteger dados        | Todas as requisições devem usar HTTPS/TLS                         | HN2, HN6              |
| **RNF03** | **Disponibilidade** | APIs externas devem estar disponíveis para consultas              | Uptime de 99,5% ao mês nas integrações                           | HN3                   |
| **RNF04** | **Confiabilidade**  | Dados exibidos devem ser precisos e confiáveis                    | Divergência zero entre fonte oficial e sistema                     | HN4                   |
| **RNF05** | **Usabilidade**     | Interface deve ser intuitiva e fácil de usar                      | Operações completas em menos de 6 cliques                        | HN2, HN5              |
| **RNF06** | **Segurança**      | Senhas devem ser armazenadas de forma segura                       | Hash BCrypt ou SHA-256 para todas as senhas                         | HN6                   |
|                 |                           |                                                                    |                                                                     |                       |
| **RNF08** | **Compatibilidade** | Funcionar em diferentes dispositivos e navegadores                 | Compatível com Chrome, Firefox, Safari, Edge (últimas 2 versões) | Todas                 |

---

## 6. RASTREABILIDADE RNFs × HISTÓRIAS

A tabela abaixo mapeia explicitamente quais RNFs impactam cada história de usuário:

| História     | RNFs Aplicados             | Observações                                          |
| ------------- | -------------------------- | ------------------------------------------------------ |
| **HN1** | RNF01, RNF07, RNF08        | Performance crítica para primeira impressão          |
| **HN2** | RNF02, RNF05, RNF07, RNF08 | Usabilidade e segurança essenciais                    |
| **HN3** | RNF03, RNF07, RNF08        | Disponibilidade crítica para cotações em tempo real |
| **HN4** | RNF04, RNF07, RNF08        | Confiabilidade dos dados é essencial                  |
| **HN5** | RNF05, RNF07, RNF08        | Usabilidade impacta conversão                         |
| **HN6** | RNF02, RNF06, RNF07, RNF08 | Segurança é prioridade máxima                       |

---

## 7. FERRAMENTAS UTILIZADAS

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
