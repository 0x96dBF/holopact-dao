pragma solidity >=0.6.0 <0.7.0;


interface IDividendToken {

    function depositDividend() external payable returns (bool);

    function withdrawBalance() external returns (uint256);

    function outstandingBalanceFor(address _account) external view returns (uint256);

    event DividendDeposited(address indexed depositedBy, uint256 amount);

    event BalanceWithdrawn(address indexed recipient, uint256 amount);

}
