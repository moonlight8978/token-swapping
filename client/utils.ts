import { ethers } from "ethers";
import TokenSwapping from "../artifacts/contracts/TokenSwapping.sol/TokenSwapping.json";
import ERC20 from "../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json";
import { TokenSwapping as ITokenSwapping, IERC20 } from "../typechain";
import secrets from "../secret.json";

export const provider = new ethers.providers.JsonRpcProvider({
  url: "http://127.0.0.1:8545",
});

export const tokenSwapping = new ethers.Contract(
  secrets.contract.address,
  TokenSwapping.abi,
  provider
) as ITokenSwapping;

export const deployer = new ethers.Wallet(
  secrets.accounts.deployer.key,
  provider
);
export const alice = new ethers.Wallet(secrets.accounts.alice.key, provider);
export const bob = new ethers.Wallet(secrets.accounts.bob.key, provider);
export const accounts = {
  deployer,
  alice,
  bob,
};

export const getToken = (address: string) =>
  new ethers.Contract(address, ERC20.abi, provider) as IERC20;
