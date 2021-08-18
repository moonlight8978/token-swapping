// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract TokenSwapping is Ownable {
    using SafeMath for uint256;

    mapping(address => mapping(address => uint256)) public rates;

    function modifyRate(
        address _tokenFrom,
        address _tokenTo,
        uint256 rate
    ) external onlyOwner {
        require(rate >= 1, "Rate must be greater than 1");
        _setRate(_tokenFrom, _tokenTo, rate);
    }

    function swap(
        address _tokenFrom,
        address _tokenTo,
        uint256 _amountToSwap
    ) external {
        require(rates[_tokenFrom][_tokenTo] > 0, "Token cannot be exchanged");

        IERC20 tokenFrom = IERC20(_tokenFrom);
        IERC20 tokenTo = IERC20(_tokenTo);
        uint256 amountToReceive = _amountToSwap.mul(
            rates[_tokenFrom][_tokenTo]
        );

        require(
            tokenFrom.transferFrom(msg.sender, address(this), _amountToSwap),
            "You do not have enough token"
        );
        require(
            tokenTo.transferFrom(address(this), msg.sender, amountToReceive),
            "We do not have enough stock. Please try again"
        );
    }

    function _setRate(
        address _tokenFrom,
        address _tokenTo,
        uint256 rate
    ) private {
        rates[_tokenFrom][_tokenTo] = rate;
    }
}
