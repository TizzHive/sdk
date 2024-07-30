import { Provider as EthcallProvider } from "ethcall";
import { ethers } from "ethers";

class CustomProvider extends EthcallProvider {
  customMulticallAddress: string | null = null;

  async init(provider: ethers.providers.Provider): Promise<void> {
    await super.init(provider);
    if (this.customMulticallAddress) {
      this.multicall = { address: this.customMulticallAddress, block: 0 };
      this.multicall2 = null;
      this.multicall3 = null;
    }
  }

  setMulticallAddress(address: string): void {
    this.customMulticallAddress = address;
  }
}

export default CustomProvider;
