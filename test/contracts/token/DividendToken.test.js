const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert, singletons } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const DividendToken = contract.fromArtifact('DividendToken');

describe('DividendToken', function() {
    const [ registryFunder, creator, funder, anyone ] = accounts;

    const initialSupply = new BN('1024')
    const name = 'DividendToken'
    const symbol = 'DIV'
    const operators = []
    const smallAmount = new BN(41)
    const amount = new BN(42)

    beforeEach(async function () {
        this.erc1820 = await singletons.ERC1820Registry(registryFunder);
    });

    context('with zero supply', function () {
        beforeEach(async function () {
            this.token = await DividendToken.new(name, symbol, operators, 0, 0);
        });

        describe('restrictions', function() {
            it('should revert on payment to zero balance contract', async function () {
                await expectRevert(this.token.depositDividend({from: funder, 
                                                             value: smallAmount}),
                                   'DividendToken: no tokens to distribute to')
            });
        })
    });

    context('with no minimum deposit', function () {
        beforeEach(async function () {
            this.token = await DividendToken.new(creator, name, symbol, operators, initialSupply, 0);
        });
        
    });
});
