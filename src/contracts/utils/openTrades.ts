/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Contract, Provider, Call } from "ethcall";
import { TradeContainer, TradeContainerRaw } from "../../trade/types";
import { Contracts, BlockTag } from "../../contracts/types";
import CustomProvider from "./customProvider";

export type FetchOpenPairTradesOverrides = {
  pairBatchSize?: number;
  useMulticall?: boolean;
  blockTag?: BlockTag;
};
export const fetchOpenPairTrades = async (
  contracts: Contracts,
  customMulticall: string,
  overrides: FetchOpenPairTradesOverrides = {}
): Promise<TradeContainer[]> => {
  const rawTrades = await fetchOpenPairTradesRaw(
    contracts,
    customMulticall,
    overrides
  );
  const { precision: collateralPrecision } =
    await contracts.tizzBorrowingFees.collateralConfig();

  return rawTrades.map(rawTrade =>
    _prepareTradeContainer(
      rawTrade.trade,
      rawTrade.tradeInfo,
      rawTrade.initialAccFees,
      rawTrade.tradeData,
      collateralPrecision
    )
  );
};

export const fetchOpenPairTradesRaw = async (
  contracts: Contracts,
  customMulticall: string,
  overrides: FetchOpenPairTradesOverrides = {}
): Promise<TradeContainerRaw[]> => {
  if (!contracts) {
    return [];
  }

  const {
    pairBatchSize = 10,
    useMulticall = false,
    blockTag = "latest",
  } = overrides;

  const { tizzMultiCollatDiamond: multiCollatDiamondContract } = contracts;

  try {
    const totalPairIndexes =
      (await multiCollatDiamondContract.pairsCount({ blockTag })).toNumber() -
      1;
    let allOpenPairTrades: TradeContainerRaw[] = [];

    for (
      let batchStartPairIndex = 0;
      batchStartPairIndex < totalPairIndexes;
      batchStartPairIndex += pairBatchSize
    ) {
      const batchEndPairIndex = Math.min(
        batchStartPairIndex + pairBatchSize - 1,
        totalPairIndexes
      );

      const openPairTradesBatch = useMulticall
        ? await fetchOpenPairTradesBatchMulticall(
            customMulticall,
            contracts,
            batchStartPairIndex,
            batchEndPairIndex,
            blockTag
          )
        : await fetchOpenPairTradesBatch(
            contracts,
            batchStartPairIndex,
            batchEndPairIndex
          );

      allOpenPairTrades = allOpenPairTrades.concat(openPairTradesBatch);
    }

    return allOpenPairTrades;
  } catch (error) {
    console.error(`Unexpected error while fetching open pair trades!`);

    throw error;
  }
};

