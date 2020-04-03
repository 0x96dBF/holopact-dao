const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert, singletons } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const DividendToken = contract.fromArtifact('DividendToken');

describe('DividendToken', function() {
    const [ registryFunder, holder, funder, anyone ] = accounts;

    const initialSupply = new BN('1024')
    const name = 'DividendToken'
    const symbol = 'DIV'
    const operators = []
    const smallAmount = new BN(42)
    const amount = new BN(64)

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
                                   'DividendToken: no tokens to distribute to');
            });
        })
    });

    context('with no minimum deposit', function () {
        beforeEach(async function () {
            this.token = await DividendToken.new(name, symbol, operators, initialSupply, 0,
                                                 {from: holder});
        });

        describe('on initialization', function () {
            it('should owe 0 dividend', async function () {
                expect(await this.token.outstandingBalanceFor(anyone, {from: anyone}))
                    .to.be.bignumber.equal('0');
            });

            it('should pay 0 dividend', async function () {
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

        describe('depositing dividends', function () {
            it('should hold correct balance in token', async function () {
                await this.token.depositDividend({from: funder, value: amount});
                expect(await web3.eth.getBalance(this.token.address))
                    .to.be.bignumber.equal(amount);
            });

            it('should owe full dividend', async function () {
                await this.token.depositDividend({from: funder, value: amount});
                expect(await this.token.outstandingBalanceFor.call(holder))
                    .to.be.bignumber.equal(amount);
            });

            it('should pay full dividend', async function () {
                var initialBalance = new BN(await web3.eth.getBalance(holder));
                await this.token.depositDividend({from: funder, value: amount});
                await this.token.withdrawBalance({from: holder});
                expect(await web3.eth.getBalance(holder))
                    .to.be.bignumber.equal(initialBalance.add(amount));
            });

            it('should owe correct proportion of dividend', async function () {
                await this.token.send(anyone, 256, [], {from: holder});
                await this.token.depositDividend({from: funder, value: amount});
                expect(await this.token.outstandingBalanceFor.call(anyone))
                    .to.be.bignumber.equal(new BN(16));
                expect(await this.token.outstandingBalanceFor.call(holder))
                    .to.be.bignumber.equal(new BN(48));
            });

            it('should pay correct proportion of dividend', async function () {
                var holderBalance = new BN(await web3.eth.getBalance(holder));
                var anyoneBalance = new BN(await web3.eth.getBalance(anyone));
                await this.token.send(anyone, 256, [], {from: holder});
                await this.token.depositDividend({from: funder, value: amount});
                await this.token.withdrawBalance({from: holder});
                await this.token.withdrawBalance({from: anyone});
                expect(await web3.eth.getBalance(anyone))
                    .to.be.bignumber.equal(anyoneBalance.add(new BN(16)));
                expect(await web3.eth.getBalance(holder))
                    .to.be.bignumber.equal(holderBalance.add(new BN(48)));
            });

            it('should owe 0 after withdrawing', async function () {
                await this.token.depositDividend({from: funder, value: amount});
                await this.token.withdrawBalance({from: holder});
                expect(await this.token.outstandingBalanceFor.call(holder))
                    .to.be.bignumber.equal(new BN(0));
            });

            it('should pay 0 after withdrawing', async function () {
                await this.token.depositDividend({from: funder, value: amount});
                await this.token.withdrawBalance({from: holder});
                var holderBalance = new BN(await web3.eth.getBalance(holder));
                await this.token.withdrawBalance({from: holder});
                expect(await web3.eth.getBalance(holder))
                    .to.be.bignumber.equal(holderBalance);
            });

            it('should owe correct dividend after post-deposit transfer', async function () {
                await this.token.depositDividend({from: funder, value: amount});
                await this.token.send(anyone, 256, [], {from: holder});
                expect(await this.token.outstandingBalanceFor.call(holder))
                    .to.be.bignumber.equal(amount);
            });

            it('should pay correct dividend after post-deposit transfer', async function () {
                var holderBalance = new BN(await web3.eth.getBalance(holder));
                await this.token.depositDividend({from: funder, value: amount});
                await this.token.withdrawBalance({from:holder});
                await this.token.send(anyone, 256, [], {from: holder});
                expect(await web3.eth.getBalance(holder))
                    .to.be.bignumber.equal(holderBalance.add(amount));
            });

            it('should owe correct cumulative dividends in proportion', async function () {
                await this.token.depositDividend({from: funder, value: amount});
                await this.token.send(anyone, 512, [], {from: holder});
                await this.token.depositDividend({from: funder, value: amount});
                expect(await this.token.outstandingBalanceFor.call(holder))
                    .to.be.bignumber.equal(new BN(96));
            });

            it('should pay correct cumulative dividends in proportion', async function () {
                var holderBalance = new BN(await web3.eth.getBalance(holder));
                await this.token.depositDividend({from: funder, value: amount});
                await this.token.send(anyone, 512, [], {from: holder});
                await this.token.depositDividend({from: funder, value: amount});
                await this.token.withdrawBalance({from: holder});
                expect(await web3.eth.getBalance(holder))
                    .to.be.bignumber.equal(holderBalance.add(new BN(96)));
            });

        });
    });
});
