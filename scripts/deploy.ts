import { BigNumber, ContractFactory } from "ethers";
import { ethers } from "hardhat";
import { PKF, TokenSwapping, USDT, WBNB } from "../typechain";

async function deploy<T>(
  contractFactory: Promise<ContractFactory>,
  ...args: any[]
) {
  const Contract = await contractFactory;
  const contract = await Contract.deploy(...args);
  console.log("Contract address:", contract.address);
  // @ts-ignore
  return contract as T;
}

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  await deploy<TokenSwapping>(
    ethers.getContractFactory("TokenSwapping", deployer)
  );
  const usdt = await deploy<USDT>(
    ethers.getContractFactory("USDT", deployer),
    BigNumber.from("1_000_000_000_000_000".replace(/_/g, ""))
  );
  await deploy<PKF>(
    ethers.getContractFactory("PKF", deployer),
    BigNumber.from("1_000_000_000_000_000_000_000".replace(/_/g, ""))
  );
  await deploy<WBNB>(
    ethers.getContractFactory("WBNB", deployer),
    BigNumber.from("1_000_000_000_000_000_000_000_000_000".replace(/_/g, ""))
  );

  console.log(await usdt.signer.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
