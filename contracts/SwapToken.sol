// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SwapToken is Ownable {
    using SafeERC20 for IERC20;
    event Deposit(address _sender,uint256 _value,uint256 _balance);

    address public nativeToken = address(0);

    // mapping
    mapping(address => Rate) public tokenToRate;
    mapping(address => uint) public etherAllowance;

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

    // The rate is normalized relatively with the native token
    function setRate(address _token, uint256 _rate, uint32 _decimal) external onlyOwner {
        tokenToRate[_token].rate = _rate;
        tokenToRate[_token].decimal = _decimal;
    }

    function swap(address _transferAddress, address _token1, address _token2, uint _amount1) external haveSetRate(_token1, _token2) {
        // multiple first to reduce error 
        uint256 _amount2 = _amount1 * tokenToRate[_token2].rate * 10 ** tokenToRate[_token1].decimal 
        / (tokenToRate[_token1].rate * 10 ** tokenToRate[_token2].decimal);

        _swap(msg.sender, _transferAddress, _token1, _token2, _amount1, _amount2);
    }

    function balanceOf() external view returns(uint) {
        return address(this).balance;
    }

    function approveSendEther() external payable {
        etherAllowance[msg.sender] = etherAllowance[msg.sender] + msg.value;
    }

    function withdraw(uint256 _amount) external payable {
        require(_amount <= etherAllowance[msg.sender], "exceed allowance");
        etherAllowance[msg.sender] =  etherAllowance[msg.sender] - _amount;
        (bool sent, ) = msg.sender.call{value: _amount}("");
        require(sent, "failed to transfer token");
    }

    // internal function

    function _swap(address _owner1, address _owner2, address _token1, address _token2, uint _amount1, uint _amount2) internal {
        IERC20 token1 = IERC20(_token1);
        IERC20 token2 = IERC20(_token2);
        require(msg.sender == _owner1 || msg.sender == _owner2, "Not authorized");

        if (_token1 == nativeToken) {
            (bool sent, ) = _owner2.call{value: _amount1}("");
            require(sent, "failed to transfer token");

            if(_owner2 != address(this)) {
                token2.safeTransferFrom(_owner2, _owner1, _amount2);
                return;
            }
            token2.transfer(_owner1, _amount2);
            return;
        }

        if (_token2 == nativeToken) {
            token1.safeTransferFrom(_owner1, _owner2, _amount1);
            if(_owner2 != address(this)) {
                require(etherAllowance[_owner2] >= _amount2, "not enough allowance");
                etherAllowance[_owner2] = etherAllowance[_owner2] - _amount2;
            }

            (bool sent, ) = _owner1.call{value: _amount2}("");
            require(sent, "failed to transfer token");
            return;
        }

        if(_owner2 != address(this)) {
            token1.safeTransferFrom(_owner1, _owner2, _amount1);
            token2.safeTransferFrom(_owner2, _owner1, _amount2);
            return;         
        }

        token1.safeTransferFrom(_owner1, _owner2, _amount1);
        token2.transfer(_owner1, _amount2);
    }
}