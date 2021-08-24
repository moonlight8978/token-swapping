import { accounts, deployer, getToken, tokenSwapping } from "./utils";
import { program, Option } from "commander";
import { ethers } from "ethers";

program
  .version("0.0.1")
  .command("set")
  .addOption(
    new Option("--user <username>", "required").choices([
      "deployer",
      "bob",
      "alice",
    ])
  )
  .option("--from <address>", "From address")
  .option("--to <address>", "To address")
  .option("--amountFrom <value>", "From amount")
  .option("--amountTo <value>", "To amount")
  .action(async (options) => {
    await tokenSwapping
      // @ts-ignore
      .connect(accounts[options.user])
      .modifyRate(
        options.from,
        options.to,
        options.amountFrom,
        options.amountTo
      );
  });

program
  .command("swap")
  .addOption(
    new Option("--user <username>", "required").choices([
      "deployer",
      "bob",
      "alice",
    ])
  )
  .option("--from <tokenAddress>", "From token address")
  .option("--to <tokenAddress>", "To token address")
  .option("--amount <tokenAddress>", "Amount to swap")
  .action(async (options) => {
    if (options.from === ethers.constants.AddressZero) {
      await tokenSwapping
        // @ts-ignore
        .connect(accounts[options.user])
        .swap(options.from, options.to, 0, { value: options.amount });
    } else {
      const token = getToken(options.from);
      await token.approve(tokenSwapping.address, options.amount);
      await tokenSwapping
        // @ts-ignore
        .connect(accounts[options.user])
        .swap(options.from, options.to, options.amount);
    }
  });

program.parse(process.argv);
