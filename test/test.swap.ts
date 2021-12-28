import { SwapToken__factory } from './../typechain-types/factories/SwapToken__factory'
import { ERC20Mock__factory } from './../typechain-types/factories/ERC20Mock__factory'
import { SwapToken } from './../typechain-types/SwapToken'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { ERC20Mock } from './../typechain-types/ERC20Mock'
const { utils, BigNumber } = ethers

describe('Swap token', function () {
  let tokenX: ERC20Mock
  let tokenY: ERC20Mock
  let tokenZ: ERC20Mock
  let swapToken: SwapToken
  let deployer: any
  let acc1: any
  let acc2: any
  let acc3: any

  beforeEach(async () => {
    ;[deployer, acc1, acc2, acc3] = await ethers.getSigners()
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

    swapToken = await (
      await new SwapToken__factory(deployer).deploy()
    ).deployed()
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

    // Set Rate for TokenX and TokenY
    await swapToken
      .connect(deployer)
      .setRate(tokenX.address, tokenY.address, [1, 2])
  })

  it('Swap user with user', async function () {
    await tokenX
      .connect(acc1)
      .approve(swapToken.address, utils.parseEther('10000'))
    await tokenY
      .connect(acc2)
      .approve(swapToken.address, utils.parseEther('20000'))
    await swapToken
      .connect(acc1)
      .swap(
        acc2.address,
        tokenX.address,
        tokenY.address,
        utils.parseEther('10000'),
      )

    expect(await tokenY.connect(acc1).balanceOf(acc1.address)).to.equal(
      utils.parseEther('120000'),
    )
    expect(await tokenX.connect(acc2).balanceOf(acc2.address)).to.equal(
      utils.parseEther('110000'),
    )
  })

  it('swap user with contract', async function () {
    await tokenX
      .connect(acc1)
      .approve(swapToken.address, utils.parseEther('10000'))
    await swapToken
      .connect(acc1)
      .swap(
        swapToken.address,
        tokenX.address,
        tokenY.address,
        utils.parseEther('10000'),
      )
    expect(await tokenY.connect(acc1).balanceOf(acc1.address)).to.equal(
      utils.parseEther('120000'),
    )
  })

  it('Swap user with user but token have not set the rate', async function () {
    await tokenX
      .connect(acc1)
      .approve(swapToken.address, utils.parseEther('10000'))
    await tokenZ
      .connect(acc2)
      .approve(swapToken.address, utils.parseEther('20000'))
    try {
      await swapToken
        .connect(acc1)
        .swap(
          acc2.address,
          tokenX.address,
          tokenZ.address,
          utils.parseEther('10000'),
        )
    } catch (error) {
      expect(error.message).to.equal(
        `VM Exception while processing transaction: reverted with reason string 'have not set rate'`,
      )
    }
  })

  it('swap token pair with reverse sequence to the rate set', async function () {
    await tokenX
      .connect(acc1)
      .approve(swapToken.address, utils.parseEther('10000'))
    await tokenY
      .connect(acc2)
      .approve(swapToken.address, utils.parseEther('20000'))
    await swapToken
      .connect(acc2)
      .swap(
        acc1.address,
        tokenY.address,
        tokenX.address,
        utils.parseEther('20000'),
      )
    expect(await tokenY.connect(acc1).balanceOf(acc1.address)).to.equal(
      utils.parseEther('120000'),
    )
    expect(await tokenX.connect(acc2).balanceOf(acc2.address)).to.equal(
      utils.parseEther('110000'),
    )
  })
})
