const web3 = global.web3;
const utils = require('./helpers/utils');

// artifacts
const ERC20 = artifacts.require('./ERC20.sol');
const TokenAllocation = artifacts.require('./TokenAllocation.sol');
const VestingWallet = artifacts.require('./VestingWallet.sol');
const Cappasity = artifacts.require('./Cappasity.sol');

const UNINITIALIZED_ADDRESS = '0x0000000000000000000000000000000000000000';

contract('TokenAllocation', (accounts) => {
  const [icoManager, icoBackend, foundersWallet, partnersWallet, emergencyManager] = accounts;

  // these are unused accounts
  const anonymous = accounts[8];
  const friend = accounts[9];

  const throwsOpcode = async (contract, args, called = { from: anonymous }) => {
    args.forEach(async ([method, ...data]) => {
      try {
        await contract[method](...data, called);
        throw new Error('allowed execution');
      } catch (e) {
        assert.equal('VM Exception while processing transaction: invalid opcode', e.message);
      }
    });
  };

  before('init contract', () => (
    TokenAllocation.deployed().then(async (instance) => {
      this.contract = instance;
      this.capp = Cappasity.at(await instance.tokenContract());
    })
  ));

  it('verify initial state', async () => {
    assert.equal(icoManager, await this.contract.icoManager());
    assert.equal(icoBackend, await this.contract.icoBackend());
    assert.equal(foundersWallet, await this.contract.foundersWallet());
    assert.equal(partnersWallet, await this.contract.partnersWallet());

    // rate & cap params
    assert.equal(125, await this.contract.tokenRate());
    assert.equal(50000000 * 100, await this.contract.hardCap()); // 50 mln $
    assert.equal(30000000 * 100, await this.contract.phaseOneCap()); // 50 mln $

    // gather statistics
    assert.equal(0, await this.contract.totalCentsGathered());
    assert.equal(0, await this.contract.tokensDuringPhaseOne());
    assert.equal(0, await this.contract.centsInPhaseOne());
    assert.equal(0, await this.contract.totalTokenSupply());

    // bonus thresholds
    assert.equal(10000000 * 100, await this.contract.bonusTierSize()); // 10 mln $ is TIER step - 10/5/0 bonuses
    assert.equal(100000 * 100, await this.contract.bigContributionBound()); // 100k $ is big size - 5% bonus
    assert.equal(300000 * 100, await this.contract.hugeContributionBound()); // 300k $ is huge size - 10% bonus

    // phases
    assert.equal(0, await this.contract.crowdsalePhase());
    assert.equal(0, await this.contract.bonusPhase());

    // ensure dependant contracts were created
    assert.isOk(web3.isAddress(await this.contract.tokenContract()));
    assert.notEqual(UNINITIALIZED_ADDRESS, await this.contract.tokenContract());

    // verify that it is unitialized
    assert.equal(UNINITIALIZED_ADDRESS, await this.contract.vestingWallet());
  });

  it('verify state of Cappasity Token Contract', async () => {
    const CAPP = this.capp;

    // token basics
    assert.equal('Cappasity', await CAPP.name());
    assert.equal('CAPP', await CAPP.symbol());
    assert.equal(2, await CAPP.decimals());
    assert.equal(7000000000 / 0.7 * 1e2, (await CAPP.TOKEN_LIMIT()).toNumber()); // 7 bln / 0.7, based on allocation + 2 decimals

    // ensure manager was created and specified
    assert.equal(this.contract.address, await CAPP.manager());

    // default settings
    assert.equal(true, await CAPP.tokensAreFrozen());
    assert.equal(true, await CAPP.mintingIsAllowed());

    // ensure balances and allowed lack getters
    assert.isOk(typeof CAPP.balances, 'undefined');
    assert.isOk(typeof CAPP.allowed, 'undefined');

    // supply is at 0 when created
    assert.equal(0, await CAPP.totalSupply());
  });

  it('privileged functions can only be called by token contract', async () => {
    const CAPP = this.capp;

    const args = [
      ['endMinting'],
      ['startMinting'],
      ['unfreeze'],
      ['freeze'],
      ['mint', anonymous, 100000],
    ];

    await throwsOpcode(CAPP, args, { from: anonymous });
  });

  it('may not call freeze/unfreeze during phase one', async () => {
    const args = [
      ['freeze'],
      ['unfreeze'],
    ];

    await throwsOpcode(this.contract, args, { from: icoManager });
  });

  describe('#issueTokensWithCustomBonus()', () => {
    it('rejects to issue except for icoBackend key', async () => {
      const args = [
        ['issueTokensWithCustomBonus', anonymous, 100000, 125000, 10000],
      ];

      await throwsOpcode(this.contract, args, { from: icoManager });
      await throwsOpcode(this.contract, args, { from: anonymous });
    });

    it('issues custom bonus, no contribution', async () => {
      const CAPP = this.capp;

      // only bonus, because we have 2 decimals
      // we issue 100 times more tokens
      // issue 1 bonus token
      await this.contract.issueTokensWithCustomBonus(anonymous, 0, 1 * 1e2, 1 * 1e2, { from: icoBackend });

      await utils.assertEvent(this.contract, { event: 'BonusIssued', logIndex: 0, args: {
        _beneficiary: anonymous,
        _bonusTokensIssued: 1 * 1e2,
      }});

      // verify state of the contract
      assert.equal(await this.contract.totalCentsGathered(), 0);
      assert.equal(await this.contract.centsInPhaseOne(), 0);
      assert.equal(await this.contract.totalTokenSupply(), 1 * 1e2);

      // check new balance & new supply
      assert.equal(await this.capp.balanceOf(anonymous), 1 * 1e2);
      assert.equal(await this.capp.totalSupply(), 1 * 1e2);
    });

    it('rejects to transfer tokens during phase 1', async () => {
      const args = [
        ['transfer', friend, 100], // we have 1 token
        ['approve', friend, 100], // we have 1 token
        ['transferFrom', anonymous, friend, 100], // confirm
        ['increaseApproval', friend, 100],
        ['decreaseApproval', friend, 100],
      ];

      await throwsOpcode(this.capp, args, { from: anonymous });

      // ensure it is same old balance & supply did not change
      assert.equal(await this.capp.balanceOf(anonymous), 1 * 1e2);
      assert.equal(await this.capp.totalSupply(), 1 * 1e2);

      // ensures it did not change allowance as tokens are in frozen state
      assert.equal(await this.capp.allowance(anonymous, friend), 0);
    });

    it('issues custom bonus, with contribution', async () => {
      const CAPP = this.capp;

      // only bonus, because we have 2 decimals
      // we 100$ worth of tokens and custom bonus, lets say 25%
      // tokens = 100 * 125 * 1.25 * 100
      await this.contract.issueTokensWithCustomBonus(anonymous, 100 * 1e2, 15625 * 1e2, 3125 * 1e2, { from: icoBackend });

      await utils.assertEvent(this.contract, { event: 'TokensAllocated', logIndex: 0, args: {
        _beneficiary: anonymous,
        _contribution: 100 * 1e2,
        _tokensIssued: (15625 - 3125) * 1e2,
      }});

      await utils.assertEvent(this.contract, { event: 'BonusIssued', logIndex: 1, args: {
        _beneficiary: anonymous,
        _bonusTokensIssued: 3125 * 1e2,
      }});

      // verify state of the contract
      assert.equal(await this.contract.totalCentsGathered(), 100 * 1e2);
      assert.equal(await this.contract.centsInPhaseOne(), 0); // only changes on advancement of phases
      assert.equal(await this.contract.totalTokenSupply(), 1 * 1e2 + 15625 * 1e2);

      // check new balance & new supply
      assert.equal(await this.capp.balanceOf(anonymous), 1 * 1e2 + 15625 * 1e2);
      assert.equal(await this.capp.totalSupply(), 1 * 1e2 + 15625 * 1e2);
    });
  });
});
