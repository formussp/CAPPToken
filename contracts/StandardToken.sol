pragma solidity ^0.4.18;

import "./ERC20.sol";
import "./SafeMath.sol";

contract StandardToken is ERC20 {
    using SafeMath for uint;

    mapping (address => uint) balances;
    mapping (address => mapping (address => uint)) allowed;

    function transfer(address _to, uint _value) onlyPayloadSize(2 * 32) public returns (bool success) {
        if (balances[msg.sender] >= _value) {
            balances[msg.sender] = balances[msg.sender].sub(_value);
            balances[_to] = balances[_to].add(_value);

            Transfer(msg.sender, _to, _value);
            return true;
        } else return false;
    }

    function transferFrom(address _from, address _to, uint _value) public returns (bool success) {
        if ((balances[_from] >= _value) && (allowed[_from][msg.sender] >= _value)) {
            balances[_to]   = balances[_to].add(_value);
            balances[_from] = balances[_from].sub(_value);
            allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
            Transfer(_from, _to, _value);
            return true;
        } else return false;
    }

    function balanceOf(address _owner) constant public returns (uint balance) {
        return balances[_owner];
    }

    function allowance(address _owner, address _spender) constant public returns (uint remaining) {
      return allowed[_owner][_spender];
    }

    function approve(address _spender, uint _value) public returns (bool) {
        // needs to be called twice -> first set to 0, then increase to another amount
        // this is to avoid race conditions
        require((_value == 0) || (allowed[msg.sender][_spender] == 0));

        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    function increaseApproval(address _spender, uint _addedValue) public returns (bool) {
        allowed[msg.sender][_spender] = allowed[msg.sender][_spender].add(_addedValue);
        Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;
    }

    function decreaseApproval(address _spender, uint _subtractedValue) public returns (bool) {
        uint oldValue = allowed[msg.sender][_spender];
        if (_subtractedValue > oldValue) {
            allowed[msg.sender][_spender] = 0;
        } else {
            allowed[msg.sender][_spender] = oldValue.sub(_subtractedValue);
        }
        Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;
    }

    modifier onlyPayloadSize(uint _size) {
        require(msg.data.length >= _size + 4);
        _;
    }
}
