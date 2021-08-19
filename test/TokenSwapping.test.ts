import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, BigNumberish, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { TokenSwapping, USDT, PKF, IERC20 } from "../typechain";

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

const INITIAL_TOKEN_AMOUNT = 100;

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
  });

  describe("deployment", () => {
    it("set the right owner", async function () {
      expect(await contract.owner()).to.equal(admin.address);
    });
  });

  describe("set token pair", () => {
    it("creates new pair", async () => {
      await contract.modifyRate(
        usdtContract.address,
        pkfContract.address,
        1,
        2
      );

      const rate = await contract.getRate(
        usdtContract.address,
        pkfContract.address
      );
      expect(rate.map((e) => e.toString())).to.deep.equal(["1", "2"]);
    });

    it("updates exist pair", async () => {
      await contract.modifyRate(
        usdtContract.address,
        pkfContract.address,
        1,
        3
      );
      let rate = await contract.getRate(
        usdtContract.address,
        pkfContract.address
      );

      expect(rate.map((e) => e.toString())).to.deep.equal(["1", "3"]);

      await contract.modifyRate(
        usdtContract.address,
        pkfContract.address,
        1,
        4
      );
      rate = await contract.getRate(usdtContract.address, pkfContract.address);
      expect(rate.map((e) => e.toString())).to.deep.equal(["1", "4"]);
    });
  });

  describe("Swapping", () => {
    beforeEach(async () => {
      await contract.modifyRate(
        pkfContract.address,
        usdtContract.address,
        3,
        1
      );
    });

    it("trade successfully between user and contract", async () => {
      await seed(
        usdtContract,
        usdtOwner,
        [user, contract],
        INITIAL_TOKEN_AMOUNT
      );
      await seed(pkfContract, pkfOwner, [user, contract], INITIAL_TOKEN_AMOUNT);
      await pkfContract.connect(user).approve(contract.address, 30);

      await contract
        .connect(user)
        .swap(pkfContract.address, usdtContract.address, 30);

      expect(await pkfContract.balanceOf(user.address)).to.equal(
        INITIAL_TOKEN_AMOUNT - 30
      );
      expect(await usdtContract.balanceOf(user.address)).to.equal(
        INITIAL_TOKEN_AMOUNT + 10
      );

      expect(await pkfContract.balanceOf(contract.address)).to.equal(
        INITIAL_TOKEN_AMOUNT + 30
      );
      expect(await usdtContract.balanceOf(contract.address)).to.equal(
        INITIAL_TOKEN_AMOUNT - 10
      );
    });

    it("does not allow trading with non-exist token pair", async () => {
      const swap = contract
        .connect(user)
        .swap(user.address, usdtContract.address, 30);

      await expect(swap).to.be.revertedWith("Token cannot be exchanged");
    });

    it("does not allow trading with non-exist token pair", async () => {
      const swap = contract
        .connect(user)
        .swap(user.address, usdtContract.address, 30);

      await expect(swap).to.be.revertedWith("Token cannot be exchanged");
    });

    it("does not allow trading with invalid amount", async () => {
      const swap = contract
        .connect(user)
        .swap(pkfContract.address, usdtContract.address, 31);

      await expect(swap).to.be.revertedWith("Invalid amount to swap");
    });

    it("revert if user does not have enough tokens", async () => {
      const swap = contract
        .connect(user)
        .swap(pkfContract.address, usdtContract.address, 30);

      await expect(swap).to.be.revertedWith("You do not have enough tokens");
    });

    it("revert if contract does not have enought token", async () => {
      await seed(pkfContract, pkfOwner, [user], INITIAL_TOKEN_AMOUNT);

      const swap = contract
        .connect(user)
        .swap(pkfContract.address, usdtContract.address, 30);

      await expect(swap).to.be.revertedWith(
        "We do not have enough tokens. Please try again"
      );
    });

    it("revert if user has not approve the contract", async () => {
      await seed(pkfContract, pkfOwner, [user], INITIAL_TOKEN_AMOUNT);
      await seed(usdtContract, usdtOwner, [contract], INITIAL_TOKEN_AMOUNT);

      const swap = contract
        .connect(user)
        .swap(pkfContract.address, usdtContract.address, 30);

      await expect(swap).to.be.revertedWith(
        "ERC20: transfer amount exceeds allowance"
      );
    });
  });
});
