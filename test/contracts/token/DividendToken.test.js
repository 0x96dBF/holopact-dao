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
            this.token = await DividendToken.new(name, symbol, operators, initialSupply, 0,
                                                 {from: creator});
        });

        describe('on initialization', function () {
            it('should owe 0 dividend', async function () {
                expect(await this.token.outstandingBalanceFor(anyone, {from: anyone}))
                    .to.be.bignumber.equal('0');
            });

            it('should pay 0 dividend after initialization', async function () {
                // assume that gas price is set to 0 for testing
                var initialBalance = await web3.eth.getBalance(anyone);
                await this.token.withdrawBalance({from: anyone});
                expect(await web3.eth.getBalance(anyone)).to.be.equal(initialBalance);
            });
        });

        describe('events', function () {
            it('should emit DividendDeposited event', async function () {
                expectEvent(await this.token.depositDividend({from: funder,
                                                              value: amount}),
                            'DividendDeposited', { depositedBy: funder, amount: amount });
            });

            it('should emit BalanceWithdrawn event', async function () {
                this.token.depositDividend({from: funder, value: amount})
                expectEvent(await this.token.withdrawBalance({from: anyone}),
                            'BalanceWithdrawn', { recipient: anyone, amount: '0' });
            });
        });
    });
});
