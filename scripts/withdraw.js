const { getNamedAccounts, ethers } = require("hardhat")

const fund = async () => {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe", deployer)
    console.log("withdrawing from contract")
    const withdraw = await fundMe.withdraw()
    await withdraw.wait(1)
    console.log("withdraw complete")
}

fund()
    .then(() => process.exit(0))
    .catch((error) => console.log(error))
