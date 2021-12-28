// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SwapToken is Ownable {

    mapping(address => mapping(address => uint256[2])) rate;

    modifier haveSetRate(address _token1, address _token2) {
        require(
            rate[_token1][_token2][0] != 0 || rate[_token2][_token1][0] != 0,
            "have not set rate"
        );
        _;
    }

    function setRate(address _tokenA, address _tokenB, uint256[2] memory _rate) external onlyOwner {
        if(rate[_tokenB][_tokenA][0] != 0) {
            rate[_tokenB][_tokenA][0] = _rate[1];
            rate[_tokenB][_tokenA][1] = _rate[0];
        } else {
            rate[_tokenA][_tokenB][0] = _rate[0];
            rate[_tokenA][_tokenB][1] = _rate[1];
        }
    }

    function swap(address _transferAddress, address _token1, address _token2, uint _amount1) external haveSetRate(_token1, _token2) {
        if(rate[_token1][_token2][0] != 0) {
            uint _amount2 = _amount1 * rate[_token1][_token2][1] / rate[_token1][_token2][0];
            _swap(msg.sender, _transferAddress, _token1, _token2, _amount1, _amount2);
        } else {
            uint _amount2 = _amount1 * rate[_token2][_token1][0] / rate[_token2][_token1][1];
            _swap(msg.sender, _transferAddress, _token1, _token2, _amount1, _amount2);
        }
    }

    function _swap(address _owner1, address _owner2, address _token1, address _token2, uint _amount1, uint _amount2) internal {
        IERC20 token1 = IERC20(_token1);
        IERC20 token2 = IERC20(_token2);
        require(msg.sender == _owner1 || msg.sender == _owner2, "Not authorized");
        require(
            token1.allowance(_owner1, address(this)) >= _amount1,
            "Token 1 allowance too low"
        );

        if(_owner2 != address(this)) {
            require(
                token2.allowance(_owner2, address(this)) >= _amount2,
                "Token 2 allowance too low"
            );
            _safeTransferFrom(token1, _owner1, _owner2, _amount1);
            _safeTransferFrom(token2, _owner2, _owner1, _amount2);            
        } else {
            _safeTransferFrom(token1, _owner1, _owner2, _amount1);
            token2.transfer(_owner1, _amount2);
        }
    }

    function _safeTransferFrom(
        IERC20 _token,
        address _sender,
        address _recipient,
        uint _amount
    ) private {
        bool sent = _token.transferFrom(_sender, _recipient, _amount);
        require(sent, "Token transfer failed");
    }
}