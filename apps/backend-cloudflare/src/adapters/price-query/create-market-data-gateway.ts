import type { IMarketDataGateway, QuoteRequest } from "@finta/price-query";

import type { AppEnv } from "../../app-env";

import { BrapiMarketDataGateway } from "./brapi-market-data-gateway";
import { CoinCapMarketDataGateway } from "./coincap-market-data-gateway";

class CompositeMarketDataGateway implements IMarketDataGateway {
  constructor(
    private readonly stockGateway: IMarketDataGateway,
    private readonly cryptoGateway: IMarketDataGateway,
  ) {}

  fetchQuote(input: QuoteRequest) {
    return input.assetType === "stock"
      ? this.stockGateway.fetchQuote(input)
      : this.cryptoGateway.fetchQuote(input);
  }
}

export function createMarketDataGateway(
  env: AppEnv,
  fetchImpl: typeof fetch = fetch,
): IMarketDataGateway {
  return new CompositeMarketDataGateway(
    new BrapiMarketDataGateway(env.BRAPI_TOKEN, fetchImpl),
    new CoinCapMarketDataGateway(env.COINCAP_API_KEY, fetchImpl),
  );
}
