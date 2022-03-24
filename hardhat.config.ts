import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@nomiclabs/hardhat-etherscan";
import dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
dotenv.config();

const config: HardhatUserConfig = {
    solidity: "0.8.4",
    networks: {
        rinkeby: {
            url: process.env.RINKEBY_URL, //Alchemy url with projectId
            accounts: [process.env.PRIVATE_KEY as string], // add the account that will deploy the contract (private key)
            gas: 4612388,
        },
    },
	etherscan: {
        apiKey: process.env.EXPLORER_API_KEY || "",
    },
};

export default config;