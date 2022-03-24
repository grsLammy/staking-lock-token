import { ethers, run } from "hardhat";
import {
    MockTokenERC20,
    MockTokenERC1155,
    StakingTokens,
    MockTokenERC20__factory,
    MockTokenERC1155__factory,
    StakingTokens__factory
} from "../typechain-types";

async function main() {

    // MockTokenERC20.sol Deploy
    const mockTokenERC20Factory = (await ethers.getContractFactory(
        "MockTokenERC20"
    )) as MockTokenERC20__factory;

    const mockTokenERC20 = (await mockTokenERC20Factory.deploy()) as MockTokenERC20;
    await mockTokenERC20.deployed(); // this waits for tx to be mined

    try {
        await run("verify:verify", {
            address: mockTokenERC20.address,
            contract: "contracts/tokens/MockTokenERC20.sol:MockTokenERC20",
            constructorArguments: [],
        });
    } catch (e: any) {
        console.error(`error in verifying: ${e.message}`);
    }

    // MockTokenERC1155.sol Deploy
    const mockTokenERC1155Factory = (await ethers.getContractFactory(
        "MockTokenERC1155"
    )) as MockTokenERC1155__factory;

    const mockTokenERC1155 = (await mockTokenERC1155Factory.deploy()) as MockTokenERC1155;
    await mockTokenERC1155.deployed(); // this waits for tx to be mined

    try {
        await run("verify:verify", {
            address: mockTokenERC1155.address,
            contract: "contracts/tokens/MockTokenERC1155.sol:MockTokenERC1155",
            constructorArguments: [],
        });
    } catch (e: any) {
        console.error(`error in verifying: ${e.message}`);
    }

    // StakingTokens.sol Deploy
    const stakingTokensFactory = (await ethers.getContractFactory(
        "StakingTokens"
    )) as StakingTokens__factory;

    const stakingTokens = (await stakingTokensFactory.deploy(
        mockTokenERC20.address,
        mockTokenERC1155.address
    )) as StakingTokens;

    await stakingTokens.deployed(); // this waits for tx to be mined

    try {
        await run("verify:verify", {
            address: stakingTokens.address,
            contract: "contracts/StakingTokens.sol:StakingTokens",
            constructorArguments: [],
        });
    } catch (e:any) {
        console.error(`error in verifying: ${e.message}`);
    }

    console.log("Mock ERC20 Tokens deployed to:", mockTokenERC20.address);
    console.log("Mock ERC1155 Tokens  deployed to:", mockTokenERC1155.address);
    console.log("StakingTokens contract deployed to:", stakingTokens.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });