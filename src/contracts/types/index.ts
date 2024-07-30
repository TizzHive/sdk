import {
  TizzTokenOpenPnlFeed,
  TizzBorrowingFees,
  TizzTradingStorage,
  TizzTradingCallbacks,
  TizzToken,
  TizzMultiCollatDiamond,
  TizzTrading,
  TizzFundingFees,
} from "./generated";

export type Contracts = {
  tizzTokenOpenPnlFeed: TizzTokenOpenPnlFeed;
  tizzBorrowingFees: TizzBorrowingFees;
  tizzTrading: TizzTrading;
  tizzTradingStorage: TizzTradingStorage;
  tizzTradingCallbacks: TizzTradingCallbacks;
  tizzToken: TizzToken;
  tizzMultiCollatDiamond: TizzMultiCollatDiamond;
  tizzFundingRate: TizzFundingFees
};

export * from "./generated";

export type ContractAddresses = {
  customMulticall: string;
  tizzMultiCollatDiamond: string;
  tizzTokenOpenPnlFeed: string;
  tizzBorrowingFees: string;
  tizzTrading: string;
  tizzTradingStorage: string;
  tizzTradingCallbacks: string;
  tizzToken: string;
  tizzFundingRate: string;
};

export type BlockTag = number | "latest" | "pending";

export enum CollateralTypes {
  USDT = "USDT",
  WBTC = "WBTC",
  // BTC = "BTC",
}

export type ContractAddressList = Record<
  string,
  Partial<Record<CollateralTypes | "global", Partial<ContractAddresses>>>
>;
