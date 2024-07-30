/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { LimitOrderRaw, LimitOrder } from "../../trade/types";
import { Contract, Provider } from "ethcall";
import { BlockTag, Contracts } from "../types";

export type FetchOpenLimitOrdersOverrides = {
  blockTag?: BlockTag;
  useMulticall?: boolean;
};
