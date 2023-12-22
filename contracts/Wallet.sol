// This code snippet is provided by Pessimistic company.
// To apply for the internship opportunity at Pessimistic company,
// please fill out the form by visiting the following link: https://forms.gle/SUTcGi8X86yNoFnG7

// Caution: This code is intended for educational purposes only
// and should not be used in production environments.

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract Wallet {
  
    mapping(address => uint) public balances;

    function deposit(address _to) public payable {
        balances[_to] = balances[_to] + msg.value;
    }

    function balanceOf(address _who) public view returns (uint balance) {
        return balances[_who];
    }

    function withdraw(uint _amount) public {
        if(balances[msg.sender] >= _amount) {
            (bool result,) = msg.sender.call{value:_amount}("");
            require(result, "External call returned false");
            balances[msg.sender] -= _amount;
        }
    }

    // Pattern: Check - Effect - Interact
    function withdrawFixed(uint _amount) public {
        // Check
        if(balances[msg.sender] >= _amount) {
            // Effect
            balances[msg.sender] -= _amount;
            // Interact
            (bool result,) = msg.sender.call{value:_amount}("");
            require(result, "External call returned false");
        }
    }

    // Not recommended, funds can be locked forever because there is no implemented
    // function to recover the funds from the contract.
    receive() external payable {}
}