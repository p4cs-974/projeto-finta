## Casos de uso derivados a partir do backlog

### UC1: Visualizar dashboard financeiro
- Interação 3: usuário interagindo com a interface gráfica para acessar o painel principal, enquanto o sistema consulta as APIs externas financeiras e as APIs externas de criptomoedas para reunir em uma única tela os dados financeiros necessários.
- Regras de negócio 1: usuário precisa estar autenticado pra ver o dashboard, pois essa validação garante acesso apenas a sessões válidas e protege a visualização personalizada dos dados.
- Entidades 2: sistema de autenticação, necessário para validar a sessão do usuário, e api financeira backend, necessária para intermediar a coleta, organização e entrega das informações vindas das fontes externas.
- Manipulação (CRUD) 1: ler apenas
- PNA parcial 7

### UC2: Visualizar detalhes de indicadores/ativos
- Interação 3: usuário interagindo com a interface gráfica ao selecionar um indicador ou ativo, enquanto o sistema consulta as APIs externas relevantes para recuperar os dados detalhados conforme o tipo de consulta realizada.
- Regras de negócio 1: usuário precisa estar autenticado pra ver um dashboard e também os detalhes dos ativos, mantendo consistência com o controle de acesso das funcionalidades protegidas da aplicação.
- Entidades 2: sistema de autenticação, que controla o acesso do usuário autenticado, API backend financeira, responsável pelos dados de ativos financeiros tradicionais, e API backend de criptomoedas, responsável pelos dados específicos de criptoativos.
- Manipulação (CRUD) 1: visualização de dados
- PNA parcial 7

### UC3: Realizar cadastro
- Interação 3: usuário interagindo com a interface gráfica para preencher e enviar seus dados de registro, permitindo que o backend receba as informações necessárias para criação da conta.
- Regras de negócio 1: usuário precisa inserir dados válidos
- Entidades 1: API backend de autenticação, responsável por validar os dados informados, verificar a consistência do cadastro e registrar a nova conta no sistema.
- Manipulação (CRUD) 1: ler dados de usuários cadastrados
- PNA parcial 6

### UC4: Realizar login

- Interação 3: usuário interagindo com a interface gráfica para informar suas credenciais e iniciar a solicitação de acesso ao sistema.
- Regras de negócio 1: usuário precisa inserir dados válidos
- Entidades 1: API backend de autenticação, necessária para conferir as credenciais recebidas e liberar uma sessão válida para uso das funcionalidades autenticadas.
- Manipulação (CRUD) 1: ler dados de usuários cadastrados
- PNA parcial 6

### UC5: Adicionar favoritos
- Interação 3: usuário interagindo com a interface gráfica para escolher um ativo e solicitar sua inclusão, enquanto o sistema utiliza as APIs externas financeiras e as APIs externas de criptomoedas para identificar corretamente o item antes de salvá-lo.
- Regras de negócio 1: usuário precisa estar autenticado, pois a lista de favoritos deve ficar vinculada à conta correta e não pode ser alterada por usuários não autenticados.
- Entidades 3: sistema de autenticação, necessário para identificar o dono da lista, API backend financeira e API backend de criptomoedas, necessárias para recuperar os dados do ativo selecionado, e banco de dados de favoritos, necessário para persistir os itens salvos.
- Manipulação (CRUD) 2: usuário adiciona ativos (cripto ou ações à sua biblioteca)
- PNA parcial 9
- 
### UC6: Editar favoritos
- Interação 3: usuário interagindo com a interface gráfica para alterar informações dos ativos já salvos, com apoio das APIs externas financeiras e das APIs externas de criptomoedas quando for preciso validar ou atualizar os dados associados ao favorito.
- Regras de negócio 1: usuário precisa estar autenticado, garantindo que apenas o próprio dono possa modificar sua lista de favoritos.
- Entidades 3: sistema de autenticação, que valida a autorização da operação, API backend financeira e API backend de criptomoedas, que apoiam a identificação dos ativos monitorados, e banco de dados backend de favoritos, onde as alterações realizadas são registradas.
- Manipulação (CRUD) 3: usuário consegue editar ativos da sua sua bliblioteca de fvoritos
- PNA parcial 10

