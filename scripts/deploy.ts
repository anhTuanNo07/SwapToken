import { SwapToken } from './../typechain-types/SwapToken';
import { SwapToken__factory } from './../typechain-types/factories/SwapToken__factory';
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, upgrades } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account: ', deployer.address);

  console.log("Account balance: ", (await (await deployer.getBalance()).toString()));

  const swapToken = await (await upgrades.deployProxy(
    new SwapToken__factory(deployer),
    [],
    { initializer: '__Swap_init' }
  )).deployed() as SwapToken;

  console.log("Swap token address: ", swapToken.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