const fetchOpenPairTradesBatch = async (
  contracts: Contracts,
  startPairIndex: number,
  endPairIndex: number
): Promise<TradeContainerRaw[]> => {
  const {
    tizzTradingStorage: storageContract,
    tizzBorrowingFees: borrowingFeesContract,
    tizzTradingCallbacks: callbacksContract,
  } = contracts;

  const maxTradesPerPair = (
    await storageContract.maxTradesPerPair()
  ).toNumber();

  const pairIndexesToFetch = Array.from(
    { length: endPairIndex - startPairIndex + 1 },
    (_, i) => i + startPairIndex
  );

  const rawTrades = await Promise.all(
    pairIndexesToFetch.map(async pairIndex => {
      const pairTraderAddresses = await storageContract.pairTradersArray(
        pairIndex
      );

      if (pairTraderAddresses.length === 0) {
        return [];
      }

      const openTradesForPairTraders = await Promise.all(
        pairTraderAddresses.map(async pairTraderAddress => {
          const openTradesCalls = new Array(maxTradesPerPair);
          for (
            let pairTradeIndex = 0;
            pairTradeIndex < maxTradesPerPair;
            pairTradeIndex++
          ) {
            openTradesCalls[pairTradeIndex] = storageContract.openTrades(
              pairTraderAddress,
              pairIndex,
              pairTradeIndex
            );
          }

          const openTradesForTraderAddress = await Promise.all(openTradesCalls);

          // Filter out any of the trades that aren't *really* open (NOTE: these will have an empty trader address, so just test against that)
          const actualOpenTradesForTrader = openTradesForTraderAddress.filter(
            openTrade => openTrade.trader === pairTraderAddress
          );

          const [
            actualOpenTradesTradeInfos,
            actualOpenTradesInitialAccFees,
            actualOpenTradesTradeData,
            liquidationPrice,
          ] = await Promise.all([
            Promise.all(
              actualOpenTradesForTrader.map(aot =>
                storageContract.openTradesInfo(
                  aot.trader,
                  aot.pairIndex,
                  aot.index
                )
              )
            ),
            Promise.all(
              actualOpenTradesForTrader.map(aot =>
                borrowingFeesContract.initialAccFees(
                  aot.trader,
                  aot.pairIndex,
                  aot.index
                )
              )
            ),
            Promise.all(
              actualOpenTradesForTrader.map(aot =>
                callbacksContract.tradeData(
                  aot.trader,
                  aot.pairIndex,
                  aot.index,
                  0
                )
              )
            ),
            Promise.all(
              actualOpenTradesForTrader.map(aot =>
                borrowingFeesContract.getTradeLiquidationPrice({
                  trader: aot.trader,
                  pairIndex: aot.pairIndex,
                  index: aot.index,
                  openPrice: aot.openPrice,
                  long: aot.buy,
                  collateral: aot.positionSizeBaseAsset,
                  leverage: aot.leverage,
                })
              )
            ),
          ]);

          const finalOpenTradesForTrader = new Array(
            actualOpenTradesForTrader.length
          );

          for (
            let tradeIndex = 0;
            tradeIndex < actualOpenTradesForTrader.length;
            tradeIndex++
          ) {
            const tradeInfo = actualOpenTradesTradeInfos[tradeIndex];

            if (tradeInfo === undefined) {
              continue;
            }

            if (actualOpenTradesInitialAccFees[tradeIndex] === undefined) {
              continue;
            }

            const trade = actualOpenTradesForTrader[tradeIndex];
            const tradeData = actualOpenTradesTradeData[tradeIndex];

            finalOpenTradesForTrader[tradeIndex] = {
              trade,
              tradeInfo,
              initialAccFees: {
                borrowing: actualOpenTradesInitialAccFees[tradeIndex],
                liquidationPrice,
              },
              tradeData,
            };
          }

          return finalOpenTradesForTrader;
        })
      );

      return openTradesForPairTraders;
    })
  );

  const perPairTrades = rawTrades.reduce((a, b) => a.concat(b), []);
  return perPairTrades.reduce((a, b) => a.concat(b), []);
};

const fetchOpenPairTradesBatchMulticall = async (
  customMulticall: string,
  contracts: Contracts,
  startPairIndex: number,
  endPairIndex: number,
  blockTag: BlockTag
): Promise<TradeContainerRaw[]> => {
  const {
    tizzTradingStorage: storageContract,
    tizzBorrowingFees: borrowingFeesContract,
    tizzTradingCallbacks: callbacksContract,
  } = contracts;

  // Convert to Multicall for efficient RPC usage
  const multicallProvider = new CustomProvider();
  multicallProvider.setMulticallAddress(customMulticall);

  await multicallProvider.init(storageContract.provider);
  const storageContractMulticall = new Contract(storageContract.address, [
    ...storageContract.interface.fragments,
  ]);
  const borrowingFeesContractMulticall = new Contract(
    borrowingFeesContract.address,
    [...borrowingFeesContract.interface.fragments]
  );
  const callbacksContractMulticall = new Contract(callbacksContract.address, [
    ...callbacksContract.interface.fragments,
  ]);

  const maxTradesPerPair = (
    await storageContract.maxTradesPerPair()
  ).toNumber();

  const pairIndexesToFetch = Array.from(
    { length: endPairIndex - startPairIndex + 1 },
    (_, i) => i + startPairIndex
  );

  const mcPairTraderAddresses: string[][] = await multicallProvider.all(
    pairIndexesToFetch.map(pairIndex =>
      storageContractMulticall.pairTradersArray(pairIndex)
    ),
    blockTag
  );

  const mcFlatOpenTrades: any[] = await multicallProvider.all(
    mcPairTraderAddresses
      .map((pairTraderAddresses, _ix) => {
        return pairTraderAddresses
          .map((pairTraderAddress: string) => {
            const openTradesCalls: Call[] = new Array(maxTradesPerPair);
            for (
              let pairTradeIndex = 0;
              pairTradeIndex < maxTradesPerPair;
              pairTradeIndex++
            ) {
              openTradesCalls[pairTradeIndex] =
                storageContractMulticall.openTrades(
                  pairTraderAddress,
                  _ix + startPairIndex,
                  pairTradeIndex
                );
            }
            return openTradesCalls;
          })
          .reduce((acc, val) => acc.concat(val), []);
      })
      .reduce((acc, val) => acc.concat(val), [] as Call[]),
    blockTag
  );

  const openTrades = mcFlatOpenTrades.filter(
    openTrade => openTrade[0] !== "0x0000000000000000000000000000000000000000"
  );

  const [
    openTradesTradeInfos,
    openTradesInitialAccFees,
    openTradesTradeData,
    openTradesLiquidationPrices,
  ] = await Promise.all([
    multicallProvider.all(
      openTrades.map(openTrade =>
        storageContractMulticall.openTradesInfo(
          openTrade.trader,
          openTrade.pairIndex,
          openTrade.index
        )
      ),
      blockTag
    ),
    multicallProvider.all<
      Awaited<ReturnType<typeof borrowingFeesContract.initialAccFees>>
    >(
      openTrades.map(openTrade =>
        borrowingFeesContractMulticall.initialAccFees(
          openTrade.trader,
          openTrade.pairIndex,
          openTrade.index
        )
      ),
      blockTag
    ),
    multicallProvider.all(
      openTrades.map(openTrade =>
        callbacksContractMulticall.tradeData(
          openTrade.trader,
          openTrade.pairIndex,
          openTrade.index,
          0
        )
      ),
      blockTag
    ),
    multicallProvider.all<
      Awaited<ReturnType<typeof borrowingFeesContract.getTradeLiquidationPrice>>
    >(
      openTrades.map(openTrade =>
        borrowingFeesContractMulticall.getTradeLiquidationPrice({
          trader: openTrade.trader,
          pairIndex: openTrade.pairIndex,
          index: openTrade.index,
          openPrice: openTrade.openPrice,
          long: openTrade.buy,
          collateral: openTrade.positionSizeBaseAsset,
          leverage: openTrade.leverage,
        })
      ),
      blockTag
    ),
  ]);

  const finalTrades = new Array(openTrades.length);

  for (
    let tradeIndex = 0;
    tradeIndex < openTradesTradeInfos.length;
    tradeIndex++
  ) {
    const tradeInfo = openTradesTradeInfos[tradeIndex];

    if (tradeInfo === undefined) {
      console.error(
        "No trade info found for open trade while fetching open trades!",
        { trade: openTradesTradeInfos[tradeIndex] }
      );

      continue;
    }

    if (openTradesInitialAccFees[tradeIndex] === undefined) {
      console.error(
        "No initial fees found for open trade while fetching open trades!",
        { trade: openTrades[tradeIndex] }
      );

      continue;
    }

    const trade = openTrades[tradeIndex];
    const tradeData = openTradesTradeData[tradeIndex];

    finalTrades[tradeIndex] = {
      trade,
      tradeInfo,
      initialAccFees: {
        borrowing: openTradesInitialAccFees[tradeIndex],
        liquidationPrice: openTradesLiquidationPrices[tradeIndex],
      },
      tradeData,
    };
  }

  return finalTrades.filter(trade => trade !== undefined);
};

