// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract TokenSwapping is Ownable {
    using SafeMath for uint256;

    mapping(address => mapping(address => uint256[2])) private _rates;

    modifier rateExist(address _tokenFrom, address _tokenTo) {
        uint256[2] memory rate = getRate(_tokenFrom, _tokenTo);
        require(rate[0] > 0 && rate[1] > 0, "Token cannot be exchanged");
        _;
    }

    function modifyRate(
        address _tokenFrom,
        address _tokenTo,
        uint256 _fromAmount,
        uint256 _toAmount
    ) external onlyOwner {
        require(
            _fromAmount >= 1 && _toAmount >= 1,
            "Rate must be greater than 1"
        );
        _setRate(_tokenFrom, _tokenTo, _fromAmount, _toAmount);
    }

    function swap(
        address _tokenFrom,
        address _tokenTo,
        uint256 _amountToSwap
    ) external rateExist(_tokenFrom, _tokenTo) {
        uint256[2] memory rate = getRate(_tokenFrom, _tokenTo);
        require(_amountToSwap % rate[0] == 0, "Invalid amount to swap");

        IERC20 tokenFrom = IERC20(_tokenFrom);
        IERC20 tokenTo = IERC20(_tokenTo);
        uint256 amountToReceive = _amountToSwap.div(rate[0]).mul(rate[1]);

        require(
            tokenFrom.balanceOf(msg.sender) >= _amountToSwap,
            "You do not have enough tokens"
        );
        require(
            tokenTo.balanceOf(address(this)) >= amountToReceive,
            "We do not have enough tokens. Please try again"
        );

        _takeToken(tokenFrom, msg.sender, _amountToSwap);
        _sendToken(tokenTo, msg.sender, amountToReceive);
    }

    function _takeToken(
        IERC20 token,
        address _from,
        uint256 _amount
    ) private {
        token.transferFrom(_from, address(this), _amount);
    }

    function _sendToken(
        IERC20 token,
        address _to,
        uint256 _amount
    ) private {
        token.transfer(_to, _amount);
    }

    function getRate(address _tokenFrom, address _tokenTo)
        public
        view
        returns (uint256[2] memory)
    {
        return _rates[_tokenFrom][_tokenTo];
    }

    function _setRate(
        address _tokenFrom,
        address _tokenTo,
        uint256 _fromAmount,
        uint256 _toAmount
    ) private {
        uint256[2] memory rate;
        rate[0] = _fromAmount;
        rate[1] = _toAmount;
        _rates[_tokenFrom][_tokenTo] = rate;
    }
}
