import { TizzBorrowingFees } from "../types/generated";
import {
  BorrowingFee,
  convertGroupBorrowingFees,
  convertPairBorrowingFees,
} from "../../trade";

export const fetchAllPairBorrowingFees = async (
  contract: TizzBorrowingFees
): Promise<BorrowingFee.Pair[]> =>
  convertPairBorrowingFees(await contract.getAllPairs());

export const fetchGroupBorrowingFees = async (
  contract: TizzBorrowingFees,
  groupIxs: number[]
): Promise<BorrowingFee.Group[]> =>
  convertGroupBorrowingFees(await contract.getGroups(groupIxs));

export const fetchAllPairAndGroupBorrowingFees = async (
  contract: TizzBorrowingFees
): Promise<{
  pairs: BorrowingFee.Pair[];
  groups: BorrowingFee.Group[];
}> => {
  const pairs = await fetchAllPairBorrowingFees(contract);
  const groupIxs = [
    ...new Set(
      pairs
        .map(value => value.groups.map(value => value.groupIndex))
        .reduce((acc, value) => acc.concat(value), [])
    ),
  ].sort((a, b) => a - b);
  const groups = await fetchGroupBorrowingFees(contract, groupIxs);
  return { pairs, groups };
};
