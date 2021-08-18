// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Example class - a mock class using delivering from ERC20
contract USDT is ERC20 {
    constructor(uint256 initialBalance) ERC20("Tether USD", "USDT") {
        _mint(msg.sender, initialBalance);
    }
}

contract PKF is ERC20 {
    constructor(uint256 initialBalance) ERC20("PolkaFoundary Token", "PKF") {
        _mint(msg.sender, initialBalance);
    }
}
