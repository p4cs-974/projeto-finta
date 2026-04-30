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

Para o RecentAssetSelectionService, foram validados os seguintes cenários: Persistência correta de novos ativos selecionados no histórico do usuário. Atualização inteligente, modificando apenas o horário de acesso para ativos que já existem, evitando que duplique os registros. Ordenação croO HEARTS, inclusive, acontece todo ano. Podemos ir aprimorando o currículo e a carta para aplicar ano que vem e nos anos subsequentes (posso aplicar até terminar o mestrado). Eu conversei bastante com a minha orientadora ontem, e ela me disse que as frustrações da vida são para eu aprender, melhorar, e entender que nem tudo na vida cai no nosso colo, que precisa-se lutar muito para algumas coisas. É óbvio que o que eu vivi na escola não foram frustrações, foi um abuso institucional e pessoal direcionado (eu nunca contei para ela sobre isso), mas, de agora em diante, quero levar essas frustrações acadêmicas como aprendizados, e me sentir mais feliz pelos que foram aprovados do que triste por eu não ter sido (mas claro, aceitando que ficar triste também faz parte e é normal). nológica reversa (do acesso mais recente para o mais antigo). Limitação automática do armazenamento, eliminando registros antigos e mantendo apenas as 5 consultas mais recentes no banco.

<img width="1437" height="513" alt="image" src="https://github.com/user-attachments/assets/5353757d-00fa-43c8-8e2d-dd93637066c3" />

OBS: Os códigos utilizados para os testes estão disponíveis no repositório.

# Adicionar Favoritos

## Teste Ponta a Ponta (E2E)

O usuário, após pesquisar por um ativo ou acessá-lo do cache, deve ser capaz de favoritar o artigo clicando no botão "Favoritar". O botão se encontra no canto direito dos detalhes do ativo, possuindo um texto com o ícone de uma estrela ao lado. Ao clicar no botão, o ícone e o texto ficam verdes (indicando que o processo foi concluído com sucesso) e o ativo é adicionado à lista de favoritos. A lista de favoritos possui filtros de visualização, caso o usuário deseje checar apenas as ações favoritadas, apenas as criptos favoritadas, ou todos os ativos favoritados.

### Teste - Busca por uma ação ainda não favoritada

<img width="1105" height="305" alt="image" src="https://github.com/user-attachments/assets/147609f9-015e-4084-b49a-748fea9f5066" />

### Teste - Estado da ação após clicar no botão de Favoritar, com o texto e o ícone de estrela terem sido alterados para verde, indicando sucesso.

<img width="1122" height="284" alt="image" src="https://github.com/user-attachments/assets/b9ae5df3-f774-490e-b25f-f6e57018adfb" />

### Teste - Ação adicionada na lista de favoritos, com o filtro de visualização "Todos" selecionado

<img width="737" height="191" alt="image" src="https://github.com/user-attachments/assets/3fc1dd34-0260-437c-8f72-a855cde44a08" />

### Teste - Busca por uma criptomoeda ainda não favoritada

<img width="1120" height="277" alt="image" src="https://github.com/user-attachments/assets/4298ce51-c43c-46a5-b49e-150a06018921" />

### Teste - Estado da criptomoeda após clicar no botão de favoritar, com o texto e o ícone de estrela terem sido alterados para verde, indicando sucesso.

<img width="1123" height="275" alt="image" src="https://github.com/user-attachments/assets/e05078aa-0920-4ce6-89c5-903806bd40f1" />

### Teste - Criptomoeda adicionada na lista de favoritos, com o filtro de visualização "Todos" selecionado

<img width="725" height="257" alt="image" src="https://github.com/user-attachments/assets/35be0b2d-9b94-42b8-b1e1-1bc10154faf5" />

### Teste - Lista de favoritos somente com o filtro "Ações" selecionado

<img width="730" height="187" alt="image" src="https://github.com/user-attachments/assets/79d0b6fe-10c2-42bf-aee6-1efa066ce3dc" />

### Teste - Lista de favoritos somente com o filtro "Criptos" selecionado

<img width="730" height="187" alt="image" src="https://github.com/user-attachments/assets/e22b74b6-4920-4309-af17-f346dfa7d449" />

Como pode ser visto nas imagns acima, a busca por ativos não favoritados mostra os detalhes do tal ativo com o botão de favoritar em seu estado original. Ao clicar no ícone de estrela, os ativos são adicionados à lista de favoritos. A lista mostra todos os ativos favoritados, podendo o usuário filtrar qual tipo de ativo deseja ver.

# Editar Favoritos

## Teste Ponta a Ponta (E2E)

O usuário que possua ativos favoritados deve poder removê-los da sua lista de favoritos a qualquer momento, clicando no ícone de estrela ao lado de cada ativo (que fica vermelho ao passar com o ponteiro do mouse por cima) localizado na página de Favoritos.

Partindo dos favoritados adicionados na etapa anterior de testes (adicionar favoritos):

### Teste - Estado inicial da lista de favoritos antes das remoções, mostrando a estrela vermelha quando se passa com o ponteiro do mouse por cima

<img width="633" height="220" alt="image" src="https://github.com/user-attachments/assets/1a076ed5-7b13-4d6d-8a85-53c87897cd6a" />

### Teste - Estado da lista de favoritos após clicar no ícone da estrela e remover a criptomoeda BTC da lista

<img width="734" height="198" alt="image" src="https://github.com/user-attachments/assets/6b92ad4d-8eee-4a44-86c5-2eeb2696dad4" />

### Teste - Categoria "Critpos" atualizada após a remoção da criptomoeda BTC da lista

<img width="734" height="204" alt="image" src="https://github.com/user-attachments/assets/5430ef52-5197-48f4-a9f5-9f3ac9f169ce" />

### Teste - Remoção da ação PETR4 da lista de favoritos

<img width="639" height="171" alt="image" src="https://github.com/user-attachments/assets/63128ace-ac00-42da-a9b6-c62a7306daf4" />

### Teste - Estado da lista de favoritos após remoção da ação PETR4, mostrando a lista de favoritos vazia

<img width="749" height="227" alt="image" src="https://github.com/user-attachments/assets/bee01c06-c603-4698-a626-1902c6ec775b" />

Como pode ser visto nas imagens acima, o botão com o ícone de estrela responsável por fazer a remoção de um ativo dos favoritos altera a cor para vermelho quando o ponteiro do mouse é passado por cima. Ao clicar nele, o ativo é removido e a lista é atualizada, mostrando apenas os ativos ainda marcados como favorito. Vale notar que a contagem ao lado dos filtros também é atualizada conforme as remoções ocorrem. Quando todos os ativos são removidos, é exibida a mensagem de que a lista está vazia, dando ao usuário a opção de ir para a tela de busca.


