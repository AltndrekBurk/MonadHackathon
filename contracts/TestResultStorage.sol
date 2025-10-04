// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TestResultStorage
 * @notice On-chain storage for parallel execution test results
 * @dev Stores comprehensive performance metrics
 */
contract TestResultStorage {
    // ================================
    // STRUCTS
    // ================================
    
    /**
     * @notice Test result data structure
     * @param requester Address that ran the test
     * @param testedContract Contract that was tested
     * @param targetFunc Function name that was tested
     * @param sent Total transactions sent
     * @param ok Successful transactions
     * @param fail Failed transactions
     * @param avgLatencyMs Average latency in milliseconds
     * @param p95LatencyMs 95th percentile latency
     * @param avgGasUsed Average gas consumed
     * @param parallelScore Overall performance score (0-100)
     * @param timestamp Test execution timestamp
     */
    struct Result {
        address requester;
        address testedContract;
        string targetFunc;
        uint256 sent;
        uint256 ok;
        uint256 fail;
        uint256 avgLatencyMs;
        uint256 p95LatencyMs;
        uint256 avgGasUsed;
        uint256 parallelScore;
        uint256 timestamp;
    }

    // ================================
    // STATE VARIABLES
    // ================================
    
    /// @notice Results stored per requester address
    mapping(address => Result[]) public resultsByRequester;

    // ================================
    // EVENTS
    // ================================
    
    /**
     * @notice Emitted when a result is saved
     * @param requester Address that saved the result
     * @param testedContract Contract that was tested
     * @param func Function that was tested
     * @param idx Index of the saved result
     */
    event Saved(
        address indexed requester,
        address indexed testedContract,
        string func,
        uint256 idx
    );

    // ================================
    // EXTERNAL FUNCTIONS
    // ================================
    
    /**
     * @notice Save a test result
     * @param r Result struct containing test data
     */
    function saveResult(Result calldata r) external {
        resultsByRequester[msg.sender].push(r);
        emit Saved(
            msg.sender,
            r.testedContract,
            r.targetFunc,
            resultsByRequester[msg.sender].length - 1
        );
    }

    /**
     * @notice Get number of results for an address
     * @param requester Address to query
     * @return Number of stored results
     */
    function getResultsCount(address requester) external view returns (uint256) {
        return resultsByRequester[requester].length;
    }

    /**
     * @notice Get a specific result
     * @param requester Address that ran the test
     * @param idx Result index
     * @return Result struct
     */
    function getResult(address requester, uint256 idx)
        external
        view
        returns (Result memory)
    {
        return resultsByRequester[requester][idx];
    }
}
