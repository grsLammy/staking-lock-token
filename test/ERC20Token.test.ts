import { ethers,waffle } from "hardhat";
import { use, expect } from "chai";
import { MockTokenERC20 } from "../typechain-types";
import { setupUsers } from "./utils/setupUsers";
use(waffle.solidity);

type User = { address: string } & { mockToken: MockTokenERC20 };

describe("MockTokenERC20.sol", async () => {
    let users: User[],
        owner: User,
        user1: User,
        mockToken: MockTokenERC20

    beforeEach(async () => {
        const signers = await ethers.getSigners();

        // Deploy MockTokenERC20.sol smart contract
        const tokenFactory = await ethers.getContractFactory("MockTokenERC20");
        mockToken = (await (await tokenFactory.deploy()).deployed()) as MockTokenERC20;

        // Setup users
        const addresses = await Promise.all(signers.map(async (signer) => signer.getAddress()));
        users = await setupUsers(addresses, { mockToken });
        owner = users[0];
        user1 = users[1];
    });

    it("The contract should have an address", async() => {
        expect(mockToken.address).to.not.equal("0x00");
    })

    it("Name of the token should be ERC20 MockToken", async() => {
        const name = await mockToken.name();
        expect(name).to.be.eq("ERC20 MockToken");
    })

    it("Symbol of the token should be MockToken", async() => {
        const symbol = await mockToken.symbol();
        expect(symbol).to.be.eq("MockToken");
    })

    it("Total Supply of the token should be 1 billion ethers", async() => {
        const balance = ethers.utils.parseEther("1000000000");
        const balanceInContract = await mockToken.totalSupply();
        expect(balanceInContract).to.be.eq(balance);
    })

    it("The owner of the smart contract should have all supply of token", async() => {
        const balanceOfOwner = await mockToken.balanceOf(owner.address);
        const totalSupply = await mockToken.totalSupply();
        expect(balanceOfOwner).to.be.eq(totalSupply);
    })

    it("The owner should be able to mint more tokens and store it in the token contract", async() => {
        const addOneEther = ethers.utils.parseEther("1");
        await owner.mockToken.mintERC20(mockToken.address, addOneEther);
        const balance = ethers.utils.parseEther("1000000001");
        const balanceInContract = await mockToken.totalSupply();
        expect(balanceInContract).to.be.eq(balance);
    })

    it("The owner should be able to mint more tokens directly to owner address", async() => {
        const addOneEther = ethers.utils.parseEther("1");
        await owner.mockToken.mintERC20(owner.address, addOneEther);
        const balance = ethers.utils.parseEther("1000000001");
        const balanceOfOwner = await mockToken.balanceOf(owner.address);
        expect(balanceOfOwner).to.be.eq(balance);
    })

    it("The users should not be able to mint more tokens", async() => {
        const addOneEther = ethers.utils.parseEther("1");
        await expect(user1.mockToken.mintERC20(mockToken.address, addOneEther)).to.be.revertedWith(
            "Ownable: caller is not the owner"
        );
    });
});