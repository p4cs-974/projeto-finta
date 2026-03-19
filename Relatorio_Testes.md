# Relatório de Testes - Lucas Roberto Boccia dos Santos

# Visualizar detalhes de indicadores de ativos

## Teste Ponta a Ponta (E2E)

O usuário, uma vez autenticado, deve poder visualizar as informações detalhadas de um ativo ao pesquisar pelo nome dele. Caso entre com uma informação inválida, o sistema deve notificar o usuário retornando uma mensagem com o problema correspondente.

### Testes de busca ideal

Uma vez que o usuário autenticado entre com um nome válido de ação ou criptomoeda, estando também com a categoria adequada para a consulta selecionada (Ação ou Cripto), o sistema retorna as informações detalhadas do ativo pesquisado.

**Teste - Busca por ação**
<img width="1189" height="322" alt="image" src="https://github.com/user-attachments/assets/4087db5e-f932-4fcb-85c6-8f2cd6be0389" />

**Teste - Busca por criptomoeda**
<img width="1198" height="331" alt="image" src="https://github.com/user-attachments/assets/dff55f1a-3ecc-4bc6-b71f-bec71c440847" />

Como pode ser visto nos testes acima, o sistema retorna a cotação e os detalhes do ativo acessando a API com base na busca do usuário.

### Testes de busca inválida

Caso o usuário entre com um nome de ativo invalido ou que não está registrado na categoria correspondente, o sistema retorna uma mensagem dizendo que o ativo não foi encontrado, ou que o formato digitado é inválido (ações devem ser digitadas no formato em que são listadas na B3, não há restrições para cripto).

**Teste - Busca por ação que não existe**
<img width="1238" height="616" alt="image" src="https://github.com/user-attachments/assets/a469d03d-b860-42fd-8d5d-6aa138fb7e8b" />

**Teste - Busca por cripto que não existe**
<img width="1235" height="563" alt="image" src="https://github.com/user-attachments/assets/f0b8cf31-1b4c-409c-b26c-04adf9309e15" />

**Teste - Busca por ação em formato inválido**
<img width="1228" height="582" alt="image" src="https://github.com/user-attachments/assets/32b29a90-cb2d-44e9-9487-759d51cb91cf" />

**Teste - Busca por nome de ação com a categoria "Cripto" selecionada**
<img width="1233" height="585" alt="image" src="https://github.com/user-attachments/assets/4e396668-99cb-40c1-a281-f2c5bd8496a7" />

**Teste - Busca por nome de criptomoeda com a categoria "Ações" selecionada**
<img width="1237" height="617" alt="image" src="https://github.com/user-attachments/assets/3148766f-732c-4abb-b616-15f113302b14" />

Como pode ser visto nos testes acima, a busca por um nome inválido de ativo retorna ao usuário a mensagem de Ativo Não Encontrado. A busca por uma ação sem seguir o formato da B3, retorna ao usuário uma mensagem de Entrada parcial ou inválida, informando-o do formato ideal. A busca por um nome de ação existente, mas com a categoria Cripto selecionada, também retorna ao usuário uma mensagem de Ativo Não Encontrado. O inverso, procurar o nome de uma cripto existente, mas com a categoria Ações selecionada, pode retornar qualquer uma das duas mensagens, a depender se o nome da cripto digitado atende ou não ao formato da B3.

## Teste de Unidade

Os testes focaram em garantir o seguimento correto das regras de negócio nos dois principais componentes de backend responsáveis pelo fluxo: o PriceQueryService (que é responsável pela consulta e cache de cotações em tempo real) e o RecentAssetSelectionService (que é responsável pela persistência do histórico do usuário).

A arquitetura foi testada em um ambiente isolado através do padrão de injeção de dependência. As chamadas reais ao banco de dados foram susbtituídas por implementações "fake" operando exclusivamente na memória RAM (InMemoryQuoteSnapshotStore e InMemoryUserAssetRepository).

### **PriceQueryService**

Para o PriceQueryService, foram validados os seguintes cenários: Retorno correto de cotação com cache vazio. Retorno imediato com o cache preenchido. Identificação de cache expirado, verificando se aciona corretamente a rotina de atualização em segundo plano (scheduleTask). Tratamento adequado quando o provedor não retorna dados para um ticker inválido. Retorno de estrutura com dados nulos quando o ativo não é encontrado. Captura (catch) e tratamento de erros técnicos padronizados quando há algum timeout ou indisponibilidade da API externa.

<img width="1472" height="669" alt="image" src="https://github.com/user-attachments/assets/3fea9351-c4bb-4f4a-851b-c3b8b92a1439" />

### **RecentAssetSelectionService**

Para o RecentAssetSelectionService, foram validados os seguintes cenários: Persistência correta de novos ativos selecionados no histórico do usuário. Atualização inteligente, modificando apenas o horário de acesso para ativos que já existem, evitando que duplique os registros. Ordenação cronológica reversa (do acesso mais recente para o mais antigo). Limitação automática do armazenamento, eliminando registros antigos e mantendo apenas as 5 consultas mais recentes no banco.

<img width="1437" height="513" alt="image" src="https://github.com/user-attachments/assets/5353757d-00fa-43c8-8e2d-dd93637066c3" />

OBS: Os códigos utilizados para os testes estão disponíveis no repositório.
