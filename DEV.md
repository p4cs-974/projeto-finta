# Informações úteis
## ! IMPORTANTE

depois de instalar o bun, executem o comando `bun isntall` pra instalar todos os pacotes que o projeto precisa

## Type Safety
> Pra uma DX mais rápida e menos frustrante quando forem mexer com o typescript.

A ideia é sempre usar bibliotecas que tenham o type safety como prioridade, pra aproveitar do fato de que o TS é uma linguagem fortemente tipada, ou seja: seu código só vai rodar se os tipos estiverem corretos. Deixe o LSP e o intellisense fazerem a parte difícil de verificar a integridade dos tipos. Depois de uma alteração significativa no código, é só rodar `bun lint` no terminal pra fazer um type-check da codebase.

O código só rodar se os tipos estiverem consistentes.

## Comandos que vcs mais vão usar

### `bun lint`

Verificase o projeto tem erros de linguagem/tipos além de recomendações de melhores práticas

### `bun dev`

Rodem como `bun dev --filter backend` se quiserem rodar somente o backend, ou `bun dev --filter frontend` se quiserem rodar o frontend

## Referências das documentações das principais bibliotecas

### Backend

- [ElysiaJS](https://elysiajs.com/table-of-content.html): equivalente ao FastAPI que vimos em python
- [Bun](https://bun.com/docs): equivalente ao `pip` do python (mais parecido com o uv), ou `cargo` do rust

### Frontend

- [Shadcn](https://ui.shadcn.com/docs/): Biblioteca de componentes "pré-fabricados" que podemos usar no app. Na tab "[directory](https://ui.shadcn.com/docs/directory)" tem uma lista de outras bibliotecas construidas em cima do shadcn que são compatíveis com o nosso setup. Recomendação de bibliotecas de componentes: [motion-primitives](https://motion-primitives.com/docs), biblioteca padrão do [Shadcn](https://motion-primitives.com/docs), e [kibo-ui](https://www.kibo-ui.com/components/) –> [ticker](https://www.kibo-ui.com/components/ticker) 👀 
- [TailwindCSS](https://tailwindcss.com/docs/styling-with-utility-classes): Utilitário pra melhorar a DX pra estilização do app. CSS é feito diretamente nas páginas/componentes, com classes utilitárias pré definidas (padrão opinionado facilita nossa vida). O template que criamos na sala permite usar definições como `bg-primary` ou `color-secondary`, pra usar a paleta de cores do nosso template pra não ter que especificar as cores toda vez que for usar, ou seja, invés de sempre definir os backgrounds como `bg-[#3f44dd]`, podemos simplesmente reutilizar o `-primary`.
- [Tanstack Router](https://tanstack.com/router/latest/docs/framework/react/overview): Usado pra controlar a navegação do app (`/home`, `/dashboard`). 
- [Eden](https://elysiajs.com/eden/overview.html): lado de cliente do ElysiaJS. Facilita integração da API no nosso backend dentro do app.
