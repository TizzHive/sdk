import type { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import {
  getCollateralByAddressForChain,
  getContractAddressesForChain,
} from "./addresses";
import {
  TizzTokenOpenPnlFeed__factory,
  TizzBorrowingFees__factory,
  TizzTradingCallbacks__factory,
  TizzTradingStorage__factory,
  TizzToken__factory,
  TizzMultiCollatDiamond__factory,
  TizzTrading__factory,
  TizzFundingFees__factory,
} from "./types/generated";
import { CollateralTypes, Contracts } from "./types";

export const getContractsForChain = (
  chainId: number,
  signerOrProvider?: Signer | Provider,
  collateral?: CollateralTypes
): Contracts => {
  const addresses = getContractAddressesForChain(chainId, collateral);

  return {
    tizzMultiCollatDiamond: TizzMultiCollatDiamond__factory.connect(
      addresses.tizzMultiCollatDiamond,
      signerOrProvider as Signer | Provider
    ),
    tizzTokenOpenPnlFeed: TizzTokenOpenPnlFeed__factory.connect(
      addresses.tizzTokenOpenPnlFeed,
      signerOrProvider as Signer | Provider
    ),
    tizzBorrowingFees: TizzBorrowingFees__factory.connect(
      addresses.tizzBorrowingFees,
      signerOrProvider as Signer | Provider
    ),
    tizzTrading: TizzTrading__factory.connect(
      addresses.tizzTrading,
      signerOrProvider as Signer | Provider
    ),
    tizzTradingStorage: TizzTradingStorage__factory.connect(
      addresses.tizzTradingStorage,
      signerOrProvider as Signer | Provider
    ),
    tizzTradingCallbacks: TizzTradingCallbacks__factory.connect(
      addresses.tizzTradingCallbacks,
      signerOrProvider as Signer | Provider
    ),
    tizzToken: TizzToken__factory.connect(
      addresses.tizzToken,
      signerOrProvider as Signer | Provider
    ),
    tizzFundingRate: TizzFundingFees__factory.connect(
      addresses.tizzFundingRate,
      signerOrProvider as Signer | Provider
    )
  };
};

export const getContractsForChainByRequester = (
  chainId: number,
  requester: string,
  signerOrProvider?: Signer | Provider
): Contracts => {
  return getContractsForChain(
    chainId,
    signerOrProvider,
    getCollateralByAddressForChain(chainId, requester)
  );
};

export * from "./utils";
export * from "./addresses";
export * from "./types";
