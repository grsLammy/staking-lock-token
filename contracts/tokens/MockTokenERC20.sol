//SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockTokenERC20 is ERC20, Ownable {

    constructor() ERC20("ERC20 MockToken", "MockToken") {
        uint256 totalSupply = 1000000000 ether; // 1 billion supply
        _mint(msg.sender, totalSupply);
    }

    // Funtion to mint more tokens
    function mintERC20(
        address account, 
        uint256 amount
    ) external onlyOwner {
        _mint(account,amount);
    }
}