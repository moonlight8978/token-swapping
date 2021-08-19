// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDT is ERC20 {
    constructor(uint256 initialBalance) ERC20("Tether USD", "USDT") {
        _mint(msg.sender, initialBalance);
    }

    function decimals() public view virtual override returns (uint8) {
        return 0;
    }
}
