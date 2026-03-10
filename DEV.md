# Informações úteis
## ! IMPORTANTE

depois de instalar o pnpm, executem o comando `pnpm install` na raiz pra instalar todos os pacotes do monorepo

## Type Safety
> Pra uma DX mais rápida e menos frustrante quando forem mexer com o typescript.

A ideia é sempre usar bibliotecas que tenham o type safety como prioridade, pra aproveitar do fato de que o TS é uma linguagem fortemente tipada, ou seja: seu código só vai rodar se os tipos estiverem corretos. Deixe o LSP e o intellisense fazerem a parte difícil de verificar a integridade dos tipos. Depois de uma alteração significativa no código, é só rodar `pnpm check` ou `pnpm lint` no terminal pra verificar a codebase.

O código só rodar se os tipos estiverem consistentes.

## Comandos que vcs mais vão usar

### `pnpm lint`

Verificase o projeto tem erros de linguagem/tipos além de recomendações de melhores práticas

### `pnpm dev`

Rodem como `pnpm dev --filter backend-cloudflare` se quiserem rodar somente o backend, ou `pnpm dev --filter frontend-cloudflare` se quiserem rodar o frontend

## Referências das documentações das principais bibliotecas

### Backend

- [pnpm](https://pnpm.io/): package manager do monorepo
- [Cloudflare Workers](https://developers.cloudflare.com/workers/): plataforma de execucao do backend
- [D1](https://developers.cloudflare.com/d1/): banco de dados serverless do backend

### Frontend

- [Shadcn](https://ui.shadcn.com/docs/): Biblioteca de componentes "pré-fabricados" que podemos usar no app. Na tab "[directory](https://ui.shadcn.com/docs/directory)" tem uma lista de outras bibliotecas construidas em cima do shadcn que são compatíveis com o nosso setup. Recomendação de bibliotecas de componentes: [motion-primitives](https://motion-primitives.com/docs), biblioteca padrão do [Shadcn](https://motion-primitives.com/docs), e [kibo-ui](https://www.kibo-ui.com/components/) –> [ticker](https://www.kibo-ui.com/components/ticker) 👀 
- [TailwindCSS](https://tailwindcss.com/docs/styling-with-utility-classes): Utilitário pra melhorar a DX pra estilização do app. CSS é feito diretamente nas páginas/componentes, com classes utilitárias pré definidas (padrão opinionado facilita nossa vida). O template que criamos na sala permite usar definições como `bg-primary` ou `color-secondary`, pra usar a paleta de cores do nosso template pra não ter que especificar as cores toda vez que for usar, ou seja, invés de sempre definir os backgrounds como `bg-[#3f44dd]`, podemos simplesmente reutilizar o `-primary`.
- [Next.js](https://nextjs.org/docs): framework do frontend
- [OpenNext Cloudflare](https://opennext.js.org/cloudflare): adapter de build/deploy do frontend para Workers
