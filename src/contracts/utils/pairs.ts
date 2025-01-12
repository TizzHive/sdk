/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Pair,
  Fee,
  OpenInterest,
  PairDepth,
  PairIndex,
} from "../../trade/types";
import { Contracts } from "../../contracts/types";

export const fetchPairs = async (
  contracts: Contracts,
  pairIxs: PairIndex[]
): Promise<Pair[]> => {
  if (!contracts) {
    return [];
  }

  const { tizzMultiCollatDiamond: multiCollatContract } = contracts;

  try {
    const pairs = await Promise.all(
      pairIxs.map(pairIndex => multiCollatContract.pairs(pairIndex))
    );

    return pairs.map((pair, index) => {
      return {
        name: pair.from + "/" + pair.to,
        from: pair.from,
        to: pair.to,
        feeIndex: parseInt(pair.feeIndex.toString()),
        groupIndex: parseInt(pair.groupIndex.toString()),
        pairIndex: pairIxs[index],
        spreadP: parseFloat(pair.spreadP.toString()) / 1e12,
        description: getPairDescription(pairIxs[index]),
      } as Pair;
    });
  } catch (error) {
    console.error(`Unexpected error while fetching pairs!`);

    throw error;
  }
};

export const fetchPairDepths = async (
  contracts: Contracts,
  pairIxs: number[]
): Promise<PairDepth[]> => {
  if (!contracts) {
    return [];
  }

  const { tizzMultiCollatDiamond: multiCollatContract } = contracts;

  try {
    const pairParams = await multiCollatContract.getPairDepths(pairIxs);

    return pairParams.map(pair => {
      return {
        onePercentDepthAboveUsd: parseFloat(
          pair.onePercentDepthAboveUsd.toString()
        ),
        onePercentDepthBelowUsd: parseFloat(
          pair.onePercentDepthBelowUsd.toString()
        ),
      } as PairDepth;
    });
  } catch (error) {
    console.error(`Unexpected error while fetching pairs!`);

    throw error;
  }
};

export const fetchFees = async (
  contracts: Contracts,
  feeIxs: PairIndex[]
): Promise<Fee[]> => {
  if (!contracts) {
    return [];
  }

  const { tizzMultiCollatDiamond: multiCollatContract } = contracts;

  try {
    const fees = await Promise.all(
      feeIxs.map(pairIndex => multiCollatContract.fees(pairIndex))
    );

    return fees.map(fee => {
      return {
        closeFeeP: parseFloat(fee.closeFeeP.toString()) / 1e12,
        minLevPosUsd: parseFloat(fee.minLevPosUsd.toString()) / 1e18,
        nftLimitOrderFeeP: parseFloat(fee.nftLimitOrderFeeP.toString()) / 1e12,
        openFeeP: parseFloat(fee.openFeeP.toString()) / 1e12,
      } as Fee;
    });
  } catch (error) {
    console.error(`Unexpected error while fetching pairs!`);
    throw error;
  }
};

export const fetchOpenInterest = async (
  contracts: Contracts,
  pairIxs: number[]
): Promise<OpenInterest[]> => {
  const { precision: collateralPrecision } =
    await contracts.tizzBorrowingFees.collateralConfig();
  const openInterests = await Promise.all(
    pairIxs.map(pairIndex =>
      Promise.all([
        contracts.tizzTradingStorage.openInterestBaseAsset(pairIndex, 0),
        contracts.tizzTradingStorage.openInterestBaseAsset(pairIndex, 1),
        contracts.tizzBorrowingFees.getPairMaxOi(pairIndex),
      ])
    )
  );

  const precision = parseFloat(collateralPrecision.toString());
  return openInterests.map(openInterest => ({
    long: parseFloat(openInterest[0].toString()) / precision,
    short: parseFloat(openInterest[1].toString()) / precision,
    max: parseFloat(openInterest[2].toString()) / 1e10,
  }));
};

export const getPairDescription = (pairIndex: PairIndex): string => {
  return PAIR_INDEX_TO_DESCRIPTION[pairIndex] || "";
};

