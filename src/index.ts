export * from "./trade";
export * from "./contracts";
export * from "./markets";
export * from "./constants";
export * from "./utils";
export * from "./vault";
// Not sure why this is needed, but it is. Barrel imports are not working.
export * from "./trade/fees/borrowing/index";

import TizzMultiCollatDiamondABI from "../abi/global/TizzMultiCollatDiamond.sol/TizzMultiCollatDiamond.json";
import TizzTradingStorageABI from "../abi/core/TizzTradingStorage.sol/TizzTradingStorage.json";
import TizzTradingABI from "../abi/core/TizzTrading.sol/TizzTrading.json";
import TizzTradingCallbacksABI from "../abi/core/TizzTradingCallbacks.sol/TizzTradingCallbacks.json";
import TizzPriceAggregatorABI from "../abi/core/TizzPriceAggregator.sol/TizzPriceAggregator.json";
import TizzBorrowingFeesABI from "../abi/core/TizzBorrowingFees.sol/TizzBorrowingFees.json";
import TizzTokenABI from "../abi/core/TizzToken.sol/TizzToken.json";
import TizzFundingRateABI from "../abi/core/TizzFundingFees.sol/TizzFundingFees.json";

export const ABIS = {
  MULTI_COLLAT_DIAMOND: TizzMultiCollatDiamondABI,
  STORAGE: TizzTradingStorageABI,
  TRADING: TizzTradingABI,
  CALLBACKS: TizzTradingCallbacksABI,
  AGGREGATOR: TizzPriceAggregatorABI,
  BORROWING_FEES: TizzBorrowingFeesABI,
  TOKEN: TizzTokenABI,
  FUNDING_RATE: TizzFundingRateABI,
};
