// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract SwapTokenV2 is Initializable, OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    event Deposit(address _sender,uint256 _value,uint256 _balance);
    event Received(address, uint);

    // mapping
    mapping(address => Rate) public tokenToRate;
    mapping(address => uint) public etherDeposit;
    mapping(address => address) public upgradeAddress;

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

    // function swap(address _token1, address _token2, uint _amount1) external haveSetRate(_token1, _token2) {
    //     // multiple first to reduce error 
    //     uint256 _amount2 = _amount1 * tokenToRate[_token2].rate * 10 ** tokenToRate[_token1].decimal 
    //     / (tokenToRate[_token1].rate * 10 ** tokenToRate[_token2].decimal);

    //     _swap(_token1, _token2, _amount1, _amount2);
    // }

    function withdraw(uint256 _amount) external payable onlyOwner {
        (bool sent, ) = msg.sender.call{value: _amount}("");
        require(sent, "failed to transfer token");
    }

    // internal function

    function _swap(address _token1, address _token2, uint _amount1, uint _amount2) internal {
        IERC20Upgradeable token1 = IERC20Upgradeable(_token1);
        IERC20Upgradeable token2 = IERC20Upgradeable(_token2);

        if (_token1 == address(0)) {
            (bool sent, ) = address(this).call{value: _amount1}("");
            require(sent, "failed to transfer token");
            token2.transfer(msg.sender, _amount2);
            return;
        }

        if (_token2 == address(0)) {
            token1.safeTransferFrom(msg.sender, address(this), _amount1);
            (bool sent, ) = msg.sender.call{value: _amount2}("");
            require(sent, "failed to transfer token");
            return;
        }

        token1.safeTransferFrom(msg.sender, address(this), _amount1);
        token2.transfer(msg.sender, _amount2);
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
}