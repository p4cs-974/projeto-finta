# Decisões de reuso

## bun

### Análise técnica

O bun é um runtime de javascript all-in-one, substitui o node.js e o npm em uma única ferramenta. Bun tem startup mais rápido e consome menos memória, o gerenciador de pacotes é compativel com formato padrão (node_modules e package.json)

### Análise arquitetural

Centralizar o runtime e o package manager em uma única ferramenta elimina problemas de versão de pacotes entre ferramentas diferentes. A confogiração de workspaces atual permite o compartilhamento de dependências entre os apps do repositório (frontend/backend)  automaticamente.

## turborepo

### Análise técnica

O turborepo é um sistema de build orchestration que implementa pipelines de build. O arquivo turbo.json defini o pipeline com `dependsOn` (dependência entre tasks para determinar sequência) e `outputs` (artefatos de cache). O cache é armazenado em .turbo/cache

### Análise arquitetural

O pipeline de builds garante que os pacotes sejam compilados na ordem correta de dependênca, permitindo, por ex., que os pacotes dentro de `packages/`  sejam compilados antes de serem consumidos pelos apps.

## linting

### Análise técnica
o ESLint analisa código em busca de padrões problemáticos, no projeto, está configurado para definir regras padronizadas de código para typescript e react.

### Análise arquitetural

A configuração centralizada garante que todas as aplicações do repositório (backend/frontend) sigam as mesmas convenções de código. A integração com o pipeline do turborepo garante uma verificação consistente em todo o repositório para evitar inconsistências de tipo e merges inválidos.

## Vercel

### Análise técnica

O vercel é uma plataforma de deploy e cloud compute, que tem pipeline de build integrado com frameworks (zero configuração necessária pra frameworks conhecidos). O arquivo `vercel.json` permite configurar build e deploy do projeto na nuvem deles.

### Análise arquitetural

Vercel tira da equipe a necessidade de configurar servidores, certificados, roteamento, permitindo que o time foque apenas no código. A integração com o git permite deploys automáticos de preview para pull requests, e de produção pra alterações na branch main.

## Componentes de UI

### Análise técnica

O grupo está usando ShadCN + tailwindcss pra criar e estilizar componentes. Cada componente é tipado com TypeScript, e exporta um componente com todas as suas variantes, podendo ser facilmente customizados e reutilizados.

### Análise arquitetural

Os componentes (`apps/frontend/src/components/ui/`) compõem uma biblioteca de componentes reutilizáveis.

## Estilização compartilhada (TailwindCSS)

### Análise técnica

Estilização baseada em tokens implementada através de variáveis de propriedades customizadas de CSS. O arquivo `index.css` define tokes semânticos (como `--primary`para a cor primária da paleta de cores do projeto, por exemplo). O tema suporta dark mode via classe `.dark` que redefine os tokens.

### Análise arquitetural

Ao invés de valores hard-coded espalhados pelo projeto, todas as cores, espaçamento e tipografia são referenciados usando as classes utilitárias do Tailwind, o que permite consistência, manutenção facil, temas (light/dark).
