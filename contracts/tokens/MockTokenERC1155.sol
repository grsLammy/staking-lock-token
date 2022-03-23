//SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice smart contract that auto mints 2 ERC1155 tokens and also allows only the owner to mint more tokens
contract MockTokenERC1155 is ERC1155, Ownable {
    uint256 public constant TOKEN_1 = 1;
    uint256 public constant  TOKEN_2 = 2;
    uint256 totalSupply = 1000000000 ether; // 1 billion supply

    constructor() ERC1155("https://api.mysite.com/tokens/{id}") {
        _mint(msg.sender, TOKEN_1, totalSupply, ""); //mint 1 billion token for TOKEN_1 (fungible token)
        _mint(msg.sender, TOKEN_2, 1, ""); //mint only 1 token for TOKEN_2 (non-fungible token)
    }

    // function to mint ERC1155 token
    function mintMockERC1155(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external onlyOwner {
        _mint(account, id, amount, data);
    }

    // function to mint ERC1155 token in batch
    function mintBatchMockERC1155(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external onlyOwner {
        _mintBatch(to, ids, amounts, data);
    }
}