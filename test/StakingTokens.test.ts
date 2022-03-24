import { ethers,waffle } from "hardhat";
import { use, expect } from "chai";
import { StakingTokens, MockTokenERC1155, MockTokenERC20 } from "../typechain-types";
import { setupUsers } from "./utils/setupUsers";
import { BigNumber } from "ethers";
use(waffle.solidity);

type User = { address: string } & { stakingTokens: StakingTokens, tokenERC20: MockTokenERC20, tokenERC1155: MockTokenERC1155 };

describe("StakingTokens.sol", async() => {
    let users: User[],
        owner: User,
        user1: User,
        stakingTokens: StakingTokens,
        tokenERC20: MockTokenERC20,
        tokenERC1155: MockTokenERC1155

    beforeEach(async() => {
        const signers = await ethers.getSigners();

        // Deploy MockTokenERC20.sol smart contract
        const tokenERC20Factory = await ethers.getContractFactory("MockTokenERC20");
        tokenERC20 = (await (await tokenERC20Factory.deploy()).deployed()) as MockTokenERC20;

        // Deploy MockTokenERC1155.sol smart contract
        const tokenERC1155Factory = await ethers.getContractFactory("MockTokenERC1155");
        tokenERC1155 = (await (await tokenERC1155Factory.deploy()).deployed()) as MockTokenERC1155;
    
        // Deploy StakingTokens.sol smart contract
        const stakingTokensFactory = await ethers.getContractFactory("StakingTokens");
        stakingTokens = (await (
            await stakingTokensFactory.deploy(tokenERC20.address, tokenERC1155.address)
        ).deployed()) as StakingTokens;
    
        // Setup users
        const addresses = await Promise.all(signers.map(async (signer) => signer.getAddress()));
        users = await setupUsers(addresses, { stakingTokens, tokenERC20, tokenERC1155 });
        owner = users[0];
        user1 = users[1];

        // Mint some tokens to the user address
        const balance = BigNumber.from(ethers.utils.parseEther("100"));
        await owner.tokenERC20.mintERC20(user1.address, balance);
        await owner.tokenERC1155.mintBatchMockERC1155(user1.address, [1,2], [balance, 1], []);
    });

    it("The owner should have some tokens to test", async() => {
        // Check if the owner has 1 billion ERC20 tokens
        const balanceOfOwner = await tokenERC20.balanceOf(owner.address);
        const balance = BigNumber.from(ethers.utils.parseEther("1000000000"));
        expect(balanceOfOwner).to.be.eq(balance);
        
        // Checks if the owner has 1 billion ERC1155 token of id 1
        const balanceToken1 = await tokenERC1155.balanceOf(owner.address, 1);
        expect(balanceToken1).to.be.eq(balance);

        // Check if the owner has 1 token (NFT) of token id 2
        const balanceOfToken2 = await tokenERC1155.balanceOf(owner.address, 2);
        expect(balanceOfToken2).to.be.eq(1);
    })

    it("The user should have some tokens to test", async() => {
        // Check if the user has 100 ERC20 tokens
        const balanceOfUser = await tokenERC20.balanceOf(user1.address);
        const balance = BigNumber.from(ethers.utils.parseEther("100"));
        expect(balanceOfUser).to.be.eq(balance);

        // Check if the user has 100 ERC1155 token of id 1
        expect(await tokenERC1155.balanceOf(user1.address, 1)).to.be.eq(balance);

        // Check if the user has 1 token (NFT) of token id 2
        expect(await tokenERC1155.balanceOf(user1.address, 2)).to.be.eq(1);
    })

    it("User can stake: ERC20 tokens", async() => {

        // Balance of user1 before staking
        const balanceOfUserBeforeStake = await tokenERC20.balanceOf(user1.address);

        // Staking amount for user1
        const stakingAmount = BigNumber.from(ethers.utils.parseEther("100"));

        // Approve for user1 to stake all of his ERC20 token
        await user1.tokenERC20.approve(stakingTokens.address, stakingAmount);

        // Stake all avaliable ERC20 token for the user1
        await user1.stakingTokens.stakeERC20Tokens(stakingAmount);

        // Balance of user1 after staking
        const balanceOfUserAfterStake = await tokenERC20.balanceOf(user1.address);

        // Check that the amount is equal to 0 after staking
        expect(balanceOfUserAfterStake).to.be.eq(balanceOfUserBeforeStake.sub(stakingAmount))
    })

    it("User can stake: ERC1155 token ID 1", async() => {
        
        // Balance of user1 before staking
        const balanceOfUserBeforeStake = await tokenERC1155.balanceOf(user1.address, 1);

        // Staking amount for user1
        const stakingAmount = BigNumber.from(ethers.utils.parseEther("100"));

        // Approve for user1 to stake all of his ERC1155 token id 1
        await user1.tokenERC1155.setApprovalForAll(stakingTokens.address, true);

        // Stake all avaliable ERC1155 token id 1 for the user 1
        await user1.stakingTokens.stakeERC1155Tokens(1, stakingAmount);

        // Balance of user1 after staking
        const balanceOfUserAfterStake = await tokenERC1155.balanceOf(user1.address, 1);

        // Check that the amount is equal to 0 of token id 1 after staking
        expect(balanceOfUserAfterStake).to.be.eq(balanceOfUserBeforeStake.sub(stakingAmount));
    })

    it("User can stake: ERC1155 token ID 2", async() => {
        
        // Balance of user1 before staking
        const balanceOfUserBeforeStake = await tokenERC1155.balanceOf(user1.address, 2);

        // Staking amount for user1
        const stakingAmount = 1;

        // Approve for user1 to stake all of his ERC1155 token id 2
        await user1.tokenERC1155.setApprovalForAll(stakingTokens.address, true);

        // Stake all avaliable ERC1155 token id 1 for the user 2
        await user1.stakingTokens.stakeERC1155Tokens(2, stakingAmount);

        // Balance of user1 after staking
        const balanceOfUserAfterStake = await tokenERC1155.balanceOf(user1.address, 2);

        // Check that the amount is equal to 0 of token id 1 after staking
        expect(balanceOfUserAfterStake).to.be.eq(balanceOfUserBeforeStake.sub(stakingAmount));
    })

    it("Smart Contract: Paused (users can't unstake)", async() => {
        let isPaused = await stakingTokens.paused()
        expect(isPaused).to.be.eq(true);
    })

    it("Users can't unstake: ERC20 tokens", async() => {
        await expect(user1.stakingTokens.unstakeERC20Tokens()).to.be.revertedWith(
            "Pausable: paused"
        )
    })

    it("Users can't unstake: ERC1155 token ID 1", async() => {
        await expect(user1.stakingTokens.unstakeERC1155Tokens(1)).to.be.revertedWith(
            "Pausable: paused"
        )
    })

    it("Users can't unstake: ERC1155 token ID 2", async() => {
        await expect(user1.stakingTokens.unstakeERC1155Tokens(2)).to.be.revertedWith(
            "Pausable: paused"
        )
    })

    it("Smart Contract: Unpaused", async() => {
        await owner.stakingTokens.unpause()
        let unPaused = await stakingTokens.paused()
        expect(unPaused).to.be.eq(false);
    })

    it("Users can unstake: ERC20 tokens", async() => {

        // Balance of user1 before staking
        const balanceOfUserBeforeStake = await tokenERC20.balanceOf(user1.address);

        // Staking amount for user1
        const stakingAmount = BigNumber.from(ethers.utils.parseEther("100"));

        // Approve for user1 to stake all of his ERC20 token
        await user1.tokenERC20.approve(stakingTokens.address, stakingAmount);

        // Stake all avaliable ERC20 token for the user1
        await user1.stakingTokens.stakeERC20Tokens(stakingAmount);

        // Balance of user1 after staking
        const balanceOfUserAfterStake = await tokenERC20.balanceOf(user1.address);

        // Check that the amount is equal to 0 after staking
        expect(balanceOfUserAfterStake).to.be.eq(balanceOfUserBeforeStake.sub(stakingAmount))

        // unpause the smart contract
        await owner.stakingTokens.unpause()
        // unstake the tokens
        await expect(user1.stakingTokens.unstakeERC20Tokens()).to.not.revertedWith(
            "Pausable: paused"
        )

        const balanceAfterUnstake = await tokenERC20.balanceOf(user1.address);
        expect(balanceAfterUnstake).to.be.eq(balanceOfUserBeforeStake);
    })

    it("User can unstake: ERC1155 token ID 1", async() => {
        
        // Balance of user1 before staking
        const balanceOfUserBeforeStake = await tokenERC1155.balanceOf(user1.address, 1);

        // Staking amount for user1
        const stakingAmount = BigNumber.from(ethers.utils.parseEther("100"));

        // Approve for user1 to stake all of his ERC1155 token id 1
        await user1.tokenERC1155.setApprovalForAll(stakingTokens.address, true);

        // Stake all avaliable ERC1155 token id 1 for the user 1
        await user1.stakingTokens.stakeERC1155Tokens(1, stakingAmount);

        // Balance of user1 after staking
        const balanceOfUserAfterStake = await tokenERC1155.balanceOf(user1.address, 1);

        // Check that the amount is equal to 0 of token id 1 after staking
        expect(balanceOfUserAfterStake).to.be.eq(balanceOfUserBeforeStake.sub(stakingAmount));

        // unpause the smart contract
        await owner.stakingTokens.unpause()
        // unstake the tokens
        await expect(user1.stakingTokens.unstakeERC1155Tokens(1)).to.not.revertedWith(
            "Pausable: paused"
        )

        const balanceAfterUnstake = await tokenERC1155.balanceOf(user1.address, 1);
        expect(balanceAfterUnstake).to.be.eq(balanceOfUserBeforeStake);
    })

    it("User can unstake: ERC1155 token ID 2", async() => {
        
        // Balance of user1 before staking
        const balanceOfUserBeforeStake = await tokenERC1155.balanceOf(user1.address, 2);

        // Staking amount for user1
        const stakingAmount = 1;

        // Approve for user1 to stake all of his ERC1155 token id 2
        await user1.tokenERC1155.setApprovalForAll(stakingTokens.address, true);

        // Stake all avaliable ERC1155 token id 1 for the user 2
        await user1.stakingTokens.stakeERC1155Tokens(2, stakingAmount);

        // Balance of user1 after staking
        const balanceOfUserAfterStake = await tokenERC1155.balanceOf(user1.address, 2);

        // Check that the amount is equal to 0 of token id 1 after staking
        expect(balanceOfUserAfterStake).to.be.eq(balanceOfUserBeforeStake.sub(stakingAmount));

        // unpause the smart contract
        await owner.stakingTokens.unpause()
        // unstake the tokens
        await expect(user1.stakingTokens.unstakeERC1155Tokens(2)).to.not.revertedWith(
            "Pausable: paused"
        )
        
        const balanceAfterUnstake = await tokenERC1155.balanceOf(user1.address, 2);
        expect(balanceAfterUnstake).to.be.eq(balanceOfUserBeforeStake);
    })

})
