pragma solidity >=0.6.0 <0.7.0;

import "./IDividendToken.sol";
import "openzeppelin-solidity/contracts/token/ERC777/ERC777.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract DividendToken is ERC777, IDividendToken {
  using SafeMath for uint256;

  struct DividendBalance {
    uint256 balance;
    uint256 drawnFrom;
  } 

  mapping (address => DividendBalance) internal dividendBalance_;
  uint256 private adjustedDividends_;
  uint256 private baseTotal_;
  uint256 internal minimum_;

  constructor(string memory name,
              string memory symbol,
              address[] memory defaultOperators,
              uint256 initialSupply,
              uint256 minimumDeposit)
    ERC777(name, symbol, defaultOperators)
    public {
    baseTotal_ = initialSupply;
    minimum_ = minimumDeposit;
    _mint(msg.sender, msg.sender, initialSupply, "", "");
  }

  function depositDividend() public payable override returns (bool) {
    require(msg.value >= minimum_, "DividendToken: deposit below minimum");
    _depositDividend(msg.value);
    emit DividendDeposited(msg.sender, msg.value);
  }

  function withdrawBalance() public override returns (uint256) {
    uint amount = _withdrawFor(msg.sender);
    emit BalanceWithdrawn(msg.sender, amount);
    return amount;
  }

  function outstandingBalanceFor(address _account) public view override returns (uint256) {
    if (adjustedDividends_ == 0) return 0;
    uint additional = adjustedDividends_
      .sub(dividendBalance_[_account].drawnFrom)
      .mul(balanceOf(_account))
      .div(baseTotal_);
    return dividendBalance_[_account].balance.add(additional);
  }

  function _distributableSupply() internal view returns (uint256) {    
    return totalSupply();
  }

  function _depositDividend(uint256 _value) internal {
    require(_distributableSupply() > 0, "DividendToken: no tokens to distribute to");

    if (_distributableSupply() == baseTotal_)
      adjustedDividends_ = adjustedDividends_.add(_value);
    else {
      uint adjustedValue = _value.mul(baseTotal_).div(_distributableSupply());
      adjustedDividends_ = adjustedDividends_.add(adjustedValue);
    }
  }

  function _withdrawFor(address payable _address) internal returns (uint256) {
    _updateBalance(_address);
    uint balance = dividendBalance_[_address].balance;
    if (balance > 0) {
      dividendBalance_[_address].balance = 0;
      _address.transfer(balance);
    }
    return balance;
  }

  function _updateBalance(address _for) internal {
    if (dividendBalance_[_for].drawnFrom < adjustedDividends_) {
      uint additional = adjustedDividends_
        .sub(dividendBalance_[_for].drawnFrom)
        .mul(balanceOf(_for))
        .div(baseTotal_);
      dividendBalance_[_for].balance = dividendBalance_[_for].balance.add(additional);
      dividendBalance_[_for].drawnFrom = adjustedDividends_;
    }
  }

  function _burn(address _operator,
                 address _from,
                 uint256 _amount,
                 bytes memory _data,
                 bytes memory _operatorData)
    internal override
  {
    _updateBalance(_from);
    super._burn(_operator, _from, _amount, _data, _operatorData);
  }

  function _beforeTokenTransfer(address, address _from, address _to, uint256)
    internal override
  {
    _updateBalance(_from);
    _updateBalance(_to);
  }
    
}