const _prepareTradeContainer = (
  trade: any,
  tradeInfo: any,
  tradeInitialAccFees: any,
  tradeData: any,
  collateralPrecision: any
) => ({
  trade: {
    trader: trade.trader,
    pairIndex: parseInt(trade.pairIndex.toString()),
    index: parseInt(trade.index.toString()),
    initialPosToken: parseFloat(trade.initialPosToken.toString()) / 1e18,
    openPrice: parseFloat(trade.openPrice.toString()) / 1e10,
    buy: trade.buy.toString() === "true",
    leverage: parseInt(trade.leverage.toString()),
    tp: parseFloat(trade.tp.toString()) / 1e10,
    sl: parseFloat(trade.sl.toString()) / 1e10,
  },
  tradeInfo: {
    beingMarketClosed: tradeInfo.beingMarketClosed.toString() === "true",
    tokenPriceBaseAsset:
      parseFloat(tradeInfo.tokenPriceBaseAsset.toString()) / 1e10,
    openInterestBaseAsset:
      parseFloat(tradeInfo.openInterestBaseAsset.toString()) /
      parseFloat(collateralPrecision.toString()),
    tpLastUpdated: tradeInfo.tpLastUpdated,
    slLastUpdated: tradeInfo.slLastUpdated,
  },
  tradeData: {
    maxSlippageP: parseFloat(tradeData.maxSlippageP.toString()) / 1e10,
    lastOiUpdateTs: parseFloat(tradeData.lastOiUpdateTs),
    collateralPriceUsd:
      parseFloat(tradeData.collateralPriceUsd.toString()) / 1e8,
  },
  initialAccFees: {
    borrowing: {
      accPairFee:
        parseFloat(tradeInitialAccFees.borrowing.accPairFee.toString()) / 1e10,
      accGroupFee:
        parseFloat(tradeInitialAccFees.borrowing.accGroupFee.toString()) / 1e10,
      block: parseFloat(tradeInitialAccFees.borrowing.block.toString()),
    },
    liquidationPrice: tradeInitialAccFees.liquidationPrice.toString() / 1e8,
  },
});
