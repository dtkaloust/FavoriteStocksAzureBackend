import { Int32 } from "bson";

export interface finhubSymbolAPIResponse {
  currency: string;
  description: string;
  displaySymbol: string;
  figi: string;
  mic: string;
  symbol: string;
  type: string;
}

export interface finhubQuoteAPIResponse {
  c: string;
  d: string;
  dp: string;
  h: string;
  l: string;
  o: string;
  pc: string;
}

export interface finhubProfileAPIResponse {
  country: string;
  currency: string;
  exchange: string;
  finnhubIndustry: string;
  ipo: string;
  logo: string;
  marketCapitalization: string;
  name: string;
  phone: string;
  shareOutstanding: string;
  ticker: string;
  weburl: string;
}

export interface authPayload {
  iss: string;
  exp: string;
  nbf: string;
  sub: string;
  aud: string;
  given_name: string;
  tfp: string;
  nonce: string;
  scp: string;
  iat: string;
  azp: string;
  ver: string;
}