const PAIR_INDEX_TO_DESCRIPTION: { [key in PairIndex]: string } = {
  [PairIndex.BTCUSD]: "Bitcoin to US Dollar",
  [PairIndex.ETHUSD]: "Ethereum to US Dollar",
  [PairIndex.LINKUSD]: "Chainlink to US Dollar",
  [PairIndex.DOGEUSD]: "Dogecoin to US Dollar",
  [PairIndex.MATICUSD]: "Polygon to US Dollar",
  [PairIndex.ADAUSD]: "Cardano to US Dollar",
  [PairIndex.SUSHIUSD]: "Sushiswap to US Dollar",
  [PairIndex.AAVEUSD]: "Aave to US Dollar",
  [PairIndex.ALGOUSD]: "Algorand to US Dollar",
  [PairIndex.BATUSD]: "Basic Attention Token to US Dollar",
  [PairIndex.COMPUSD]: "Compound to US Dollar",
  [PairIndex.DOTUSD]: "Polkadot to US Dollar",
  [PairIndex.EOSUSD]: "EOS to US Dollar",
  [PairIndex.LTCUSD]: "Litecoin to US Dollar",
  [PairIndex.MANAUSD]: "Decentraland to US Dollar",
  [PairIndex.OMGUSD]: "OMG Network to US Dollar",
  [PairIndex.SNXUSD]: "Synthetix to US Dollar",
  [PairIndex.UNIUSD]: "Uniswap to US Dollar",
  [PairIndex.XLMUSD]: "Stellar to US Dollar",
  [PairIndex.XRPUSD]: "Ripple to US Dollar",
  [PairIndex.ZECUSD]: "Zcash to US Dollar",
  [PairIndex.EURUSD]: "Euro to US Dollar",
  [PairIndex.USDJPY]: "US Dollar to Japanese Yen",
  [PairIndex.GBPUSD]: "British Pound to US Dollar",
  [PairIndex.USDCHF]: "US Dollar to Swiss Franc",
  [PairIndex.AUDUSD]: "Australian Dollar to US Dollar",
  [PairIndex.USDCAD]: "US Dollar to Canadian Dollar",
  [PairIndex.NZDUSD]: "New Zealand Dollar to US Dollar",
  [PairIndex.EURCHF]: "Euro to Swiss Franc",
  [PairIndex.EURJPY]: "Euro to Japanese Yen",
  [PairIndex.EURGBP]: "Euro to British Pound",
  [PairIndex.LUNAUSD]: "Terra to US Dollar",
  [PairIndex.YFIUSD]: "Yearn.finance to US Dollar",
  [PairIndex.SOLUSD]: "Solana to US Dollar",
  [PairIndex.XTZUSD]: "Tezos to US Dollar",
  [PairIndex.BCHUSD]: "Bitcoin Cash to US Dollar",
  [PairIndex.BNTUSD]: "Bancor to US Dollar",
  [PairIndex.CRVUSD]: "Curve DAO Token to US Dollar",
  [PairIndex.DASHUSD]: "Dash to US Dollar",
  [PairIndex.ETCUSD]: "Ethereum Classic to US Dollar",
  [PairIndex.ICPUSD]: "Internet Computer to US Dollar",
  [PairIndex.MKRUSD]: "Maker to US Dollar",
  [PairIndex.NEOUSD]: "NEO to US Dollar",
  [PairIndex.THETAUSD]: "Theta Network to US Dollar",
  [PairIndex.TRXUSD]: "TRON to US Dollar",
  [PairIndex.ZRXUSD]: "0x to US Dollar",
  [PairIndex.SANDUSD]: "The Sandbox to US Dollar",
  [PairIndex.BNBUSD]: "Binance Coin to US Dollar",
  [PairIndex.AXSUSD]: "Axie Infinity to US Dollar",
  [PairIndex.GRTUSD]: "The Graph to US Dollar",
  [PairIndex.HBARUSD]: "Hedera Hashgraph to US Dollar",
  [PairIndex.XMRUSD]: "Monero to US Dollar",
  [PairIndex.ENJUSD]: "Enjin Coin to US Dollar",
  [PairIndex.FTMUSD]: "Fantom to US Dollar",
  [PairIndex.FTTUSD]: "FTX Token to US Dollar",
  [PairIndex.APEUSD]: "ApeCoin to US Dollar",
  [PairIndex.CHZUSD]: "Chiliz to US Dollar",
  [PairIndex.SHIBUSD]: "Shiba Inu to US Dollar",
  [PairIndex.AAPLUSD]: "Apple to US Dollar",
  [PairIndex.FBUSD]: "Facebook to US Dollar",
  [PairIndex.GOOGLUSD]: "Google to US Dollar",
  [PairIndex.AMZNUSD]: "Amazon to US Dollar",
  [PairIndex.MSFTUSD]: "Microsoft to US Dollar",
  [PairIndex.TSLAUSD]: "Tesla to US Dollar",
  [PairIndex.SNAPUSD]: "Snapchat to US Dollar",
  [PairIndex.NVDAUSD]: "Nvidia to US Dollar",
  [PairIndex.VUSD]: "Visa to US Dollar",
  [PairIndex.MAUSD]: "Mastercard to US Dollar",
  [PairIndex.PFEUSD]: "Pfizer to US Dollar",
  [PairIndex.KOUSD]: "Coca-Cola to US Dollar",
  [PairIndex.DISUSD]: "Disney to US Dollar",
  [PairIndex.GMEUSD]: "GameStop to US Dollar",
  [PairIndex.NKEUSD]: "Nike to US Dollar",
  [PairIndex.AMDUSD]: "AMD to US Dollar",
  [PairIndex.PYPLUSD]: "PayPal to US Dollar",
  [PairIndex.ABNBUSD]: "Airbnb to US Dollar",
  [PairIndex.BAUSD]: "Boeing to US Dollar",
  [PairIndex.SBUXUSD]: "Starbucks to US Dollar",
  [PairIndex.WMTUSD]: "Walmart to US Dollar",
  [PairIndex.INTCUSD]: "Intel to US Dollar",
  [PairIndex.MCDUSD]: "McDonald's to US Dollar",
  [PairIndex.METAUSD]: "Meta Platforms to US Dollar",
  [PairIndex.GOOGLUSD2]: "Google to US Dollar",
  [PairIndex.GMEUSD2]: "GameStop to US Dollar",
  [PairIndex.AMZNUSD2]: "Amazon to US Dollar",
  [PairIndex.TSLAUSD2]: "Tesla to US Dollar",
  [PairIndex.SPYUSD]: "SPDR S&P 500 ETF Trust to US Dollar",
  [PairIndex.QQQUSD]: "Invesco QQQ Trust to US Dollar",
  [PairIndex.IWMUSD]: "iShares Russell 2000 ETF to US Dollar",
  [PairIndex.DIAUSD]:
    "SPDR Dow Jones Industrial Average ETF Trust to US Dollar",
  [PairIndex.XAUUSD]: "Gold to US Dollar",
  [PairIndex.XAGUSD]: "Silver to US Dollar",
  [PairIndex.USDCNH]: "US Dollar to Chinese Yuan Offshore",
  [PairIndex.USDSGD]: "US Dollar to Singapore Dollar",
  [PairIndex.EURSEK]: "Euro to Swedish Krona",
  [PairIndex.USDKRW]: "US Dollar to South Korean Won",
  [PairIndex.EURNOK]: "Euro to Norwegian Krone",
  [PairIndex.USDINR]: "US Dollar to Indian Rupee",
  [PairIndex.USDMXN]: "US Dollar to Mexican Peso",
  [PairIndex.USDTWD]: "US Dollar to Taiwan New Dollar",
  [PairIndex.USDZAR]: "US Dollar to South African Rand",
  [PairIndex.USDBRL]: "US Dollar to Brazilian Real",
  [PairIndex.AVAXUSD]: "Avalanche to US Dollar",
  [PairIndex.ATOMUSD]: "Cosmos to US Dollar",
  [PairIndex.NEARUSD]: "NEAR Protocol to US Dollar",
  [PairIndex.QNTUSD]: "Quant to US Dollar",
  [PairIndex.IOTAUSD]: "IOTA to US Dollar",
  [PairIndex.TONUSD]: "The Open Network to US Dollar",
  [PairIndex.RPLUSD]: "Rocket Pool to US Dollar",
  [PairIndex.ARBUSD]: "Arbitrum to US Dollar",
  [PairIndex.EURAUD]: "Euro to Australian Dollar",
  [PairIndex.EURNZD]: "Euro to New Zealand Dollar",
  [PairIndex.EURCAD]: "Euro to Canadian Dollar",
  [PairIndex.GBPAUD]: "British Pound to Australian Dollar",
  [PairIndex.GBPNZD]: "British Pound to New Zealand Dollar",
  [PairIndex.GBPCAD]: "British Pound to Canadian Dollar",
  [PairIndex.GBPCHF]: "British Pound to Swiss Franc",
  [PairIndex.GBPJPY]: "British Pound to Japanese Yen",
  [PairIndex.AUDNZD]: "Australian Dollar to New Zealand Dollar",
  [PairIndex.AUDCAD]: "Australian Dollar to Canadian Dollar",
  [PairIndex.AUDCHF]: "Australian Dollar to Swiss Franc",
  [PairIndex.AUDJPY]: "Australian Dollar to Japanese Yen",
  [PairIndex.NZDCAD]: "New Zealand Dollar to Canadian Dollar",
  [PairIndex.NZDCHF]: "New Zealand Dollar to Swiss Franc",
  [PairIndex.NZDJPY]: "New Zealand Dollar to Japanese Yen",
  [PairIndex.CADCHF]: "Canadian Dollar to Swiss Franc",
  [PairIndex.CADJPY]: "Canadian Dollar to Japanese Yen",
  [PairIndex.CHFJPY]: "Swiss Franc to Japanese Yen",
  [PairIndex.LDOUSD]: "Lido DAO to US Dollar",
  [PairIndex.INJUSD]: "Injective Protocol to US Dollar",
  [PairIndex.RUNEUSD]: "THORChain to US Dollar",
  [PairIndex.CAKEUSD]: "PancakeSwap to US Dollar",
  [PairIndex.FXSUSD]: "Frax Share to US Dollar",
  [PairIndex.TWTUSD]: "Trust Wallet Token to US Dollar",
  [PairIndex.PEPEUSD]: "Pepe to US Dollar",
  [PairIndex.DYDXUSD]: "dYdX to US Dollar",
  [PairIndex.GMXUSD]: "GMX to US Dollar",
  [PairIndex.FILUSD]: "Filecoin to US Dollar",
  [PairIndex.APTUSD]: "Aptos to US Dollar",
  [PairIndex.IMXUSD]: "Immutable X to US Dollar",
  [PairIndex.VETUSD]: "VeChain to US Dollar",
  [PairIndex.OPUSD]: "Optimism to US Dollar",
  [PairIndex.RNDRUSD]: "Render Token to US Dollar",
  [PairIndex.EGLDUSD]: "Elrond to US Dollar",
  [PairIndex.TIAUSD]: "Tia to US Dollar",
  [PairIndex.STXUSD]: "Stacks to US Dollar",
  [PairIndex.FLOWUSD]: "Flow to US Dollar",
  [PairIndex.KAVAUSD]: "Kava to US Dollar",
  [PairIndex.GALAUSD]: "Gala to US Dollar",
  [PairIndex.MINAUSD]: "Mina to US Dollar",
  [PairIndex.ORDIUSD]: "Ordi to US Dollar",
  [PairIndex.ILVUSD]: "Illuvium to US Dollar",
  [PairIndex.KLAYUSD]: "Klaytn to US Dollar",
  [PairIndex.SUIUSD]: "Sui to US Dollar",
  [PairIndex.BLURUSD]: "Blur to US Dollar",
  [PairIndex.FETUSD]: "Fetch.ai to US Dollar",
  [PairIndex.CFXUSD]: "Conflux to US Dollar",
  [PairIndex.BEAMUSD]: "Beam to US Dollar",
  [PairIndex.ARUSD]: "Arweave to US Dollar",
  [PairIndex.SEIUSD]: "Sei to US Dollar",
  [PairIndex.BTTUSD]: "BitTorrent to US Dollar",
  [PairIndex.ROSEUSD]: "Oasis Network to US Dollar",
  [PairIndex.WOOUSD]: "WOO Network to US Dollar",
  [PairIndex.AGIXUSD]: "SingularityNET to US Dollar",
  [PairIndex.ZILUSD]: "Zilliqa to US Dollar",
  [PairIndex.GMTUSD]: "STEPN to US Dollar",
  [PairIndex.ASTRUSD]: "Astar to US Dollar",
  [PairIndex.ONEINCHUSD]: "1inch to US Dollar",
  [PairIndex.FLOKIUSD]: "Floki Inu to US Dollar",
  [PairIndex.QTUMUSD]: "Qtum to US Dollar",
  [PairIndex.OCEANUSD]: "Ocean Protocol to US Dollar",
  [PairIndex.WLDUSD]: "Worldcoin to US Dollar",
  [PairIndex.MASKUSD]: "Mask Network to US Dollar",
  [PairIndex.CELOUSD]: "Celo to US Dollar",
  [PairIndex.LRCUSD]: "Loopring to US Dollar",
  [PairIndex.ENSUSD]: "Ethereum Name Service to US Dollar",
  [PairIndex.MEMEUSD]: "Meme to US Dollar",
  [PairIndex.ANKRUSD]: "Ankr to US Dollar",
  [PairIndex.IOTXUSD]: "IoTeX to US Dollar",
  [PairIndex.ICXUSD]: "ICON to US Dollar",
  [PairIndex.KSMUSD]: "Kusama to US Dollar",
  [PairIndex.RVNUSD]: "Ravencoin to US Dollar",
  [PairIndex.ANTUSD]: "Aragon to US Dollar",
  [PairIndex.WAVESUSD]: "Waves to US Dollar",
  [PairIndex.SKLUSD]: "SKALE to US Dollar",
  [PairIndex.SUPERUSD]: "SuperFarm to US Dollar",
  [PairIndex.BALUSD]: "Balancer to US Dollar",
  [PairIndex.WTIUSD]: "Oil to US Dollar",
  [PairIndex.XPTUSD]: "Platinum to US Dollar",
  [PairIndex.XPDUSD]: "Palladium to US Dollar",
  [PairIndex.HGUSD]: "Copper to US Dollar",
  [PairIndex.JUPUSD]: "Jupiter to US Dollar",
};
