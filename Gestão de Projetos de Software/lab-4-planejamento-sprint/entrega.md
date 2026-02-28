## Casos de uso derivados a partir do backlog

### UC1: Visualizar dashboard financeiro

- Interação 3: **alterar**usuário interagindo com gui
- Regras de negócio 1: usuário precisa estar autenticado pra ver um dashboard
- Entidades 2: **rev**sistema de autenticação, e apis financeiras
- Manipulação (CRUD) 1: ler apenas
- PNA parcial [COMPLEXIDADE]: [JUSTIFICATIVA DA COMPLEXIDADE]

### UC3: Visualizar detalhes de indicadores/ativos

- Interação 3: **alterar**usuário interagindo com gui
- Regras de negócio 1: usuário precisa estar autenticado pra ver um dashboard
- Entidades 2: auth, api fin, api cripto
- Manipulação (CRUD) 1: visualização de dados
- PNA parcial [COMPLEXIDADE]: [JUSTIFICATIVA DA COMPLEXIDADE]

### UC4: Autenticar usuário
> separar em cadastro e login

- Interação 3: **alterar**usuário interagindo com gui
- Regras de negócio 1: usuário precisa inserir dadis válidos
- Entidades 1: autenticação
- Manipulação (CRUD) 1: ler dados de usuários cadastrados
- PNA parcial [COMPLEXIDADE]: [JUSTIFICATIVA DA COMPLEXIDADE]

### UC6: Gerenciar favoritos
> quebrar em histórias/casos de uso separados pra add/ver/editar
- Interação 3: **alterar**usuário interagindo com gui
- Regras de negócio 1: usuário precisa estar autenticado
- Entidades 3: auth, api fin, api cripto, db favoritos
- Manipulação (CRUD) 3: usuário consegue editar, criar, deletar e ler ativos da sua sua bliblioteca de fvoritos
- PNA parcial [COMPLEXIDADE]: [JUSTIFICATIVA DA COMPLEXIDADE]

### UC9: Consultar cotações em tempo real (ações/criptos)

- Interação 3: **alterar**usuário interagindo com gui
- Regras de negócio 1: usuário precisa estar autenticado pra ver um dashboard
- Entidades 2: auth, fin, cripto
- Manipulação (CRUD) 1: visualização de dados
- PNA parcial [COMPLEXIDADE]: [JUSTIFICATIVA DA COMPLEXIDADE]

### UC10: Visualizar taxa Selic atualizada

- Interação 3: **alterar**usuário interagindo com gui
- Regras de negócio 1: usuário precisa estar autenticado pra ver um dashboard
- Entidades 2: auth, api selic
- Manipulação (CRUD) 1: visualização de dados
- PNA parcial [COMPLEXIDADE]: [JUSTIFICATIVA DA COMPLEXIDADE]

### UC11: Comparar taxas de financiamento em diferentes instituições

- Interação 3: **alterar**usuário interagindo com gui
- Regras de negócio 1: usuário precisa estar autenticado
- Entidades 2: auth, api taxas financiamento
- Manipulação (CRUD) 1: visualização de dados
- PNA parcial [COMPLEXIDADE]: [JUSTIFICATIVA DA COMPLEXIDADE]

### simular financiamento
