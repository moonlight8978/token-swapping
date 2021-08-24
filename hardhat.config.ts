import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import { HardhatUserConfig } from "hardhat/types";
import { task } from "hardhat/config";
import secret from "./secret.json";

task("accounts", "Prints the list of accounts", async () => {
  const { ethers } = await import("hardhat");
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const { accounts } = secret;

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    localhost: {
      accounts: [accounts.deployer.key, accounts.alice.key, accounts.bob.key],
    },
    "bsc-testnet": {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: [accounts.bob.key],
    },
  },
};

export default config;