### UC7: Remover favoritos
- Interação 3: usuário interagindo com a interface gráfica para selecionar um item salvo e solicitar sua exclusão, enquanto o sistema identifica corretamente o ativo dentro da lista persistida do usuário.
- Regras de negócio 1: usuário precisa estar autenticado, assegurando que a remoção ocorra apenas sobre dados pertencentes à própria conta.
- Entidades 3: sistema de autenticação, necessário para validar a permissão da operação, API backend financeira e API backend de criptomoedas, que representam as origens dos ativos acompanhados, e banco de dados de favoritos, onde o item removido deixa de ser persistido.
- Manipulação (CRUD) 1: usuário consegue deletar ativos da sua sua bliblioteca de fvoritos
- PNA parcial 8

### UC8: Consultar cotações em tempo real (ações/criptos)

- Interação 3: usuário interagindo com a interface gráfica e APIs financeiras externas relevantes
- Regras de negócio 1: usuário precisa estar autenticado pra ver um dashboard
- Entidades 2: sistema de autenticação, API financeira e API de criptomoedas
- Manipulação (CRUD) 1: visualização de dados
- PNA parcial 7

### UC9: Visualizar taxa Selic atualizada

- Interação 3: usuário interagindo com a interface gráfica e API externa da taxa Selic
- Regras de negócio 1: usuário precisa estar autenticado pra ver um dashboard
- Entidades 2: sistema de autenticação e API da taxa Selic
- Manipulação (CRUD) 1: visualização de dados
- PNA parcial 7

### UC10: Comparar taxas de financiamento de diferentes instituições

- Interação 3: usuário interagindo com a interface gráfica e APIs externas de taxa de financiamento
- Regras de negócio 1: usuário precisa estar autenticado
- Entidades 2: sistema de autenticação e API backend de taxas de financiamento
- Manipulação (CRUD) 1: visualização de dados
- PNA parcial 7

### UC11: Simular financiamento

- Interação 3: usuário interagindo com a interface gráfica e APIs externas de taxa de financiamento
- Regras de negócio 1: usuário precisa estar autenticado
- Entidades 2: sistema de autenticação e API backend de taxas de financiamento
- Manipulação (CRUD) 1: visualização de dados
- PNA parcial 7

### UC12: Salvar financiamento simulado
- Interação 3: usuário interagindo com a interface gráfica e API backend de taxas de financiamento
- Regras de negócio 1: usuário precisa estar autenticado
- Entidades 3: sistema de autenticação, API backend de taxas de financiamento e banco de dados de simulações
- Manipulação (CRUD) 2: usuário salva uma simulação de financiamento
- PNA parcial 9

### UC13: Visualizar financiamento simulado salvo
- Interação 3: usuário interagindo com a interface gráfica e API backend de taxas de financiamento
- Regras de negócio 1: usuário precisa estar autenticado
- Entidades 2: sistema de autenticação e banco de dados de simulações
- Manipulação (CRUD) 1: visualização de simulações salvas
- PNA parcial 7

### UC14: Remover financiamento simulado salvo
- Interação 3: usuário interagindo com a interface gráfica e API backend de taxas de financiamento
- Regras de negócio 1: usuário precisa estar autenticado
- Entidades 2: sistema de autenticação e banco de dados de simulações
- Manipulação (CRUD) 3: usuário remove uma simulação salva
- PNA parcial 9

## Cálculo da PUC
> para UC1, UC2, UC3, UC4, UC5, UC6, UC7

PA = PNA (soma de todos) x C (c = 1)
PA = PNA (soma de todos)
PA = 7 + 7 + 6 + 6 + 9 + 10 + 8
PA = 53

PUC = PA * 23 / 36
PUC = 33,8611111111
PUC = 34

## Esforço total

Esforço total = 34 * 8 = 272

## Custo

272 * 80 = 21.760

## Sprint 1

- Visualizar dashboard financeiro
- Visualizar detalhes de indicadores/ativos
- Realizar cadastro
- Realizar login
- Adicionar favoritos
- Editar favoritos
- Remover favoritos
