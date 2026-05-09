# Relatório de Encerramento: Sprint 2 - Projeto Finta

## 1. Objetivo
Este documento formaliza o encerramento da Sprint 2, revisando as entregas realizadas, validando os critérios de aceite e consolidando a retrospectiva final do semestre, com foco na implementação da interface de linha de comando (CLI) do ecossistema Finta.

---

## 2. Atividades e Entregas da Sprint

### 2.1. Histórias de Usuário Concluídas
Todas as histórias planejadas para esta sprint foram implementadas e integradas à CLI:

* Cadastro via CLI**: Possibilidade de criar uma conta no Finta diretamente pelo terminal.
* Login via CLI**: Autenticação de usuários existentes no terminal utilizando o comando `finta`.
* Visualização de detalhes de ativos**: Acesso à tela de indicadores de ativos através da interface de texto.
* Dashboard Financeiro**: Visualização do resumo financeiro consolidado na tela inicial da CLI com as mesmas informações do dashboard na web.
* Gestão de Favoritos**: Funcionalidade de adicionar e remover ativos da lista de favoritos pelo terminal.
* **Bônus**: Integração de agente de IA para operação da CLI via linguagem natural através de uma skill.

### 2.2. Validação das Entregas
As entregas foram validadas com base nos critérios de aceite de funcionamento em ambiente Unix-like, garantindo que os comandos executados no terminal reflitam as mesmas informações presentes na plataforma web.

### 2.3. Situação dos Quadros (Kanban)
Abaixo, a evidência do estado final das atividades e do gerenciamento de riscos:


### Quadro Kanban de Riscos

<img width="1518" height="515" alt="kanban_riscos" src="https://github.com/user-attachments/assets/6aca91c0-278b-49d8-918f-41ba8f27e957" />

### Quadro Kanban da Sprint

<img width="1158" height="692" alt="kanban_sprint" src="https://github.com/user-attachments/assets/ab7d6537-30b9-40f7-abfe-4cfd959a1823" />

## 3. Indicadores de Desempenho

**Throughput** 

~2/3 tasks/semana

**Lead Time**

- Criação: 11/04/2026
- Finalização: 08/05/2026
- Lead Time: 27 dias

**Cycle Time**

~ 3 dias por tarefa

**Velocity**
> 20 pontos de história
<img width="2417" height="1442" alt="image" src="https://github.com/user-attachments/assets/876c569c-0503-4d00-baf0-7614792857e7" />

**Burndown**

<img width="2425" height="1179" alt="image" src="https://github.com/user-attachments/assets/479ff521-7579-4e72-b9be-0800255f1109" />

## 4. Retrospectiva Final

### 4.1. Principais Acertos
* **Paralelização do esforço**: A equipe conseguiu distribuir as tarefas da CLI de forma simultânea.

### 4.2. Dificuldades Enfrentadas
* **Gerenciamento de tempo**: Ajustar o cronograma de desenvolvimento com as entregas das outras disciplinas.

### 4.3. Riscos Ocorridos e Soluções
* **Incompatibilidade de SO**: Identificada incompatibilidade com Windows. **Solução**: Foco total em sistemas Unix-like para garantir estabilidade.
* **Ambiente de Desenvolvimento**: Complexidade na configuração inicial. **Solução**: Padronização via `pnpm install` e definição clara de variáveis de ambiente.

### 4.4. Melhorias Aplicadas
* **Otimização de Agentes**: Criação do arquivo `AGENTS.md` para fornecer contexto reutilizável às IAs, aumentando a produtividade da equipe.

### 4.5. Lições Aprendidas
*  Ao invés de expandir o escopo do projeto, o grupo preferiu pivotá-lo para algo mais simples, focando na qualidade final do produto.

## 5. Pendências e Repositório
* **Histórias Pendentes**: Nenhuma. Todas as metas da Sprint 2 foram atingidas conforme o planejamento.
* **Link do Repositório**: https://github.com/p4cs-974/projeto-finta/tree/main
