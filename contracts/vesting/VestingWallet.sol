pragma solidity ^0.4.18;

import "../ERC20.sol";
import "../../libraries/SafeMath.sol";

  /**
   * @dev For the tokens issued for founders.
   */
contract VestingWallet {
    using SafeMath for uint;

    event TokensReleased(uint _tokensReleased, uint _tokensRemaining, uint _nextPeriod);

    address public foundersWallet;
    address public crowdsaleContract;
    ERC20 public tokenContract;

    // Two-year vesting with 1 month cliff. Roughly.
    bool public vestingStarted = false;
    uint constant cliffPeriod = 30 days;
    uint constant totalPeriods = 24;

    uint public periodsPassed = 0;
    uint public nextPeriod;
    uint public tokensRemaining;
    uint public tokensPerBatch;

    // Constructor
    // ===========
    function VestingWallet(address _foundersWallet, address _tokenContract) public {
        require(_foundersWallet != address(0));
        require(_tokenContract != address(0));

        foundersWallet    = _foundersWallet;
        tokenContract     = ERC20(_tokenContract);
        crowdsaleContract = msg.sender;
    }

    // PRIVILEGED FUNCTIONS
    // ====================
    function releaseBatch() external onlyFounders {
        require(true == vestingStarted);
        require(now > nextPeriod);
        require(periodsPassed < totalPeriods);

        uint tokensToRelease = 0;
        do {
            periodsPassed   = periodsPassed.add(1);
            nextPeriod      = nextPeriod.add(cliffPeriod);
            tokensToRelease = tokensToRelease.add(tokensPerBatch);
        } while (now > nextPeriod);

        // If vesting has finished, just transfer the remaining tokens.
        if (periodsPassed >= totalPeriods) {
            tokensToRelease = tokenContract.balanceOf(this);
            nextPeriod = 0x0;
        }

        tokensRemaining = tokensRemaining.sub(tokensToRelease);
        tokenContract.transfer(foundersWallet, tokensToRelease);

        TokensReleased(tokensToRelease, tokensRemaining, nextPeriod);
    }

    function launchVesting() public onlyCrowdsale {
        require(false == vestingStarted);

        vestingStarted  = true;
        tokensRemaining = tokenContract.balanceOf(this);
        nextPeriod      = now.add(cliffPeriod);
        tokensPerBatch  = tokensRemaining / totalPeriods;
    }

    // INTERNAL FUNCTIONS
    // ==================
    modifier onlyFounders() {
        require(msg.sender == foundersWallet);
        _;
    }

    modifier onlyCrowdsale() {
        require(msg.sender == crowdsaleContract);
        _;
    }
}
