const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", () => {
          let fundMe
          let deployer
          let mockV3Aggregator
          const sendValue = ethers.utils.parseEther("1")
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", async () => {
              it("Sets the aggreagotor address correctly", async () => {
                  assert.equal(
                      await fundMe.getPriceFeed(),
                      mockV3Aggregator.address
                  )
              })
          })

          describe("fund", async () => {
              it("should fail if you dont send enough eth", async () => {
                  await expect(fundMe.fund()).to.be.rejectedWith("Not enough")
              })

              it("updates the amount funded data structure", async () => {
                  await fundMe.fund({ value: sendValue })
                  assert.equal(
                      (
                          await fundMe.getAddressToAmountFunded(deployer)
                      ).toString(),
                      sendValue.toString()
                  )
              })

              it("adds funders to array of funders", async () => {
                  await fundMe.fund({ value: sendValue })
                  assert.equal(await fundMe.getFunder(0), deployer)
              })
          })

          describe("withdraw", async () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue })
              })

              it("withdraw ETH from a single founder", async () => {
                  //Arragne
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })
          })

          it("allows us to withdraw with multiple funders", async () => {
              const accounts = await ethers.getSigners()
              await Promise.all(
                  accounts.map(async (account) => {
                      const fundMeConnectedContract = await fundMe.connect(
                          account
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  })
              )

              const startingFundMeBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              const startingDeployerBalance = await fundMe.provider.getBalance(
                  deployer
              )

              const transactionResponse = await fundMe.withdraw()
              const transactionReceipt = await transactionResponse.wait(1)

              const { gasUsed, effectiveGasPrice } = transactionReceipt
              const gasCost = gasUsed.mul(effectiveGasPrice)

              const endingFundMeBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              const endingDeployerBalance = await fundMe.provider.getBalance(
                  deployer
              )

              assert.equal(endingFundMeBalance, 0)
              assert.equal(
                  startingFundMeBalance.add(startingDeployerBalance).toString(),
                  endingDeployerBalance.add(gasCost).toString()
              )

              await expect(fundMe.getFunder(0)).to.be.reverted

              await Promise.all(
                  accounts.map(async ({ address }) => {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(address),
                          0
                      )
                  })
              )
          })

          it("only allows the owner to withdraw", async () => {
              const accounts = await ethers.getSigners()
              const attacker = accounts[1]
              const attackerConnectedContract = await fundMe.connect(attacker)
              await expect(
                  attackerConnectedContract.withdraw()
              ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
          })

          it("cheap withdraw ETH from a single founder", async () => {
              //Arragne
              const startingFundMeBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              const startingDeployerBalance = await fundMe.provider.getBalance(
                  deployer
              )

              //Act
              const transactionResponse = await fundMe.cheaperWithdraw()
              const transactionReceipt = await transactionResponse.wait(1)

              const { gasUsed, effectiveGasPrice } = transactionReceipt
              const gasCost = gasUsed.mul(effectiveGasPrice)

              const endingFundMeBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              const endingDeployerBalance = await fundMe.provider.getBalance(
                  deployer
              )

              assert.equal(endingFundMeBalance, 0)
              assert.equal(
                  startingFundMeBalance.add(startingDeployerBalance).toString(),
                  endingDeployerBalance.add(gasCost).toString()
              )
          })

          it("allows us to cheaper withdraw with multiple funders", async () => {
              const accounts = await ethers.getSigners()
              await Promise.all(
                  accounts.map(async (account) => {
                      const fundMeConnectedContract = await fundMe.connect(
                          account
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  })
              )

              const startingFundMeBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              const startingDeployerBalance = await fundMe.provider.getBalance(
                  deployer
              )

              const transactionResponse = await fundMe.cheaperWithdraw()
              const transactionReceipt = await transactionResponse.wait(1)

              const { gasUsed, effectiveGasPrice } = transactionReceipt
              const gasCost = gasUsed.mul(effectiveGasPrice)

              const endingFundMeBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              const endingDeployerBalance = await fundMe.provider.getBalance(
                  deployer
              )

              assert.equal(endingFundMeBalance, 0)
              assert.equal(
                  startingFundMeBalance.add(startingDeployerBalance).toString(),
                  endingDeployerBalance.add(gasCost).toString()
              )

              await expect(fundMe.getFunder(0)).to.be.reverted

              await Promise.all(
                  accounts.map(async ({ address }) => {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(address),
                          0
                      )
                  })
              )
          })
      })
