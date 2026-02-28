## Casos de uso derivados a partir do backlog

### UC1: Visualizar dashboard financeiro
- Interação 3: usuário interagindo com gui, api ext fin, api ext cripto
- Regras de negócio 1: usuário precisa estar autenticado pra ver o dashboard
- Entidades 2: sistema de autenticação, e api financeira backend
- Manipulação (CRUD) 1: ler apenas
- PNA parcial [COMPLEXIDADE]

### UC2: Visualizar detalhes de indicadores/ativos
- Interação 3: usuário interagindo com gui, apis externas relevantes
- Regras de negócio 1: usuário precisa estar autenticado pra ver um dashboard
- Entidades 2: auth, api backend fin, api backend cripto
- Manipulação (CRUD) 1: visualização de dados
- PNA parcial [COMPLEXIDADE]

### UC3: Realizar cadastro
- Interação 3:usuário interagindo com gui
- Regras de negócio 1: usuário precisa inserir dados válidos
- Entidades 1: api backend autenticação
- Manipulação (CRUD) 1: ler dados de usuários cadastrados
- PNA parcial [COMPLEXIDADE]

### UC4: Realizar login

- Interação 3:usuário interagindo com gui
- Regras de negócio 1: usuário precisa inserir dados válidos
- Entidades 1: api backend autenticação
- Manipulação (CRUD) 1: ler dados de usuários cadastrados
- PNA parcial [COMPLEXIDADE]

### UC6: Adicionar favoritos
- Interação 3: usuário interagindo com gui, apis externas fin e cripto
- Regras de negócio 1: usuário precisa estar autenticado
- Entidades 3: auth, api backend fin, api backend cripto, db favoritos
- Manipulação (CRUD) 2: usuário adiciona ativos (cripto ou ações à sua biblioteca)
- PNA parcial [COMPLEXIDADE]
- 
### UC6: Editar favoritos
- Interação 3: usuário interagindo com gui, apis externas fin e cripto
- Regras de negócio 1: usuário precisa estar autenticado
- Entidades 3: auth, api fin, api backend cripto, db backend favoritos
- Manipulação (CRUD) 3: usuário consegue editar ativos da sua sua bliblioteca de fvoritos
- PNA parcial [COMPLEXIDADE]

### UC6: Remover favoritos
- Interação 3: usuário interagindo com gui, apis externas fin e cripto
- Regras de negócio 1: usuário precisa estar autenticado
- Entidades 3: auth, api backend fin, api backend cripto, db favoritos
- Manipulação (CRUD) 1: usuário consegue deletar ativos da sua sua bliblioteca de fvoritos
- PNA parcial [COMPLEXIDADE]

### UC9: Consultar cotações em tempo real (ações/criptos)

- Interação 3: usuário interagindo com gui
- Regras de negócio 1: usuário precisa estar autenticado pra ver um dashboard
- Entidades 2: auth, fin, cripto
- Manipulação (CRUD) 1: visualização de dados
- PNA parcial [COMPLEXIDADE]

### UC10: Visualizar taxa Selic atualizada

- Interação 3: **alterar**usuário interagindo com gui
- Regras de negócio 1: usuário precisa estar autenticado pra ver um dashboard
- Entidades 2: auth, api selic
- Manipulação (CRUD) 1: visualização de dados
- PNA parcial [COMPLEXIDADE]

### UC11: Comparar taxas de financiamento de diferentes instituições

- Interação 3: **alterar**usuário interagindo com gui
- Regras de negócio 1: usuário precisa estar autenticado
- Entidades 2: auth, api taxas financiamento
- Manipulação (CRUD) 1: visualização de dados
- PNA parcial [COMPLEXIDADE]

### simular financiamento

- Interação 3: **alterar**usuário interagindo com gui
- Regras de negócio 1: usuário precisa estar autenticado
- Entidades 2: auth, api taxas financiamento
- Manipulação (CRUD) 1: visualização de dados
- PNA parcial [COMPLEXIDADE]
