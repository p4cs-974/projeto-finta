# Entrega 1 - Modelagem (Cheesman & Daniels)

## Escopo e premissas

- Escopo funcional validado:
  - Consultar preço do Bitcoin.
  - Consultar preço de carro na Tabela FIPE.
  - Adicionar ação à biblioteca (ex.: Google).
  - Cadastro de usuário (sem caso de uso de login nesta entrega).
- Ator primário: `Usuário`.
- Sistemas externos:
  - API de mercado financeiro.
  - API FIPE.
- Persistência da biblioteca do usuário no cliente (`localStorage`).
- Arquitetura alvo: `Frontend Web (Next/React) + Backend API (Elysia/Bun)`.

## 1) Diagrama de Casos de Uso

![Diagrama de Casos de Uso](/Users/pedro/Faculdade/topicos-avancados-eng-software/projeto-finta/Tópicos Avançados de Engenharia de Software/lab-3/diagrams/casos-de-uso.png)

Arquivo fonte: [casos-de-uso.puml](/Users/pedro/Faculdade/topicos-avancados-eng-software/projeto-finta/Tópicos Avançados de Engenharia de Software/lab-3/diagrams/casos-de-uso.puml)

## 2) Descrição dos 3 Casos de Uso principais

### UC-01 - Consultar preço do Bitcoin

- Objetivo: permitir que o usuário obtenha a cotação atual do Bitcoin.
- Atores: `Usuário` (primário), `API Mercado Financeiro` (secundário).
- Pré-condições: sistema disponível; integração com API de mercado ativa.
- Fluxo principal:
  1. Usuário solicita consulta de preço do Bitcoin.
  2. Frontend envia requisição ao Backend.
  3. Backend consulta a API de mercado financeiro.
  4. Backend normaliza o payload e retorna ao Frontend.
  5. Frontend exibe preço, data/hora da cotação e fonte.
- Fluxos alternativos:
  - API externa indisponível: Backend retorna erro técnico padronizado.
  - Timeout: Backend retorna fallback de indisponibilidade temporária.
- Pós-condições: cotação exibida ao usuário ou mensagem de falha registrada.

### UC-02 - Consultar preço de carro na Tabela FIPE

- Objetivo: permitir consulta de preço de referência FIPE por veículo.
- Atores: `Usuário` (primário), `API FIPE` (secundário).
- Pré-condições: dados mínimos do veículo informados (`marca`, `modelo`, `ano`).
- Fluxo principal:
  1. Usuário informa marca, modelo e ano.
  2. Frontend chama Backend com os parâmetros.
  3. Backend consulta a API FIPE.
  4. Backend valida e mapeia resultado para contrato interno.
  5. Frontend apresenta valor FIPE e metadados da consulta.
- Fluxos alternativos:
  - Veículo não encontrado: retorno de resultado vazio com mensagem orientativa.
  - API FIPE indisponível: retorno de erro técnico padronizado.
- Pós-condições: valor FIPE exibido ou falha comunicada de forma consistente.

### UC-03 - Adicionar ação à biblioteca (ex.: Google)

- Objetivo: permitir salvar um ativo de interesse na biblioteca pessoal (exemplo: ação do Google).
- Atores: `Usuário` (primário), `API Mercado Financeiro` (secundário).
- Pré-condições: usuário cadastrado (cadastro simples); navegador com armazenamento habilitado.
- Fluxo principal:
  1. Usuário seleciona uma ação para adicionar (exemplo: Google).
  2. Frontend requisita cotação atual via Backend.
  3. Backend consulta API de mercado e retorna dados consolidados.
  4. Frontend persiste ativo na biblioteca local do usuário.
  5. Frontend confirma inclusão e atualiza a lista.
- Fluxos alternativos:
  - Ativo já existente na biblioteca: sistema evita duplicidade e informa usuário.
  - Falha de persistência local: sistema informa erro e não confirma inclusão.
- Pós-condições: biblioteca local contém a ação (sem duplicidade) ou operação falha de forma explícita.

## 3) Interfaces de software

### 3.1 Interfaces externas fornecidas pelo FINTA

- `IPriceQueryService`
  - `getCryptoQuote(symbol: string): CryptoQuote`
  - `getStockQuote(ticker: string): StockQuote`
- `IFipeQueryService`
  - `getVehiclePrice(input: VehicleQuery): FipePrice`
- `IRegistrationService`
  - `register(input: RegistrationInput): RegistrationResult`
- `IUserLibraryService`
  - `addAsset(input: AssetInput): LibraryItem`
  - `listAssets(): LibraryItem[]`

### 3.2 Interfaces externas requeridas pelo FINTA

