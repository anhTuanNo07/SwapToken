import { SwapToken__factory } from './../typechain-types/factories/SwapToken__factory'
import { ERC20Mock__factory } from './../typechain-types/factories/ERC20Mock__factory'
import { SwapToken } from './../typechain-types/SwapToken'
import { expect } from 'chai'
import { ethers, upgrades } from 'hardhat'
import { ERC20Mock } from './../typechain-types/ERC20Mock'
const { utils, BigNumber } = ethers

describe('Swap ERC20 token', function () {
  let tokenX: ERC20Mock
  let tokenY: ERC20Mock
  let tokenZ: ERC20Mock
  let swapToken: SwapToken
  let deployer: any
  let acc1: any
  let acc2: any
  let acc3: any
  const zeroAddress = '0x0000000000000000000000000000000000000000'
  
  beforeEach(async () => {
    [deployer, acc1, acc2, acc3] = await ethers.getSigners()

    tokenX = await (
      await new ERC20Mock__factory(deployer).deploy(
        'TokenX',
        'TKX',
        100000000,
        18,
      )
    ).deployed()
    tokenY = await (
      await new ERC20Mock__factory(deployer).deploy(
        'TokenY',
        'TKY',
        100000000,
        18,
      )
    ).deployed()
    tokenZ = await (
      await new ERC20Mock__factory(deployer).deploy(
        'TokenZ',
        'TKZ',
        100000000,
        18,
      )
    ).deployed()

    swapToken = (await (
      await upgrades.deployProxy(
        new SwapToken__factory(deployer),
        [],
        { initializer: '__Swap_init' },
      )
    ).deployed()) as SwapToken
    // initial transfer tokenX
    await tokenX.transfer(acc1.address, utils.parseEther('100000'))
    await tokenX.transfer(acc2.address, utils.parseEther('100000'))
    await tokenX.transfer(acc3.address, utils.parseEther('100000'))
    await tokenX.transfer(swapToken.address, utils.parseEther('100000'))

    // initial transfer tokenY
    await tokenY.transfer(acc1.address, utils.parseEther('100000'))
    await tokenY.transfer(acc2.address, utils.parseEther('100000'))
    await tokenY.transfer(acc3.address, utils.parseEther('100000'))
    await tokenY.transfer(swapToken.address, utils.parseEther('100000'))

    // initial transfer tokenZ
    await tokenZ.transfer(acc1.address, utils.parseEther('100000'))
    await tokenZ.transfer(acc2.address, utils.parseEther('100000'))
    await tokenZ.transfer(acc3.address, utils.parseEther('100000'))
    await tokenZ.transfer(swapToken.address, utils.parseEther('100000'))

    // console.log(tx, 'tx')

    // Set Rate for TokenX and TokenY
    await swapToken.connect(deployer).setRate(tokenX.address, 1, 1)

    await swapToken.connect(deployer).setRate(tokenY.address, 2, 1)
  })

  it('swap user with contract', async function () {
    await tokenX
      .connect(acc1)
      .approve(swapToken.address, utils.parseEther('10000'))
    await swapToken
      .connect(acc1)
      .swap(
        tokenX.address,
        tokenY.address,
        utils.parseEther('10000'),
      )
    expect(await tokenY.connect(acc1).balanceOf(acc1.address)).to.equal(
      utils.parseEther('120000'),
    )
  })
    
    it('swap NFT with native token', async function () {
      const options = {value: utils.parseEther("2500")}
      await tokenX
      .connect(acc1)
      .approve(swapToken.address, utils.parseEther('10000'))
      await swapToken
        .connect(deployer)
        .setRate(zeroAddress, 1, 0)
      await acc2.sendTransaction({
        to: swapToken.address,
        value: utils.parseEther("2500")
      })
      await swapToken
        .connect(acc1)
        .swap(
          tokenX.address,
          zeroAddress,
          utils.parseEther('250'),
        )

    console.log((await acc1.getBalance()).toString(), 'acc1 ether balance after')
    console.log((await acc2.getBalance()).toString(), 'acc2 ether balance after')


  })

  it('upgrade delete swap function and try to swap', async function() {
    const SwapTokenFactory = await ethers.getContractFactory("SwapTokenV2");
    const swapTokenUpgrade = await upgrades.upgradeProxy(swapToken.address, SwapTokenFactory);
    await tokenX
      .connect(acc1)
      .approve(swapToken.address, utils.parseEther('10000'))
    try {
      await swapToken
      .connect(acc1)
      .swap(
        tokenX.address,
        tokenY.address,
        utils.parseEther('10000'),
      )
    } catch(error) {
      expect(error.message).to.equal(`Transaction reverted: function selector was not recognized and there's no fallback function`);
    }
  })
  
  it('swap with the same token', async function () {
    await tokenX
    .connect(acc1)
    .approve(swapToken.address, utils.parseEther('1000'))
    try {
      await swapToken
      .connect(acc1)
      .swap(
        tokenX.address,
        tokenX.address,
        utils.parseEther('10000'),
        )
      } catch(error) {
      expect(error.message).to.equal(`VM Exception while processing transaction: reverted with reason string 'Can not transfer the same token'`);
    }
  })

  it('withdraw with not the owner of contract', async function() {
    await tokenX.connect(acc1).transfer(swapToken.address, utils.parseEther('2000'))
    try {
      await swapToken.connect(acc1).withdraw(tokenX.address, utils.parseEther('1000'), acc1.address)
    } catch(error) {
      expect(error.message).to.equal(`VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'`)
    }
  })

  it('withdraw exceed the token of contract', async function() {
    try {
      await swapToken.connect(deployer).withdraw(tokenX.address, utils.parseEther('200000'), acc1.address)
    } catch(error) {
      expect(error.message).to.equal(`VM Exception while processing transaction: reverted with reason string 'ERC20: transfer amount exceeds balance'`)
    }
  })

  it('withdraw exceed the native token of contract', async function() {
    try {
      await swapToken.connect(deployer).withdraw(zeroAddress, utils.parseEther('200000'), acc1.address)
    } catch(error) {
      expect(error.message).to.equal(`VM Exception while processing transaction: reverted with reason string 'failed to transfer token'`)
    }
  })

  it('swap with odd value', async function() {
      // Set Rate for TokenX and TokenY
    await swapToken.connect(deployer).setRate(tokenX.address, 233333, 3)

    await swapToken.connect(deployer).setRate(tokenY.address, 33333, 11)

    await tokenX
    .connect(acc1)
    .approve(swapToken.address, utils.parseEther('1000'))

    await swapToken.connect(acc1).swap(tokenX.address, tokenY.address, utils.parseEther('0.00001'))
    expect((await tokenY.balanceOf(acc1.address)).toString()).to.equal('100000000000000000014285')
  })
})
