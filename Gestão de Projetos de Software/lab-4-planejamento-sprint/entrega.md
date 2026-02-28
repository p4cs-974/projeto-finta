## Casos de uso derivados a partir do backlog

### UC1: Visualizar dashboard financeiro
- Interação 3: usuário interagindo com gui, api ext fin, api ext cripto
- Regras de negócio 1: usuário precisa estar autenticado pra ver o dashboard
- Entidades 2: sistema de autenticação, e api financeira backend
- Manipulação (CRUD) 1: ler apenas
- PNA parcial 7

### UC2: Visualizar detalhes de indicadores/ativos
- Interação 3: usuário interagindo com gui, apis externas relevantes
- Regras de negócio 1: usuário precisa estar autenticado pra ver um dashboard
- Entidades 2: auth, api backend fin, api backend cripto
- Manipulação (CRUD) 1: visualização de dados
- PNA parcial 7

### UC3: Realizar cadastro
- Interação 3:usuário interagindo com gui
- Regras de negócio 1: usuário precisa inserir dados válidos
- Entidades 1: api backend autenticação
- Manipulação (CRUD) 1: ler dados de usuários cadastrados
- PNA parcial 6

### UC4: Realizar login

- Interação 3:usuário interagindo com gui
- Regras de negócio 1: usuário precisa inserir dados válidos
- Entidades 1: api backend autenticação
- Manipulação (CRUD) 1: ler dados de usuários cadastrados
- PNA parcial 6

### UC5: Adicionar favoritos
- Interação 3: usuário interagindo com gui, apis externas fin e cripto
- Regras de negócio 1: usuário precisa estar autenticado
- Entidades 3: auth, api backend fin, api backend cripto, db favoritos
- Manipulação (CRUD) 2: usuário adiciona ativos (cripto ou ações à sua biblioteca)
- PNA parcial 9
- 
### UC6: Editar favoritos
- Interação 3: usuário interagindo com gui, apis externas fin e cripto
- Regras de negócio 1: usuário precisa estar autenticado
- Entidades 3: auth, api fin, api backend cripto, db backend favoritos
- Manipulação (CRUD) 3: usuário consegue editar ativos da sua sua bliblioteca de fvoritos
- PNA parcial 10

### UC7: Remover favoritos
- Interação 3: usuário interagindo com gui, apis externas fin e cripto
- Regras de negócio 1: usuário precisa estar autenticado
- Entidades 3: auth, api backend fin, api backend cripto, db favoritos
- Manipulação (CRUD) 1: usuário consegue deletar ativos da sua sua bliblioteca de fvoritos
- PNA parcial 8

### UC8: Consultar cotações em tempo real (ações/criptos)

- Interação 3: usuário interagindo com gui apis financeiras externas relevantes
- Regras de negócio 1: usuário precisa estar autenticado pra ver um dashboard
- Entidades 2: auth, fin, cripto
- Manipulação (CRUD) 1: visualização de dados
- PNA parcial 7

### UC9: Visualizar taxa Selic atualizada

- Interação 3: usuário interagindo com gui e api externa taxa selic
- Regras de negócio 1: usuário precisa estar autenticado pra ver um dashboard
- Entidades 2: auth, api selic
- Manipulação (CRUD) 1: visualização de dados
- PNA parcial 7

### UC10: Comparar taxas de financiamento de diferentes instituições

- Interação 3: usuário interagindo com gui e apis externas taxa de financiamento
- Regras de negócio 1: usuário precisa estar autenticado
- Entidades 2: auth, api backend taxas financiamento
- Manipulação (CRUD) 1: visualização de dados
- PNA parcial 7

### UC11: Simular financiamento

- Interação 3: usuário interagindo com gui e apis externas taxa de financiamento
- Regras de negócio 1: usuário precisa estar autenticado
- Entidades 2: auth, api backend taxas financiamento
- Manipulação (CRUD) 1: visualização de dados
- PNA parcial 7

### UC12: Salvar financiamento simulado
- Interação 3: usuário interagindo com gui e api backend taxas financiamento
- Regras de negócio 1: usuário precisa estar autenticado
- Entidades 3: auth, api backend taxas financiamento, db simulações
- Manipulação (CRUD) 2: usuário salva uma simulação de financiamento
- PNA parcial 9

### UC13: Visualizar financiamento simulado salvo
- Interação 3: usuário interagindo com gui e api backend taxas financiamento
- Regras de negócio 1: usuário precisa estar autenticado
- Entidades 2: auth, db simulações
- Manipulação (CRUD) 1: visualização de simulações salvas
- PNA parcial 7

### UC14: Remover financiamento simulado salvo
- Interação 3: usuário interagindo com gui e api backend taxas financiamento
- Regras de negócio 1: usuário precisa estar autenticado
- Entidades 2: auth, db simulações
- Manipulação (CRUD) 3: usuário remove uma simulação salva
- PNA parcial 9

## Cálculo da PUC
> para UC1, UC2, UC3, UC4, UC5, UC6
PA = PNA (soma de todos) x C (c = 1)
PA = PNA (soma de todos)
PA = 7 + 7 + 6 + 6 + 9
PA = 35

PUC = PA * 23 / 36
PUC = 22,3611111111
PUC = 23

## Esforço total

Esforço total = 23 * 8 = 184

## Custo

184 * 80 = 14.720

## Sprint 1
