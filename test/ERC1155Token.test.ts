import { ethers,waffle } from "hardhat";
import { use, expect } from "chai";
import { MockTokenERC1155 } from "../typechain-types";
import { setupUsers } from "./utils/setupUsers";
import { BigNumber } from "ethers";
use(waffle.solidity);

type User = { address: string } & { mockToken: MockTokenERC1155 };

describe("MockTokenERC1155.sol", async() => {
    let users: User[],
        owner: User,
        user1: User,
        mockToken: MockTokenERC1155

    beforeEach(async() => {
        const signers = await ethers.getSigners();

        // Deploy MockTokenERC20.sol smart contract
        const tokenFactory = await ethers.getContractFactory("MockTokenERC1155");
        mockToken = (await (await tokenFactory.deploy()).deployed()) as MockTokenERC1155;

        // Setup users
        const addresses = await Promise.all(signers.map(async (signer) => signer.getAddress()));
        users = await setupUsers(addresses, { mockToken });
        owner = users[0];
        user1 = users[1];
    });

    it("The tokens should have a valid URI", async() => {
        const uri = "https://api.mysite.com/tokens/{id}";
        const uriToken1 = await mockToken.uri(1);
        const uriToken2 = await mockToken.uri(2);
        expect(uriToken1).to.be.eq(uri);
        expect(uriToken2).to.be.eq(uri);
    })

    it("The owner should have 1 billion ether supply of token id 1", async() => {
        const balance = ethers.utils.parseEther("1000000000");
        const balanceOfOwner = await mockToken.balanceOf(owner.address, 1);
        expect(balanceOfOwner).to.be.eq(balance);
    })

    it("The owner should have only 1 token (NFT) of token id 2", async() => {
        const balanceOfOwner = await mockToken.balanceOf(owner.address, 2);
        expect(balanceOfOwner).to.be.eq(1);
    })

    it("The owner should be able to mint more ERC1155 tokens", async() => {
        await expect(owner.mockToken.mintMockERC1155(owner.address, 3, 1000, [])).to.not.revertedWith(
            "Ownable:caller is not the owner"
        )
        const balanceOfOwner = await mockToken.balanceOf(owner.address, 3);
        expect(balanceOfOwner).to.be.eq(1000);
    })

    it("The owners should be able to mint batch of ERC11155 tokens", async() => {
        await expect(owner.mockToken.mintBatchMockERC1155(owner.address,[4, 5, 6], [1, 90, 50], [])).to.not.revertedWith(
            "Ownable: caller is not the owner"
        );
    })

    it("The user should not be able to mint more ERC1155 tokens", async() => {
        await expect(user1.mockToken.mintMockERC1155(owner.address, 7, 1000, [])).to.be.revertedWith(
            "Ownable: caller is not the owner"
        )
    })

    it("The user should not be able to mint batch of ERC1155 tokens", async() => {
        await expect(user1.mockToken.mintBatchMockERC1155(owner.address,[8, 9, 10], [1, 90, 50], [])).to.be.revertedWith(
            "Ownable: caller is not the owner"
        );
    })
})