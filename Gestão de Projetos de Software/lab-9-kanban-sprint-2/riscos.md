## Impedimentos da sprint 1

### Dependência entre tarefas

Antes de iniciar a sprint 1, não foi levado em consideração o fato de que tarefas poderiam ser "bloqueadas" por outras tarefas, fazendo com que tickets ficassem "parados" esperando que outros tickets fossem resolvidos.

### Preparação do ambiente de desenvolvimento

Ao longo do desenvolvimento da string 1, em alguns momentos houve "travamento" das atividades por problemas de instalação de pacotes necessário e configurações de variáveis de ambiente.

## Possíveis riscos da sprint 2

### Incompatibilidade entre sistemas operacionais

A sprint 2 gira ao redor de implementar uma CLI (*Command Line Interface*), ou seja, um programa que é executado no terminal. Isso pode apresentar incompatibilidade entre Windows, macOS e linux.

### Risco de integração externa

O serviço de consulta de cotações depende de APIs externas, sujeito à disponibilidade desses serviços.

### Risco de validação e tratamento de erros na CLI

Como a sprint 2 envolve funcionalidades executadas por linha de comando, existe o risco de entradas inválidas, parâmetros incorretos ou falhas nas respostas das APIs não serem tratados adequadamente. Isso pode gerar erros durante a execução, dificultar os testes e comprometer a experiência do usuário.
