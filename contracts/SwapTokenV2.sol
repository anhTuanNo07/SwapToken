// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract SwapTokenV2 is Initializable, OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // mapping
    mapping(address => Rate) public tokenToRate;

    // modifier
    modifier haveSetRate(address _token1, address _token2) {
        require(
            tokenToRate[_token1].rate != 0 && tokenToRate[_token2].rate != 0,
            "have not set rate"
        );
        _;
    }

    // struct 
    struct Rate {
        uint256 rate;
        uint32 decimal;
    }

    // Initialize
    function __Swap_init() public initializer {
        __Ownable_init();
    }

    // The rate is normalized relatively with the native token
    function setRate(address _token, uint256 _rate, uint32 _decimal) external onlyOwner {
        tokenToRate[_token].rate = _rate;
        tokenToRate[_token].decimal = _decimal;
    }

    // function swap(address _tokenIn, address _tokenOut, uint256 _amountIn) external haveSetRate(_tokenIn, _tokenOut) {
    //     // multiple first to reduce error 
    //     uint256 _amountOut = _amountIn * tokenToRate[_tokenOut].rate * 10 ** tokenToRate[_tokenIn].decimal 
    //     / (tokenToRate[_tokenIn].rate * 10 ** tokenToRate[_tokenOut].decimal);

    //     _swap(_tokenIn, _tokenOut, _amountIn, _amountOut);
    // }

    function withdraw(address _token, uint256 _amount, address _receiver) external payable onlyOwner {
        if(_token == address(0)) {
            (bool sent, ) = _receiver.call{value: _amount}("");
            require(sent, "failed to transfer token");
            return;
        }
        IERC20Upgradeable token = IERC20Upgradeable(_token);
        token.transfer(_receiver, _amount);
    }

    receive() external payable {}

    // internal function
    function _swap(address _tokenIn, address _tokenOut, uint256 _amountIn, uint256 _amountOut) internal {
        require(_tokenIn != _tokenOut, "Can not transfer the same token");
        _handleIncome(_tokenIn, msg.sender, _amountIn);
        _handleOutcome(_tokenOut, msg.sender, _amountOut);
    }
    
    function _handleIncome(address _tokenIn, address _sender, uint256 _amountIn) internal {
        IERC20Upgradeable tokenIn = IERC20Upgradeable(_tokenIn);
        if(_tokenIn == address(0)) {
            (bool sent, ) = address(this).call{value: _amountIn}("");
            require(sent, "transfer income token failed");
            return;
        }
        tokenIn.safeTransferFrom(_sender, address(this), _amountIn);
    }

    function _handleOutcome(address _tokenOut, address _receiver, uint256 _amountOut) internal {
        IERC20Upgradeable tokenOut = IERC20Upgradeable(_tokenOut);
        if(_tokenOut == address(0)) {
            (bool sent, ) = _receiver.call{value: _amountOut}("");
            require(sent, "transfer outcome token failed");
            return;
        }
        tokenOut.transfer(_receiver, _amountOut);
    }
}