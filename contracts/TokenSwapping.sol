// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenSwapping is Ownable {
    // Treat TokenSwapping contract address as native token
    mapping(address => mapping(address => uint256[2])) private _rates;

    modifier rateExist(address _tokenFrom, address _tokenTo) {
        uint256[2] memory rate = getRate(_tokenFrom, _tokenTo);
        require(rate[0] > 0 && rate[1] > 0, "Token cannot be exchanged");
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
    ) external rateExist(_tokenFrom, _tokenTo) sentEnoughFunds(_amountToSwap) {
        uint256[2] memory rate = getRate(_tokenFrom, _tokenTo);
        IERC20 tokenFrom = IERC20(_tokenFrom);
        IERC20 tokenTo = IERC20(_tokenTo);
        uint256 amountToReceive = _exchange(_amountToSwap, rate);
        _takeToken(tokenFrom, msg.sender, _amountToSwap);
        _sendToken(tokenTo, msg.sender, amountToReceive);
    }

    function swapToNativeToken(address _tokenFromAddress, uint256 _amountToSwap)
        external
        rateExist(_tokenFromAddress, address(this))
        sentEnoughFunds(_amountToSwap)
    {
        IERC20 tokenFrom = IERC20(_tokenFromAddress);
        uint256[2] memory rate = getRate(_tokenFromAddress, address(this));
        uint256 amountToReceive = _exchange(_amountToSwap, rate);
        _takeToken(tokenFrom, msg.sender, _amountToSwap);
        _sendEther(payable(msg.sender), amountToReceive);
    }

    function swapFromNativeToken(address _tokenToAddress)
        external
        payable
        rateExist(address(this), _tokenToAddress)
        sentEnoughFunds(msg.value)
    {
        uint256 _amountToSwap = msg.value;
        IERC20 tokenTo = IERC20(_tokenToAddress);
        uint256[2] memory rate = getRate(address(this), _tokenToAddress);
        uint256 amountToReceive = _exchange(_amountToSwap, rate);
        _sendToken(tokenTo, msg.sender, amountToReceive);
    }

    function _exchange(uint256 _fromAmount, uint256[2] memory _rate)
        private
        pure
        returns (uint256)
    {
        return (_fromAmount * _rate[1]) / _rate[0];
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
