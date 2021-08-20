import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, BigNumberish, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { TokenSwapping, USDT, PKF, IERC20, WBNB } from "../typechain";

const USDT_DECIMALS = 6;
const PKF_DECIMALS = 12;
const WBNB_DECIMALS = 18;

const toBigNumber = (
  value: number | string,
  decimals: number
): BigNumberish => {
  const strValue = value.toString();
  const [integerValue, decimalsValue] = strValue.split(".");
  const decimalsDiff = decimals - (decimalsValue?.length || 0);
  return BigNumber.from(
    [integerValue, decimalsValue || "", "0".repeat(decimalsDiff)].join("")
  );
};

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
  contractOwner: SignerWithAddress,
  decimals: number
) => {
  return deployContract<T>(name, contractOwner, toBigNumber(1000000, decimals));
};

const INITIAL_TOKEN_AMOUNT = 100;

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

  const seedUsdt = (recipients: any[], amount: number) => {
    return seed(
      usdtContract,
      usdtOwner,
      recipients,
      toBigNumber(amount, USDT_DECIMALS)
    );
  };

  const seedPkf = (recipients: any[], amount: number) => {
    return seed(
      pkfContract,
      pkfOwner,
      recipients,
      toBigNumber(amount, PKF_DECIMALS)
    );
  };

  const seedWbnb = (recipients: any[], amount: number) => {
    return seed(
      wbnbContract,
      wbnbOwner,
      recipients,
      toBigNumber(amount, WBNB_DECIMALS)
    );
  };

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

    it("does not allow non-owner to modify", async () => {
      const modify = contract
        .connect(user)
        .modifyRate(usdtContract.address, pkfContract.address, 1, 3);
      await expect(modify).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("Swapping", () => {
    it("allows user to trade into token has more decimals", async () => {
      await contract.modifyRate(
        usdtContract.address,
        pkfContract.address,
        1000000,
        571590
      );

      await seedUsdt([user], INITIAL_TOKEN_AMOUNT);
      await seedPkf([contract], INITIAL_TOKEN_AMOUNT);
      await usdtContract
        .connect(user)
        .approve(contract.address, toBigNumber(1, USDT_DECIMALS));

      await contract
        .connect(user)
        .swap(
          usdtContract.address,
          pkfContract.address,
          toBigNumber(1, USDT_DECIMALS)
        );

      expect(await pkfContract.balanceOf(user.address)).to.equal(
        toBigNumber(0.57159, PKF_DECIMALS)
      );
      expect(await usdtContract.balanceOf(user.address)).to.equal(
        toBigNumber(INITIAL_TOKEN_AMOUNT - 1, USDT_DECIMALS)
      );

      expect(await pkfContract.balanceOf(contract.address)).to.equal(
        toBigNumber(INITIAL_TOKEN_AMOUNT - 0.57159, PKF_DECIMALS)
      );
      expect(await usdtContract.balanceOf(contract.address)).to.equal(
        toBigNumber(1, USDT_DECIMALS)
      );
    });

    it("allows user to trade into token has less decimals", async () => {
      await contract.modifyRate(
        wbnbContract.address,
        pkfContract.address,
        10,
        200
      );

      await seedWbnb([user], INITIAL_TOKEN_AMOUNT);
      await seedPkf([contract], INITIAL_TOKEN_AMOUNT);
      await wbnbContract
        .connect(user)
        .approve(contract.address, toBigNumber(1, WBNB_DECIMALS));

      await contract
        .connect(user)
        .swap(
          wbnbContract.address,
          pkfContract.address,
          toBigNumber(1, WBNB_DECIMALS)
        );

      expect(await pkfContract.balanceOf(user.address)).to.equal(
        toBigNumber(20, PKF_DECIMALS)
      );
      expect(await wbnbContract.balanceOf(user.address)).to.equal(
        toBigNumber(INITIAL_TOKEN_AMOUNT - 1, WBNB_DECIMALS)
      );

      expect(await pkfContract.balanceOf(contract.address)).to.equal(
        toBigNumber(INITIAL_TOKEN_AMOUNT - 20, PKF_DECIMALS)
      );
      expect(await wbnbContract.balanceOf(contract.address)).to.equal(
        toBigNumber(1, WBNB_DECIMALS)
      );
    });

    it("handles float number", async () => {
      await contract.modifyRate(
        usdtContract.address,
        wbnbContract.address,
        3,
        1
      );
      await seedUsdt([user], INITIAL_TOKEN_AMOUNT);
      await seedWbnb([contract], INITIAL_TOKEN_AMOUNT);
      await usdtContract
        .connect(user)
        .approve(contract.address, toBigNumber(1, USDT_DECIMALS));

      await contract
        .connect(user)
        .swap(
          usdtContract.address,
          wbnbContract.address,
          toBigNumber(1, USDT_DECIMALS)
        );

      expect(await wbnbContract.balanceOf(user.address)).to.equal(
        toBigNumber("3".repeat(18), 0)
      );
      expect(await usdtContract.balanceOf(user.address)).to.equal(
        toBigNumber(INITIAL_TOKEN_AMOUNT - 1, USDT_DECIMALS)
      );

      expect(await wbnbContract.balanceOf(contract.address)).to.equal(
        toBigNumber(`99${"6".repeat(17)}7`, 0)
      );
      expect(await usdtContract.balanceOf(contract.address)).to.equal(
        toBigNumber(1, USDT_DECIMALS)
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
      await seedWbnb([user], INITIAL_TOKEN_AMOUNT);
      await seedUsdt([contract], INITIAL_TOKEN_AMOUNT);

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
      await seedWbnb([user], INITIAL_TOKEN_AMOUNT);
      await seedUsdt([contract], INITIAL_TOKEN_AMOUNT);

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
      await seedWbnb([user], INITIAL_TOKEN_AMOUNT);
      await seedUsdt([contract], INITIAL_TOKEN_AMOUNT);

      const swap = contract
        .connect(user)
        .swap(
          wbnbContract.address,
          usdtContract.address,
          toBigNumber(5000, WBNB_DECIMALS)
        );

      await expect(swap).to.be.revertedWith("You do not have enough tokens");
    });

    it("revert if contract does not have enought token", async () => {
      await contract.modifyRate(
        pkfContract.address,
        usdtContract.address,
        1,
        1
      );

      await seedPkf([user], INITIAL_TOKEN_AMOUNT);

      const swap = contract
        .connect(user)
        .swap(
          pkfContract.address,
          usdtContract.address,
          toBigNumber(30, PKF_DECIMALS)
        );

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

      await seedPkf([user], INITIAL_TOKEN_AMOUNT);
      await seedUsdt([contract], INITIAL_TOKEN_AMOUNT);

      const swap = contract
        .connect(user)
        .swap(
          pkfContract.address,
          usdtContract.address,
          toBigNumber(1, PKF_DECIMALS)
        );

      await expect(swap).to.be.revertedWith(
        "ERC20: transfer amount exceeds allowance"
      );
    });
  });
});
