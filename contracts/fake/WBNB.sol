// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WBNB is ERC20 {
    constructor(uint256 initialBalance) ERC20("Wrapped BNB", "WBNB") {
        _mint(msg.sender, initialBalance);
    }

    function decimals() public view virtual override returns (uint8) {
        return 18;
    }
}
