const { getNamedAccounts, ethers } = require("hardhat")

const fund = async () => {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe", deployer)
    console.log("Funding contract")
    const fund = await fundMe.fund({
        value: ethers.utils.parseEther("0.05"),
    })
    await fund.wait(1)
    console.log("Funded")
}

fund()
    .then(() => process.exit(0))
    .catch((error) => console.log(error))
