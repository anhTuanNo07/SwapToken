// @ts-ignore
import { ethers, upgrades } from 'hardhat';
// import { MarketplaceFactory, Marketplace, } from '../typechain';

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    console.log("Account balance:", (await deployer.getBalance()).toString());

  // @ts-ignore
    const SwapTokenFactory = await ethers.getContractFactory("SwapTokenV2");
    const swapToken = await upgrades.upgradeProxy("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", SwapTokenFactory,);
    console.log("Marketplace upgraded:", swapToken.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
