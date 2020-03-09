const Token = artifacts.require("HolopactToken");

var conf = require('@openzeppelin/test-helpers/configure')({
  provider: web3.currentProvider
});

const { singletons } = require('@openzeppelin/test-helpers');

module.exports = async function(deployer, network, accounts) { 
  const erc1820 = await singletons.ERC1820Registry(accounts[0]);

  await deployer.deploy(Token, 65536, [])
};
