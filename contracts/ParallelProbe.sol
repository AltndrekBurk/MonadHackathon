// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ParallelProbe
 * @notice Test contract for Monad parallel execution capabilities
 * @dev Contains both hotspot and parallel-friendly functions
 */
contract ParallelProbe {
    // ================================
    // STATE VARIABLES
    // ================================
    
    /// @notice Global counter - creates hotspot contention
    uint256 public globalCounter;
    
    /// @notice User-specific counters - enables parallel execution
    mapping(address => uint256) public userCounter;

    // ================================
    // EVENTS
    // ================================
    
    /**
     * @notice Emitted when a function is called
     * @param sender Transaction sender
     * @param tag Unique identifier for this call
     * @param globalValue Current global counter value
     * @param userValue Current user counter value
     */
    event Hit(
        address indexed sender,
        bytes32 tag,
        uint256 globalValue,
        uint256 userValue
    );

    // ================================
    // HOTSPOT FUNCTION
    // ================================
    
    /**
     * @notice Increments global counter (creates contention)
     * @dev All transactions conflict on globalCounter
     * @param tag Unique identifier for tracking
     */
    function globalInc(bytes32 tag) external {
        unchecked {
            globalCounter += 1;
        }
        emit Hit(msg.sender, tag, globalCounter, userCounter[msg.sender]);
    }

    // ================================
    // PARALLEL-FRIENDLY FUNCTION
    // ================================
    
    /**
     * @notice Increments user-specific counter (parallel-friendly)
     * @dev Each sender has independent storage slot
     * @param tag Unique identifier for tracking
     */
    function shardedInc(bytes32 tag) external {
        unchecked {
            userCounter[msg.sender] += 1;
        }
        emit Hit(msg.sender, tag, globalCounter, userCounter[msg.sender]);
    }
}
