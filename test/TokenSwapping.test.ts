import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumberish, ContractFactory, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
  TokenSwapping__factory,
  TokenSwapping,
  USDT,
  USDT__factory,
  PKF,
  PKF__factory,
  IERC20,
} from "../typechain";

const deployContract = async <T extends Contract>(
  name: string,
  contractOwner: SignerWithAddress,
  ...args: any[]
) => {
  const contractFactory = await ethers.getContractFactory(name, contractOwner);
  return contractFactory.deploy(...args) as Promise<T>;
};

const deployToken = async <T extends Contract>(
  name: string,
  contractOwner: SignerWithAddress
) => {
  return deployContract<T>(name, contractOwner, 1000000);
};

const seed = async <T extends IERC20>(
  contract: T,
  owner: SignerWithAddress,
  recipients: any[],
  amount: BigNumberish
) => {
  for (const recipient of recipients) {
    await contract.approve(owner.address, amount);
    await contract.transferFrom(owner.address, recipient.address, amount);
  }
};

describe("TokenSwapping contract", function () {
  let contract: TokenSwapping;
  let admin: SignerWithAddress;

  let usdtContract: USDT;
  let usdtOwner: SignerWithAddress;

  let pkfContract: PKF;
  let pkfOwner: SignerWithAddress;

  let user: SignerWithAddress;

  beforeEach(async function () {
    [admin, user, usdtOwner, pkfOwner] = await ethers.getSigners();

    contract = await deployContract<TokenSwapping>("TokenSwapping", admin);

    usdtContract = await deployToken<USDT>("USDT", usdtOwner);
    pkfContract = await deployToken<PKF>("PKF", pkfOwner);

    await seed(usdtContract, usdtOwner, [user, contract], 100);
    await seed(pkfContract, pkfOwner, [user, contract], 100);
  });

  it("init correctly", async () => {
    expect(await usdtContract.balanceOf(user.address)).to.equal(100);
    expect(await usdtContract.balanceOf(user.address)).to.equal(100);
  });

  describe("deployment", () => {
    it("set the right owner", async function () {
      expect(await contract.owner()).to.equal(admin.address);
    });
  });

  describe("set token pair", () => {
    context("when token pair exist", () => {});
  });

  // describe("Transactions", function () {
  //   it("Should transfer tokens between accounts", async function () {
  //     // Transfer 50 tokens from owner to addr1
  //     await hardhatToken.transfer(addr1.address, 50);
  //     const addr1Balance = await hardhatToken.balanceOf(addr1.address);
  //     expect(addr1Balance).to.equal(50);

  //     // Transfer 50 tokens from addr1 to addr2
  //     // We use .connect(signer) to send a transaction from another account
  //     await hardhatToken.connect(addr1).transfer(addr2.address, 50);
  //     const addr2Balance = await hardhatToken.balanceOf(addr2.address);
  //     expect(addr2Balance).to.equal(50);
  //   });

  //   it("Should fail if sender doesn’t have enough tokens", async function () {
  //     const initialOwnerBalance = await hardhatToken.balanceOf(owner.address);

  //     // Try to send 1 token from addr1 (0 tokens) to owner (1000000 tokens).
  //     // `require` will evaluate false and revert the transaction.
  //     await expect(
  //       hardhatToken.connect(addr1).transfer(owner.address, 1)
  //     ).to.be.revertedWith("Not enough tokens");

  //     // Owner balance shouldn't have changed.
  //     expect(await hardhatToken.balanceOf(owner.address)).to.equal(
  //       initialOwnerBalance
  //     );
  //   });

  //   it("Should update balances after transfers", async function () {
  //     const initialOwnerBalance = await hardhatToken.balanceOf(owner.address);

  //     // Transfer 100 tokens from owner to addr1.
  //     await hardhatToken.transfer(addr1.address, 100);

  //     // Transfer another 50 tokens from owner to addr2.
  //     await hardhatToken.transfer(addr2.address, 50);

  //     // Check balances.
  //     const finalOwnerBalance = await hardhatToken.balanceOf(owner.address);
  //     // @ts-expect-error
  //     expect(finalOwnerBalance).to.equal(initialOwnerBalance - 150);

  //     const addr1Balance = await hardhatToken.balanceOf(addr1.address);
  //     expect(addr1Balance).to.equal(100);

  //     const addr2Balance = await hardhatToken.balanceOf(addr2.address);
  //     expect(addr2Balance).to.equal(50);
  //   });
  // });
});
