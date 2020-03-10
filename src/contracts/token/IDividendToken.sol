pragma solidity >=0.4.22 <0.7.0;


contract IDividendToken {

  function depositDividend() public payable returns (bool);

  function withdrawBalance() public returns (uint256);

  function outstandingBalanceFor(address _account) public view returns (uint256);

  event DividendDeposited(address indexed depositedBy, uint256 amount);

  event BalanceWithdrawn(address indexed recipient, uint256 amount);
  
}
