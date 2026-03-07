## Casos de uso derivados a partir do backlog

### UC1: Visualizar dashboard financeiro
- Interação 5: usuário interagindo com a interface gráfica para acessar o painel principal 3, enquanto o sistema consulta as APIs externas financeiras (1) e as APIs externas de criptomoedas (1) para reunir em uma única tela os dados financeiros necessários.
- Regras de negócio 1: usuário precisa estar autenticado pra ver o dashboard, pois essa validação garante acesso apenas a sessões válidas e protege a visualização personalizada dos dados.
- Entidades 2: usuário, ativo financeiro
- Manipulação (CRUD) 1: ler apenas
- PNA parcial 9

### UC2: Visualizar detalhes de indicadores/ativos
- Interação 4: usuário interagindo com a interface gráfica ao selecionar um indicador ou ativo (3), enquanto o sistema consulta as APIs externas (1) relevantes para recuperar os dados detalhados conforme o tipo de consulta realizada.
- Regras de negócio 1: usuário precisa estar autenticado pra ver um dashboard e também os detalhes dos ativos, mantendo consistência com o controle de acesso das funcionalidades protegidas da aplicação.
- Entidades 2: usuário, ativo financeiro
- Manipulação (CRUD) 1: visualização de dados
- PNA parcial 8

### UC3: Realizar cadastro
- Interação 3: usuário interagindo com a interface gráfica para preencher e enviar seus dados de registro (3), permitindo que o backend receba as informações necessárias para criação da conta.
- Regras de negócio 1: usuário precisa inserir dados válidos
- Entidades 1: usuário
- Manipulação (CRUD) 2: criar dados de cadastro do usuário
- PNA parcial 8

### UC4: Realizar login

- Interação 3: usuário interagindo com a interface gráfica para informar suas credenciais (3) e iniciar a solicitação de acesso ao sistema no backend.
- Regras de negócio 1: usuário precisa inserir dados válidos
- Entidades 1: usuário
- Manipulação (CRUD) 1: ler dados de usuários cadastrados
- PNA parcial 7

### UC5: Adicionar favoritos
- Interação 5: usuário interagindo com a interface gráfica para escolher um ativo e solicitar sua inclusão (3), enquanto o sistema utiliza as APIs externas financeiras e as APIs externas de criptomoedas (1+1) para identificar corretamente o item antes de salvá-lo.
- Regras de negócio 1: usuário precisa estar autenticado, pois a lista de favoritos deve ficar vinculada à conta correta e não pode ser alterada por usuários não autenticados.
- Entidades 2: usuário, ativos financeiros, lista de favoritos.
- Manipulação (CRUD) 2: usuário adiciona ativos (cripto ou ações à sua biblioteca)
- PNA parcial 10
- 
### UC6: Editar favoritos
- Interação 5: usuário interagindo com a interface gráfica para alterar informações dos ativos já salvos (3), com apoio das APIs externas financeiras (1) e das APIs externas de criptomoedas (1) quando for preciso validar ou atualizar os dados associados ao favorito.
- Regras de negócio 1: usuário precisa estar autenticado, garantindo que apenas o próprio dono possa modificar sua lista de favoritos.
- Entidades 2: usuário, ativos financeiros, lista de favoritos.
- Manipulação (CRUD) 3: usuário consegue editar ativos da sua sua bliblioteca de fvoritos
- PNA parcial 11

### UC7: Remover favoritos
- Interação 3: usuário interagindo com a interface gráfica (3) para selecionar um item salvo e solicitar sua exclusão, enquanto o sistema identifica corretamente o ativo dentro da lista persistida do usuário.
- Regras de negócio 1: usuário precisa estar autenticado, assegurando que a remoção ocorra apenas sobre dados pertencentes à própria conta.
- Entidades 2: usuário, ativos financeiros, lista de favoritos.
- Manipulação (CRUD) 1: usuário consegue deletar ativos da sua sua bliblioteca de fvoritos
- PNA parcial 7

### UC8: Consultar cotações em tempo real (ações/criptos)

- Interação 5: usuário interagindo com a interface gráfica (3) e APIs financeiras externas relevantes (1 + 1).
- Regras de negócio 1: usuário precisa estar autenticado pra ver um dashboard
- Entidades 1: usuário
- Manipulação (CRUD) 1: visualização de dados
- PNA parcial 8

### UC9: Visualizar taxa Selic atualizada

- Interação 4: usuário interagindo com a interface gráfica (3) e API externa da taxa Selic (1)
- Regras de negócio 1: usuário precisa estar autenticado pra ver um dashboard
- Entidades 1: usuário.
- Manipulação (CRUD) 1: visualização de dados
- PNA parcial 7

### UC10: Listar taxas de financiamento de diferentes instituições

- Interação 4: usuário interagindo com a interface gráfica (3) e APIs externas de taxa de financiamento (1+)
- Regras de negócio 1: usuário precisa estar autenticado
- Entidades 1: usuário
- Manipulação (CRUD) 1: visualização de dados
- PNA parcial 7

### UC11: Simular financiamento
- Interação 4: usuário interagindo com a interface gráfica (3) e APIs de taxas de financiamento (1)
- Regras de negócio 1: usuário precisa estar autenticado
- Entidades 2: usuário, lista de simulações do usuário
- Manipulação (CRUD) 2: usuário salva uma simulação de financiamento
- PNA parcial 9

### UC12: Visualizar financiamento simulado salvo
- Interação 3: usuário interagindo com a interface gráfica (3)
- Regras de negócio 1: usuário precisa estar autenticado
- Entidades 2: usuário, lista de simulações do usuário
- Manipulação (CRUD) 1: visualização de simulações salvas
- PNA parcial 7

### UC13: Remover financiamento simulado salvo
- Interação 3: usuário interagindo com a interface gráfica (3)
- Regras de negócio 1: usuário precisa estar autenticado
- Entidades 2: usuário, lista de simulações do usuário
- Manipulação (CRUD) 3: usuário remove uma simulação salva
- PNA parcial 9

## Cálculo da PUC
> para UC1, UC2, UC3, UC4, UC5, UC6

PA = PNA (soma de todos) x C (c = 1)
PA = PNA (soma de todos)
PA = 9 + 8 + 8 + 7 + 10 + 11
PA = 53

PUC = PA * 23 / 36
PUC = 33,8611111111
PUC = 34

## Esforço total

Esforço total = 34 * 8 = 272

## Custo

272 * 80 = 21.760

## Verificação do UC7

- UC7 possui PNA parcial 7.
- Se o UC7 for adicionado ao cálculo: PA = 53 + 7 = 60.
- PUC = 60 * 23 / 36 = 38,3333333333.
- Arredondando, PUC = 38.
- Esforço total com UC7 = 38 * 8 = 304.
- Como 304 > 280, o UC7 não cabe na Sprint 1.

## Sprint 1

- Visualizar dashboard financeiro
- Visualizar detalhes de indicadores/ativos
- Realizar cadastro
- Realizar login
- Adicionar favoritos
- Editar favoritos
