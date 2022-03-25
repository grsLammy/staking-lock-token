//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract StakingTokens is Pausable, ReentrancyGuard, Ownable {

    using Address for address;

    // Address of the token smart contracts
    address public mockTokenERC20Address;
    address public mockTokenERC1155Address;

    // Address of the users who are currently staking
    address [] public stakers;

    // MAPPINGS

    // Stores staking balance of ERC20 token of an account address
    mapping(address => uint256) public stakingBalanceERC20;

    // Stores true if the account has staked ERC20 tokens prevously else stores false
    mapping(address => bool) public userHasStakedERC20;

    // Stores true if the account is currently staking ERC20 tokens at present else stores false
    mapping(address => bool) public userIsStakingERC20;

    // Mapping of user address pointing to tokenid which points to token balance
    mapping(address => mapping(uint256 => uint256)) public stakingBalanceERC1155;

    // Stores true if the account has staked ERC1155 tokens prevously else stores false
    mapping(address => bool) public userHasStakedERC1155;

    // Stores true if the account is currently staking ERC1155 tokens at present else stores false
    mapping(address => bool) public userIsStakingERC1155;

    // EVENTS

    // Event for staking ERC20 tokens
    event StakeERC20Tokens(
        address indexed _from,
        address indexed _to,
        uint256 indexed _amount
    );

    // Event for unstaking ERC20 tokens
    event UnstakeERC20Tokens(
        address indexed _from,
        address indexed _to,
        uint256 indexed _amount
    );

    // Event for staking ERC1155 tokens
    event StakeERC1155Tokens(
        address indexed _from,
        address _to,
        uint256 indexed _id,
        uint256 indexed _amount
    );

    // Event for unstaking ERC1155 tokens
    event UnstakeERC1155Tokens(
        address _from,
        address indexed _to,
        uint256 indexed _id,
        uint256 indexed _amount
    );

    // CONSTRUCTOR

    constructor(
        address _mockTokenERC20Address,
        address _mockTokenERC1155Address
        ){
        // Require statement to check if the address is a valid contract
        require(
            _mockTokenERC20Address.isContract(),
            "_mockTokenERC20Address must be a contract"
        );
        // Require statement to check if the address is a valid contract
        require(
            _mockTokenERC1155Address.isContract(),
            "_mockTokenERC1155Address must be a contract"
        );

        super._pause(); // Set the pause value to true 

        // Assign the address of tokens smart contract
        mockTokenERC20Address = _mockTokenERC20Address;
        mockTokenERC1155Address = _mockTokenERC1155Address;
    }

    // FUNCTION CALLS

    // Function to pause the smart contract
    function pause() external onlyOwner {
        // Function call (Pausable)
        super._pause();
    }

    // Function to unpause the smart contract
    function unpause() external onlyOwner {
        // Function call (Pausable)
        super._unpause();
    }

    // Function to provoke staking for ERC20 tokens
    function stakeERC20Tokens(
        uint256 _stakingAmount
    ) external {
        // Function call
        _stakeERC20Tokens(_stakingAmount);
    }

    // Function to provoke unstaking for ERC20 tokens
    function unstakeERC20Tokens() external whenNotPaused {
        // Function call
        _unstakeERC20Tokens();
    }

    // Function to provoke staking for ERC1155 tokens
    function stakeERC1155Tokens(
        uint256 _id,
        uint256 _stakingAmount
    ) external {
        // Function call
        _stakeERC1155Tokens(_id, _stakingAmount);
    }

    // Function to provoke unstaking for ERC1155 tokens
    function unstakeERC1155Tokens(
        uint256 _id
    ) external whenNotPaused {
        // Function call
        _unstakeERC1155Tokens(_id);
    }

    // This function interface is called at the end of a 'safeTransferFrom'
    // ERC1155TokenReciever interface to accept ERC1155 token transfers
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) public virtual returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    // FUNCTION IMPLEMENTATION

    // Function logic for staking ERC20 tokens
    function _stakeERC20Tokens(
        uint _stakingAmount
    ) private {
        // Require statement to check if the staking amount is a valid amount
        require(
            _stakingAmount > 0,
            "cannot stake 0 ERC20 token"
        );

        // Transfer the ERC20 mock tokens to the contract address for staking
        ERC20(mockTokenERC20Address).transferFrom(
            msg.sender,
            address(this),
            _stakingAmount
        );

        // Update the staking balance of the user
        stakingBalanceERC20[msg.sender] += _stakingAmount;

        // Checks if the user account has previouslt staked
        // If the user has not ever staked then push the user account address to the stakers array
        if(
            !userHasStakedERC20[msg.sender]
            &&
            !userHasStakedERC1155[msg.sender]
        ) stakers.push(msg.sender);

        userIsStakingERC20[msg.sender] = true;   // Set true for user is staking
        userHasStakedERC20[msg.sender] = true;   // Set true for user has staked

        // Emit the event for staking ERC20 tokens
        emit StakeERC20Tokens(
            msg.sender,
            address(this),
            _stakingAmount
        );
    }

    // Function logic for unstaking ERC20 tokens
    function _unstakeERC20Tokens() private {
        // Stores the token amount of user account to balance
        uint256 balance = stakingBalanceERC20[msg.sender];

        // Token for unstaking cannot be 0
        require(
            balance > 0,
            "there is no token to unstake"
        );

        // Transfers the tokens to unstake
        ERC20(mockTokenERC20Address).transfer(
            msg.sender,
            balance
        );

        // Set the staking balance of the user to 0
        stakingBalanceERC20[msg.sender]= 0;
        // Set false for user is staking
        userIsStakingERC20[msg.sender] = false;

        // Emit the event for unstaking ERC20 tokens
        emit UnstakeERC20Tokens(
            address(this),
            msg.sender,
            balance
        );
    }

    // Function logic for staking ERC1155 tokens
    function _stakeERC1155Tokens(
        uint256 _id,
        uint256 _stakingAmount
    ) private {
        // Require statement to check if the token id is a valid id
        require(
            _id > 0,
            "id of the ERC1155 token cannot be 0"
        );

        // Require statement to check if the staking amount is a valid amount
        require(
            _stakingAmount > 0,
            "staking amount cannot be 0"
        );


        // Transfer the ERC1155 mock tokens to the contract address for staking
        ERC1155(mockTokenERC1155Address).safeTransferFrom(
            msg.sender,
            address(this),
            _id,
            _stakingAmount,
            ""
        );

        // Update the staking balance of the user
        stakingBalanceERC1155[msg.sender][_id] += _stakingAmount;

        // Checks if the user account has previouslt staked
        // If the user has not ever staked then push the user account address to the stakers array
        if(
            !userHasStakedERC20[msg.sender]
            &&
            !userHasStakedERC1155[msg.sender]
        ) stakers.push(msg.sender);
        
        userHasStakedERC1155[msg.sender] = true;    // Set true for user has staked
        userIsStakingERC1155[msg.sender] = true;    // Set true for user is staking
        
        // Emit the event for staking ERC1155 tokens
        emit StakeERC1155Tokens(
            msg.sender,
            address(this),
            _id,
            _stakingAmount
        );
    }

    // Function logic for unstaking ERC1155 tokens
    function _unstakeERC1155Tokens(
        uint256 _id
    ) private whenNotPaused {
        // Stores the token amount of user accout to balance
        uint256 balance = stakingBalanceERC1155[msg.sender][_id];

        // Token for unstaking cannot be 0
        require(
            balance > 0,
            "there is no token to unstake"
        );

        // Transfer the tokens to unstake
        ERC1155(mockTokenERC1155Address).safeTransferFrom(
            address(this),
            msg.sender,
            _id,
            balance,
            ""
        );

        // Set the staking balance of the user to 0
        stakingBalanceERC1155[msg.sender][_id] = 0;

        // Emit the event for unstaking ERC1155 tokens
        emit UnstakeERC1155Tokens(
            address(this),
            msg.sender,
            _id,
            balance
        );
    }
}

