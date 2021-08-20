import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, BigNumberish, Contract } from "ethers";
import { ethers } from "hardhat";
import { IERC20 } from "../typechain";

export const toBigNumber = (
  value: number | string,
  decimals: number = 0
): BigNumberish => {
  const strValue = value.toString();
  const [integerValue, decimalsValue] = strValue.split(".");
  const decimalsDiff = decimals - (decimalsValue?.length || 0);
  return BigNumber.from(
    [integerValue, decimalsValue || "", "0".repeat(decimalsDiff)].join("")
  );
};

export const deployContract = async <T extends Contract>(
  name: string,
  contractOwner: SignerWithAddress,
  ...args: any[]
) => {
  const contractFactory = await ethers.getContractFactory(name, contractOwner);
  return contractFactory.deploy(...args) as Promise<T>;
};

export const deployToken = async <T extends Contract>(
  name: string,
  contractOwner: SignerWithAddress,
  decimals: number = 0
) => {
  return deployContract<T>(name, contractOwner, toBigNumber(1000000, decimals));
};

export const seed =
  <T extends IERC20>(contract: T, owner: SignerWithAddress) =>
  async (recipients: any[], amount: BigNumberish) => {
    for (const recipient of recipients) {
      await contract.approve(owner.address, amount);
      await contract.transferFrom(owner.address, recipient.address, amount);
    }
  };
