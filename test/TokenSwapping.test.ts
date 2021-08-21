import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { TokenSwapping, USDT, PKF, IERC20, WBNB } from "../typechain";
import { deployToken, seed, deployContract, toBigNumber } from "./utils";

const USDT_DECIMALS = 6;
const PKF_DECIMALS = 12;
const WBNB_DECIMALS = 18;

const INITIAL_TOKEN_AMOUNT = 10_000_000;

describe("TokenSwapping contract", function () {
  let contract: TokenSwapping;
  let admin: SignerWithAddress;

  let usdtContract: USDT;
  let usdtOwner: SignerWithAddress;

  let pkfContract: PKF;
  let pkfOwner: SignerWithAddress;

  let wbnbContract: WBNB;
  let wbnbOwner: SignerWithAddress;

  let user: SignerWithAddress;

  const seedUsdt = () => seed<USDT>(usdtContract, usdtOwner);
  const seedPkf = () => seed(pkfContract, pkfOwner);
  const seedWbnb = () => seed(wbnbContract, wbnbOwner);

  beforeEach(async function () {
    [admin, user, usdtOwner, pkfOwner, wbnbOwner] = await ethers.getSigners();

    contract = await deployContract<TokenSwapping>("TokenSwapping", admin);

    usdtContract = await deployToken<USDT>("USDT", usdtOwner, USDT_DECIMALS);
    pkfContract = await deployToken<PKF>("PKF", pkfOwner, PKF_DECIMALS);
    wbnbContract = await deployToken<WBNB>("WBNB", wbnbOwner, WBNB_DECIMALS);
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
      expect(rate.from).to.deep.equal(toBigNumber(1));
      expect(rate.to).to.deep.equal(toBigNumber(2));
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

      expect(rate.from).to.deep.equal(toBigNumber(1));
      expect(rate.to).to.deep.equal(toBigNumber(3));

      await contract.modifyRate(
        usdtContract.address,
        pkfContract.address,
        1,
        4
      );
      rate = await contract.getRate(usdtContract.address, pkfContract.address);
      expect(rate.from).to.deep.equal(toBigNumber(1));
      expect(rate.to).to.deep.equal(toBigNumber(4));
    });

    it("does not allow non-owner to modify", async () => {
      const modify = contract
        .connect(user)
        .modifyRate(usdtContract.address, pkfContract.address, 1, 3);
      await expect(modify).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("Swapping token with token", () => {
    it("allows user to trade into lower amount of token", async () => {
      await contract.modifyRate(
        pkfContract.address,
        usdtContract.address,
        1_000_000,
        571_590
      );

      await seedPkf()([user], INITIAL_TOKEN_AMOUNT);
      await seedUsdt()([contract], INITIAL_TOKEN_AMOUNT);
      await pkfContract.connect(user).approve(contract.address, 100_000);

      await contract
        .connect(user)
        .swap(pkfContract.address, usdtContract.address, 100_000);

      expect(await pkfContract.balanceOf(user.address)).to.equal(
        toBigNumber(INITIAL_TOKEN_AMOUNT - 100_000)
      );
      expect(await usdtContract.balanceOf(user.address)).to.equal(
        toBigNumber(57_159)
      );

      expect(await pkfContract.balanceOf(contract.address)).to.equal(
        toBigNumber(100_000)
      );
      expect(await usdtContract.balanceOf(contract.address)).to.equal(
        toBigNumber(INITIAL_TOKEN_AMOUNT - 57_159)
      );
    });

    it("allows user to trade into higher amount of token", async () => {
      await contract.modifyRate(
        wbnbContract.address,
        pkfContract.address,
        10,
        200_000
      );

      await seedWbnb()([user], INITIAL_TOKEN_AMOUNT);
      await seedPkf()([contract], INITIAL_TOKEN_AMOUNT);
      await wbnbContract.connect(user).approve(contract.address, 10);

      await contract
        .connect(user)
        .swap(wbnbContract.address, pkfContract.address, 1);

      expect(await wbnbContract.balanceOf(user.address)).to.equal(
        toBigNumber(INITIAL_TOKEN_AMOUNT - 1)
      );
      expect(await pkfContract.balanceOf(user.address)).to.equal(
        toBigNumber(20_000)
      );

      expect(await wbnbContract.balanceOf(contract.address)).to.equal(
        toBigNumber(1)
      );
      expect(await pkfContract.balanceOf(contract.address)).to.equal(
        toBigNumber(INITIAL_TOKEN_AMOUNT - 20_000)
      );
    });

    it("handles float number", async () => {
      await contract.modifyRate(
        usdtContract.address,
        wbnbContract.address,
        3,
        1
      );

      await seedUsdt()([user], INITIAL_TOKEN_AMOUNT);
      await seedWbnb()([contract], INITIAL_TOKEN_AMOUNT);
      await usdtContract.connect(user).approve(contract.address, 1_000_000);

      await contract
        .connect(user)
        .swap(usdtContract.address, wbnbContract.address, 1_000_000);

      expect(await usdtContract.balanceOf(user.address)).to.equal(
        toBigNumber(INITIAL_TOKEN_AMOUNT - 1_000_000)
      );
      expect(await wbnbContract.balanceOf(user.address)).to.equal(
        toBigNumber(333_333)
      );

      expect(await usdtContract.balanceOf(contract.address)).to.equal(
        toBigNumber(1_000_000)
      );
      expect(await wbnbContract.balanceOf(contract.address)).to.equal(
        toBigNumber(INITIAL_TOKEN_AMOUNT - 333_333)
      );
    });

    it("does not allow trading with non-exist token pair", async () => {
      const swap = contract
        .connect(user)
        .swap(user.address, usdtContract.address, 30);

      await expect(swap).to.be.revertedWith("Token cannot be exchanged");
    });

    it("does not allow trading with invalid amount", async () => {
      await contract.modifyRate(
        wbnbContract.address,
        usdtContract.address,
        3,
        1
      );
      await seedWbnb()([user], INITIAL_TOKEN_AMOUNT);
      await seedUsdt()([contract], INITIAL_TOKEN_AMOUNT);
      await wbnbContract.connect(user).approve(contract.address, 1);

      const swap = contract
        .connect(user)
        .swap(wbnbContract.address, usdtContract.address, 1);

      await expect(swap).to.be.revertedWith(
        "Please increase the amount to trade"
      );
    });

    it("does not allow trading with 0 amount", async () => {
      await contract.modifyRate(
        wbnbContract.address,
        usdtContract.address,
        3,
        1
      );
      await seedWbnb()([user], INITIAL_TOKEN_AMOUNT);
      await seedUsdt()([contract], INITIAL_TOKEN_AMOUNT);

      const swap = contract
        .connect(user)
        .swap(wbnbContract.address, usdtContract.address, 0);

      await expect(swap).to.be.revertedWith(
        "Please increase the amount to trade"
      );
    });

    it("revert if user does not have enough tokens", async () => {
      await contract.modifyRate(
        wbnbContract.address,
        usdtContract.address,
        1,
        1
      );
      await seedWbnb()([user], INITIAL_TOKEN_AMOUNT);
      await seedUsdt()([contract], INITIAL_TOKEN_AMOUNT);

      const swap = contract
        .connect(user)
        .swap(wbnbContract.address, usdtContract.address, 5_000_000_000);

      await expect(swap).to.be.revertedWith("You do not have enough tokens");
    });

    it("revert if contract does not have enought token", async () => {
      await contract.modifyRate(
        pkfContract.address,
        usdtContract.address,
        1,
        1
      );

      await seedPkf()([user], INITIAL_TOKEN_AMOUNT);
      await pkfContract.connect(user).approve(contract.address, 30);

      const swap = contract
        .connect(user)
        .swap(pkfContract.address, usdtContract.address, 30);

      await expect(swap).to.be.revertedWith(
        "We do not have enough tokens. Please try again"
      );
    });

    it("revert if user has not approve the contract", async () => {
      await contract.modifyRate(
        pkfContract.address,
        usdtContract.address,
        1,
        1
      );

      await seedPkf()([user], INITIAL_TOKEN_AMOUNT);
      await seedUsdt()([contract], INITIAL_TOKEN_AMOUNT);

      const swap = contract
        .connect(user)
        .swap(pkfContract.address, usdtContract.address, 1);

      await expect(swap).to.be.revertedWith(
        "ERC20: transfer amount exceeds allowance"
      );
    });
  });

  describe("Swapping native token to token", () => {});
});
