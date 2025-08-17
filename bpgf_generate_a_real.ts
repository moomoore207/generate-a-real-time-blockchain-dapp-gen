import { ethers } from 'ethers';
import { generateRandomString } from './utils';

interface BlockchainConfig {
  chainName: string;
  chainId: number;
  rpcUrl: string;
  blockchainType: 'Ethereum' | 'BinanceSmartChain' | 'Polygon';
}

interface DAppConfig {
  name: string;
  description: string;
  logoUrl: string;
  blockchainConfig: BlockchainConfig;
}

interface GeneratedDApp {
  contractAddress: string;
  abi: string[];
  bytecode: string;
}

class BPGFRealTimeBlockchainDAppGenerator {
  private dAppConfig: DAppConfig;

  constructor(dAppConfig: DAppConfig) {
    this.dAppConfig = dAppConfig;
  }

  async generateDApp(): Promise<GeneratedDApp> {
    const { blockchainConfig } = this.dAppConfig;
    const provider = new ethers.providers.JsonRpcProvider(blockchainConfig.rpcUrl);
    const wallet = ethers.Wallet.createRandom();

    const contract = await this.compileContract();
    const gasPrice = await provider.getGasPrice();
    const gasEstimate = await contract.estimateGas.deploy({
      value: ethers.utils.parseEther('0.01'),
    });
    const deploymentTx = await wallet.sendTransaction({
      to: ethers.constants.AddressZero,
      value: ethers.utils.parseEther('0.01'),
      gasPrice: gasPrice,
      gasLimit: gasEstimate,
      data: contract.bytecode,
    });

    const deploymentReceipt = await provider.waitForTransaction(deploymentTx.hash);
    const contractAddress = deploymentReceipt.contractAddress;

    return {
      contractAddress,
      abi: contract.abi,
      bytecode: contract.bytecode,
    };
  }

  private async compileContract(): Promise<ethers.ContractFactory> {
    const contractName = generateRandomString(10);
    const contractSource = `
     pragma solidity ^0.8.0;

      contract ${contractName} {
        string public name;
        string public description;
        string public logoUrl;

        constructor(string memory _name, string memory _description, string memory _logoUrl) {
          name = _name;
          description = _description;
          logoUrl = _logoUrl;
        }
      }
    `;

    const compiledContract = await ethers.compileSolidity(contractSource);
    return new ethers.ContractFactory(compiledContract.abi, compiledContract.bytecode);
  }
}

export { BPGFRealTimeBlockchainDAppGenerator };