- `IMarketDataGateway` (API de mercado financeiro)
  - `fetchCrypto(symbol: string): ExternalCryptoQuote`
  - `fetchStock(ticker: string): ExternalStockQuote`
- `IFipeGateway` (API FIPE)
  - `fetchVehiclePrice(input: VehicleQuery): ExternalFipePrice`

### 3.3 Interfaces internas entre componentes

- `IAuthRepository`
  - `createUser(input: RegistrationInput): User`
  - `existsByEmail(email: string): boolean`

## 4) Identificação de Componentes

Os componentes do pacote final foram definidos com base nas interfaces identificadas e no escopo funcional desta entrega.

- `Frontend Web App`
  - Responsabilidade: interação com usuário, orquestração de chamadas para o backend e persistência da biblioteca local (`localStorage`) por meio de `IUserLibraryService`.
  - Interfaces principais: consome `IPriceQueryService`, `IFipeQueryService`, `IRegistrationService`; fornece `IUserLibraryService`.
- `Backend API`
  - Responsabilidade: expor serviços de domínio do sistema, validar entradas e orquestrar integrações externas.
  - Interfaces principais: fornece `IPriceQueryService`, `IFipeQueryService`, `IRegistrationService`; consome `IMarketDataGateway` e `IFipeGateway`.
  - Módulo interno: `Auth Module` (não é componente de implantação separado).
- `Market Data Adapter`
  - Responsabilidade: adaptação da API de mercado financeiro para o contrato interno `IMarketDataGateway`.
- `FIPE Adapter`
  - Responsabilidade: adaptação da API FIPE para o contrato interno `IFipeGateway`.

## 5) Contratos das Operações (pré e pós-condições)

### 5.1 Frontend Web App

- Operação: `addAsset(input: AssetInput)`
- Pré-condições:
  - `input.ticker` informado e válido.
  - `localStorage` disponível e acessível no navegador.
- Pós-condições:
  - Ativo persistido na biblioteca local sem duplicidade.
  - Lista exibida ao usuário atualizada com estado consistente.

### 5.2 Backend API

- Operação: `getCryptoQuote(symbol: string)`
- Pré-condições:
  - `symbol` informado e não vazio.
  - `IMarketDataGateway` configurado e operacional.
- Pós-condições:
  - Cotação normalizada retornada no contrato `CryptoQuote`; ou
  - Erro técnico padronizado retornado em caso de falha externa.

### 5.3 Auth Module (interno ao Backend API)

- Operação: `createUser(input: RegistrationInput)`
- Pré-condições:
  - Email válido no `input`.
  - `existsByEmail(input.email)` igual a `false`.
- Pós-condições:
  - Usuário criado com identificador único.
  - Novo registro persistido e recuperável por consulta posterior.

### 5.4 Market Data Adapter

- Operação: `fetchStock(ticker: string)`
- Pré-condições:
  - `ticker` informado e válido.
  - API externa de mercado financeiro acessível.
- Pós-condições:
  - Payload retornado no formato acordado por `IMarketDataGateway`; ou
  - Falha técnica classificada (ex.: indisponibilidade/timeout).

### 5.5 FIPE Adapter

- Operação: `fetchVehiclePrice(input: VehicleQuery)`
- Pré-condições:
  - `input.marca`, `input.modelo` e `input.ano` informados.
  - API FIPE acessível.
- Pós-condições:
  - Valor FIPE e metadados mínimos retornados; ou
  - Resultado vazio controlado/erro técnico padronizado.

## 6) Dependências entre Componentes (via interfaces)

- `Frontend Web App` -> `Backend API`
  - Via `IPriceQueryService`
  - Via `IFipeQueryService`
  - Via `IRegistrationService`
- `Frontend Web App` -> Biblioteca local
  - Via `IUserLibraryService` (implementada no cliente)
- `Backend API` -> `Market Data Adapter`
  - Via `IMarketDataGateway`
- `Backend API` -> `FIPE Adapter`
  - Via `IFipeGateway`
- `Backend API` -> `Auth Module` (interno)
  - Via `IAuthRepository` para persistência/autenticação interna
- Adaptadores -> Sistemas externos
  - `Market Data Adapter` -> API Mercado Financeiro
  - `FIPE Adapter` -> API FIPE

## 7) Diagrama de Componentes (PlantUML)

![Diagrama de Componentes](/Users/pedro/Faculdade/topicos-avancados-eng-software/projeto-finta/Tópicos Avançados de Engenharia de Software/lab-3/diagrams/componentes-final.png)

Arquivo fonte: [componentes-final.puml](/Users/pedro/Faculdade/topicos-avancados-eng-software/projeto-finta/Tópicos Avançados de Engenharia de Software/lab-3/diagrams/componentes-final.puml)
