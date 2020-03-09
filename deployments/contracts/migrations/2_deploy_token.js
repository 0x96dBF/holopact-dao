const Token = artifacts.require("HolopactToken");

web3.provider = web3.currentProvider
var conf = require('@openzeppelin/test-helpers/configure')(web3);

const { singletons } = require('@openzeppelin/test-helpers');

module.exports = async function(deployer, network, accounts) { 
  const erc1820 = await singletons.ERC1820Registry(accounts[0]);

  await deployer.deploy(Token, 65536, [])
};
