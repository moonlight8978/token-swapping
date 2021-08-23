import { ethers } from "ethers";
import accounts from "./wallets/accounts.json";
import TokenSwapping from "../artifacts/contracts/TokenSwapping.sol/TokenSwapping.json";

const provider = new ethers.providers.JsonRpcProvider({
  url: "http://127.0.0.1:8545",
});

const run = async () => {
  const balance = await provider.getBalance(accounts[0].address);
  const contract = new ethers.Contract(
    "0x1E02890AC1a68C60C5aEBF8Af852DC0dE28D5954",
    TokenSwapping.abi
  );
  contract.connect(provider);
};

run();
