// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

interface ERC20Detailed is IERC20, IERC20Metadata {}

contract TokenSwapping is Ownable {
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
        require(_amountToSwap > 0, "Please increase the amount to trade");

        ERC20Detailed tokenFrom = ERC20Detailed(_tokenFrom);
        ERC20Detailed tokenTo = ERC20Detailed(_tokenTo);

        uint256 amountToReceive = _exchange(
            tokenFrom.decimals(),
            _amountToSwap,
            tokenTo.decimals(),
            rate
        );
        require(amountToReceive > 0, "Please increase the amount to trade");

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

    function _exchange(
        uint8 _tokenFromDecimals,
        uint256 _fromAmount,
        uint8 _tokenToDecimals,
        uint256[2] memory _rate
    ) private pure returns (uint256 _toAmount) {
        if (_tokenFromDecimals > _tokenToDecimals) {
            uint8 decimalsDiff = _tokenFromDecimals - _tokenToDecimals;
            _toAmount =
                ((_fromAmount * _rate[1]) / _rate[0]) /
                (10**decimalsDiff);
        } else if (_tokenFromDecimals < _tokenToDecimals) {
            uint8 decimalsDiff = _tokenToDecimals - _tokenFromDecimals;
            _toAmount =
                ((_fromAmount * _rate[1]) * (10**decimalsDiff)) /
                _rate[0];
        } else {
            _toAmount = (_fromAmount * _rate[1]) / _rate[0];
        }
    }

    function _takeToken(
        ERC20Detailed token,
        address _from,
        uint256 _amount
    ) private {
        token.transferFrom(_from, address(this), _amount);
    }

    function _sendToken(
        ERC20Detailed token,
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
