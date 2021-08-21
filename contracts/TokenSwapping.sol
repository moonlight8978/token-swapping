// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenSwapping is Ownable {
    struct Rate {
        uint256 from;
        uint256 to;
    }

    mapping(address => mapping(address => Rate)) private _rates;

    modifier rateExist(address _tokenFrom, address _tokenTo) {
        Rate memory rate = getRate(_tokenFrom, _tokenTo);
        require(rate.from > 0 && rate.to > 0, "Token cannot be exchanged");
        _;
    }

    modifier hasEnoughBalance(
        uint256 _balance,
        uint256 _amountToSent,
        string memory _descriptor
    ) {
        require(_balance >= _amountToSent, _descriptor);
        _;
    }

    modifier sentEnoughFunds(uint256 _amount) {
        require(_amount > 0, "Please increase the amount to trade");
        _;
    }

    function withdraw(uint256 _amount) external onlyOwner {
        _sendEther(payable(owner()), _amount);
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
    )
        external
        payable
        rateExist(_tokenFrom, _tokenTo)
        sentEnoughFunds(_tokenFrom == address(0) ? msg.value : _amountToSwap)
    {
        Rate memory rate = getRate(_tokenFrom, _tokenTo);
        uint256 amountToReceive;

        if (_tokenFrom == address(0)) {
            _amountToSwap = msg.value;
            amountToReceive = _exchange(_amountToSwap, rate);
            IERC20 tokenTo = IERC20(_tokenTo);
            _sendToken(tokenTo, msg.sender, amountToReceive);
            return;
        }

        amountToReceive = _exchange(_amountToSwap, rate);
        IERC20 tokenFrom = IERC20(_tokenFrom);
        _takeToken(tokenFrom, msg.sender, _amountToSwap);

        if (_tokenTo == address(0)) {
            _sendEther(payable(msg.sender), amountToReceive);
        } else {
            IERC20 tokenTo = IERC20(_tokenTo);
            _sendToken(tokenTo, msg.sender, amountToReceive);
        }
    }

    receive() external payable {}

    fallback() external {}

    function _exchange(uint256 _fromAmount, Rate memory _rate)
        private
        pure
        returns (uint256)
    {
        return (_fromAmount * _rate.to) / _rate.from;
    }

    function _takeToken(
        IERC20 token,
        address _from,
        uint256 _amount
    )
        private
        hasEnoughBalance(
            token.balanceOf(_from),
            _amount,
            "You do not have enough tokens"
        )
    {
        token.transferFrom(_from, address(this), _amount);
    }

    function _sendToken(
        IERC20 token,
        address _to,
        uint256 _amount
    )
        private
        hasEnoughBalance(
            token.balanceOf(address(this)),
            _amount,
            "We do not have enough tokens. Please try again"
        )
        sentEnoughFunds(_amount)
    {
        token.transfer(_to, _amount);
    }

    function _sendEther(address payable _to, uint256 _amount)
        private
        hasEnoughBalance(
            address(this).balance,
            _amount,
            "We do not have enough tokens. Please try again"
        )
        sentEnoughFunds(_amount)
    {
        /**
         * https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/
         */
        (bool sent, ) = _to.call{value: _amount}("");
        require(sent, "Failed to sent ether");
    }

    function getRate(address _tokenFrom, address _tokenTo)
        public
        view
        returns (Rate memory)
    {
        return _rates[_tokenFrom][_tokenTo];
    }

    function _setRate(
        address _tokenFrom,
        address _tokenTo,
        uint256 _fromAmount,
        uint256 _toAmount
    ) private {
        Rate memory rate = Rate(_fromAmount, _toAmount);
        _rates[_tokenFrom][_tokenTo] = rate;
    }
}
