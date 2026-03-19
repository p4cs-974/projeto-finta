# Regras de Negócio

O usuário precisa estar logado para realizar a consulta da cotação das ações.

O valor das ações deve ser exibido em reais (BRL).

As ações devem estar cadastradas na bolsa de valores B3.

# Requisitos Não Funcionais

O sistema do FINTA estará disponível 99.9% do tempo (com 0.1% destinado à manutenção e tratamento de erros), com certas funcionalidades estando sujeitas à disponibilidade da API externa responsável.

O tempo de repsosta total (do clique do usuário até exibição da cotação) não deve ultrapassar meio segundo em 95% das requisições.

Devido à natureza de webapp do FINTA, a consulta à cotação das ações pode ser realizada a partir de qualquer navegador moderno com acesso à internet.

A autenticação de usuário, responsável pela segurança de acesso ao sistema, é baseada em JWT, com os dados sendo guardados no banco de dados Cloudfare D1.

As consultas do sistema à APIs externas ocorrem de forma direta por meio de HTTP, não dependendo de nenhum outro mediador.
