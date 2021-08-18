import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
  TokenSwapping__factory,
  TokenSwapping,
  USDT,
  USDT__factory,
  PKF,
  PKF__factory,
} from "../typechain";

describe("TokenSwapping contract", function () {
  let contract: TokenSwapping;
  let usdtContract: USDT;
  let pkfContract: PKF;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let usdtOwner: SignerWithAddress;
  let pkfOwner: SignerWithAddress;

  beforeEach(async function () {
    [owner, user, usdtOwner, pkfOwner] = await ethers.getSigners();

    const usdtFactory = (await ethers.getContractFactory(
      "USDT",
      owner
    )) as USDT__factory;
    usdtContract = await usdtFactory.deploy(10000000000);

    const pdkFactory = (await ethers.getContractFactory(
      "PKF",
      owner
    )) as PKF__factory;
    pkfContract = await pdkFactory.deploy(10000000000);

    const contractFactory = (await ethers.getContractFactory(
      "TokenSwapping",
      owner
    )) as TokenSwapping__factory;
    contract = await contractFactory.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });
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
