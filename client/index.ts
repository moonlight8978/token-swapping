import { ethers } from "ethers";
import secret from "../secret.json";
import TokenSwapping from "../artifacts/contracts/TokenSwapping.sol/TokenSwapping.json";
import { TokenSwapping as ITokenSwapping } from "./../typechain";

const { accounts } = secret;

const provider = new ethers.providers.JsonRpcProvider({
  url: "http://127.0.0.1:8545",
});

const run = async () => {
  const balance = await provider.getBalance(accounts[0].address);
  console.log(balance);
  const contract = new ethers.Contract(
    "0x1E02890AC1a68C60C5aEBF8Af852DC0dE28D5954",
    TokenSwapping.abi,
    provider
  ) as ITokenSwapping;
  console.log(await contract.owner());
  console.log(
    await contract.getRate(
      ethers.constants.AddressZero,
      ethers.constants.AddressZero
    )
  );
};

run();
