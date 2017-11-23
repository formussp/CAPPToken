
pragma solidity ^0.4.18;

import "./StandardToken.sol";

contract Cappasity is StandardToken {

  // Constants
  // =========
  string public constant name = "Cappasity";
  string public constant symbol = "CAPP";
  uint8 public constant decimals = 2;
  uint public constant TOKEN_LIMIT = 10 * 1e9 * 1e2; // 10 billion tokens, 2 decimals

  // State variables
  // ===============
  address public manager;

  // Block token transfers until ICO is finished.
  bool public tokensAreFrozen = true;
  bool public mintingIsAllowed = true;

  // Constructor
  // ===========
  function Cappasity(address _manager) public {
    manager = _manager;
  }

  // ERC20 functions
  // =========================
  function transfer(address _to, uint _value) public returns (bool success) {
    require(!tokensAreFrozen);
    return super.transfer(_to, _value);
  }

  function transferFrom(address _from, address _to, uint _value) public returns (bool success) {
    require(!tokensAreFrozen);
    return super.transferFrom(_from, _to, _value);
  }

  function approve(address _spender, uint _value) public returns (bool success) {
    require(!tokensAreFrozen);
    return super.approve(_spender, _value);
  }

  function increaseApproval(address _spender, uint _addedValue) public returns (bool success) {
    require(!tokensAreFrozen);
    return super.increaseApproval(_spender, _addedValue);
  }

  function decreaseApproval(address _spender, uint _subtractedValue) public returns (bool success) {
    require(!tokensAreFrozen);
    return super.decreaseApproval(_spender, _subtractedValue);
  }

  // PRIVILEGED FUNCTIONS
  // ====================
  modifier onlyByManager() {
    require(msg.sender == manager);
    _;
  }

  // Mint some tokens and assign them to an address
  function mint(address _beneficiary, uint _value) onlyByManager external {
    require(_value != 0);
    require(totalSupply.add(_value) <= TOKEN_LIMIT);
    require(mintingIsAllowed);

    balances[_beneficiary] = balances[_beneficiary].add(_value);
    totalSupply = totalSupply.add(_value);
  }

  // Disable minting. Can be enabled later, but TokenAllocation.sol only does that once.
  function endMinting() onlyByManager external {
    mintingIsAllowed = false;
  }

  // Enable minting. See TokenAllocation.sol
  function startMinting() onlyByManager external {
    mintingIsAllowed = true;
  }

  // Allow token transfer
  function unfreeze() onlyByManager external {
    tokensAreFrozen = false;
  }
}
