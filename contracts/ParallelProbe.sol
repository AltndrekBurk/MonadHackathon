// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ParallelProbe
 * @dev Test contract for measuring parallel execution performance on Monad
 * @notice This contract provides functions to test both hotspot and parallel-friendly scenarios
 */
contract ParallelProbe {
    // Global counter - creates hotspot (all transactions conflict)
    uint256 public globalCounter;
    
    // Per-user counters - parallel-friendly (independent storage)
    mapping(address => uint256) public userCounter;
    
    // Event for tracking hits
    event Hit(
        address indexed sender,
        bytes32 tag,
        uint256 globalValue,
        uint256 userValue
    );
    
    /**
     * @dev Hotspot function - all transactions will conflict
     * @param tag Random tag for identification
     * @notice This function accesses global state, causing all transactions to conflict
     */
    function globalInc(bytes32 tag) external {
        globalCounter += 1;
        userCounter[msg.sender] += 1;
        
        emit Hit(msg.sender, tag, globalCounter, userCounter[msg.sender]);
    }
    
    /**
     * @dev Parallel-friendly function - transactions can run in parallel
     * @param tag Random tag for identification
     * @notice This function only accesses user-specific storage, allowing parallel execution
     */
    function shardedInc(bytes32 tag) external {
        userCounter[msg.sender] += 1;
        
        emit Hit(msg.sender, tag, globalCounter, userCounter[msg.sender]);
    }
    
    /**
     * @dev Get current global counter value
     * @return Current value of globalCounter
     */
    function getGlobalCounter() external view returns (uint256) {
        return globalCounter;
    }
    
    /**
     * @dev Get user counter value for a specific address
     * @param user Address to query
     * @return Current value of userCounter for the address
     */
    function getUserCounter(address user) external view returns (uint256) {
        return userCounter[user];
    }
    
    /**
     * @dev Get both counters for an address
     * @param user Address to query
     * @return global Current global counter value
     * @return userCount Current user counter value
     */
    function getCounters(address user) external view returns (uint256 global, uint256 userCount) {
        return (globalCounter, userCounter[user]);
    }
}
