# TESTE DASHBOARD FINANCEIRO

O usuário, uma vez autenticado, deve conseguir visualizar o dashboard financeiro, conforme as imagens abaixo.

<p align="center">
  <img src="https://github.com/user-attachments/assets/85eccee0-4cbc-4942-a164-855b3ddbf67a" width="45%" />
  <img src="https://github.com/user-attachments/assets/12699365-2d5b-4ea2-94a9-80e4b15ab5ab" width="45%" />
</p> 


A imagem da esquerda é de um usuário que acabou de criar uma conta, enquanto a da direita é de um usuário já ativo. Observando-as, podemos notar que ambas apresentam o ranking das cotações que mais valorizaram e das cotações que mais desvalorizaram, além dos botões de dashboard, buscar, favoritos e sair na parte superior da tela. Contudo, as principais diferenças estão no “buscar recente”, que fica salvo quando o usuário já possui uma conta ativa e permanece vazio quando o usuário é novo no aplicativo. Além disso, a quantidade de “favoritos”, “buscas hoje” e “visualizações hoje” também fica salva quando o usuário já tem conta e permanece vazia quando o usuário é novo no app.

### TESTE Botao "Buscar Ativos" e "Ver Favoritos"

Para usuários novos, ao clicar no botão “Buscar ativos”, o sistema deve redirecioná-los automaticamente para a tela de busca. Nessa tela, o usuário poderá pesquisar os ativos desejados, iniciando assim sua interação com as funcionalidades do dashboard financeiro.
Para usuários novos, ao clicar no botão “Ver favoritos”, o sistema deve redirecioná-los automaticamente para a tela de favoritos. Nessa tela, o usuário poderá visualizar os ativos que marcou como favoritos ao longo da utilização da aplicação.

<img width="934" height="242" alt="image" src="https://github.com/user-attachments/assets/7db0f07b-6756-401e-971f-71a692214b87" />
<p align="center">
  <img src="https://github.com/user-attachments/assets/2e0e1bc3-c99c-4823-bf1c-609b0ffd2cda" width="49%" />
  <img src="https://github.com/user-attachments/assets/245d47bb-986a-4b46-9825-d9b5c6a6c42d" width="49%" />
</p>

### TESTE Botao "Ir para a busca"

Ao acessar a lista de favoritos, caso ela esteja vazia, o usuário poderá clicar no botão “Ir para a busca”, que o redirecionará para a página de busca.

<p align="center">
  <img src="https://github.com/user-attachments/assets/245d47bb-986a-4b46-9825-d9b5c6a6c42d" width="49%" />
  <img src="https://github.com/user-attachments/assets/2e0e1bc3-c99c-4823-bf1c-609b0ffd2cda" width="49%" />
</p>

### TELA DASHBOARD
Quando uma busca é realizada na tela de busca, o contador de “Buscas hoje” é atualizado, e a tela do dashboard, na aba de “Atividade recente”, também é atualizada com a ação realizada.

<p align="center"> <img src="https://github.com/user-attachments/assets/ec2bbc92-5521-4dad-aef4-ecc9b8cfa91e" width="49%" /> <img src="https://github.com/user-attachments/assets/6d1ea9cd-599c-4a0b-a0db-d3cdb9409c4a" width="49%" /> </p>



Quando uma ação ou criptomoeda é visualizada, o contador de “Visualizações hoje” é atualizado, o “Buscar recente” também é atualizado e a aba de “Atividade recente” registra a ação realizada.

<p align="center"> <img src="https://github.com/user-attachments/assets/ec2bbc92-5521-4dad-aef4-ecc9b8cfa91e" width="49%" /> <img src="https://github.com/user-attachments/assets/6d1ea9cd-599c-4a0b-a0db-d3cdb9409c4a" width="49%" /> </p>



Quando uma ação ou criptomoeda é favoritada, o contador de “Favoritos” é atualizado, e a tela do dashboard, na aba de “Atividade recente”, também é atualizada com a ação realizada.

<img width="1328" height="678" alt="image" src="https://github.com/user-attachments/assets/0f5d6323-f25d-4715-ab9b-1a7ce3da5457" />



Quando uma ação ou criptomoeda é removida dos favoritos, o contador de “Favoritos” é atualizado, e a tela do dashboard, na aba de “Atividade recente”, também é atualizada com a ação realizada.

<img width="1325" height="686" alt="image" src="https://github.com/user-attachments/assets/0c84efe2-7c70-429a-96ba-91c61d911f73" />


# AÇÃO NO BUSCAR RECENTE

Ao clicar em uma ação que está no “Buscar recente”, o usuário será direcionado para a página da ação selecionada, e a visualização será registrada na aba de “Atividade recente”.

<img width="1325" height="679" alt="image" src="https://github.com/user-attachments/assets/da82c4d7-bb66-4c91-91fb-df6525b1f835" /> <p align="center"> <img src="https://github.com/user-attachments/assets/116779a1-5339-43a7-88c1-1528c87470e4" width="49%" /> <img src="https://github.com/user-attachments/assets/cce5d667-382b-47f2-8568-a912d0f91ca9" width="49%" /> </p>

# BOTÃO DASHBOARD / BUSCAR / FAVORITOS / SAIR
<img width="1290" height="69" alt="image" src="https://github.com/user-attachments/assets/e5ea145e-37cf-48e7-baae-6ed69985ade8" />

Ao clicar no botão “Dashboard”, o usuário será direcionado para a tela de dashboard.
<img width="1327" height="681" alt="image" src="https://github.com/user-attachments/assets/d99931e7-8372-4ea1-8002-624c785e4268" />



Ao clicar no botão “Buscar”, o usuário será direcionado para a tela de busca.
<img width="1326" height="685" alt="image" src="https://github.com/user-attachments/assets/c3bf17e7-94d0-42ba-953b-428049775ad3" />



Ao clicar no botão “Favoritos”, o usuário será direcionado para a tela de favoritos.<img width="1324" height="681" alt="image" src="https://github.com/user-attachments/assets/a74cdedb-282e-4e53-bbec-341c9d38c20f" />



Ao clicar no botão “SAIR”, o usuário será direcionado para a tela de login.
<img width="1328" height="721" alt="image" src="https://github.com/user-attachments/assets/99216024-365f-4acd-93ca-95d2a4239f80" />
