// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TestResultStorage
 * @dev Contract for storing and retrieving test results on-chain
 * @notice This contract allows storing test results permanently on the blockchain
 * @author Monad Parallel Tester Team
 */
contract TestResultStorage {
    // Struct to store test result data
    struct TestResult {
        address contractAddress;      // Test edilen kontrat adresi
        string functionName;           // Test edilen fonksiyon (globalInc/shardedInc)
        uint256 sent;                  // Gönderilen toplam TX sayısı
        uint256 success;               // Başarılı TX sayısı
        uint256 failed;                // Başarısız TX sayısı
        uint256 avgLatency;            // Ortalama gecikme (ms)
        uint256 p95Latency;            // P95 gecikme (ms)
        uint256 avgGas;                // Ortalama gas kullanımı
        uint256 successRate;           // Başarı oranı (0-100)
        uint256 parallelScore;         // Paralel performans skoru (0-100)
        uint256 timestamp;             // Test zamanı
        address tester;                // Test eden kullanıcı
    }
    
    // Struct for statistics
    struct ContractStats {
        uint256 testCount;             // Bu kontrat için test sayısı
        uint256 totalScore;            // Toplam skor
        uint256 avgScore;              // Ortalama skor
        uint256 bestScore;             // En iyi skor
        uint256 worstScore;            // En kötü skor
    }
    
    // Mapping to store results by test ID
    mapping(bytes32 => TestResult) public testResults;
    
    // Array to store all test IDs for enumeration
    bytes32[] public testIds;
    
    // Mapping to store test IDs by tester address
    mapping(address => bytes32[]) public testerTests;
    
    // Mapping to store test IDs by contract address
    mapping(address => bytes32[]) public contractTests;
    
    // Mapping to store stats by contract address
    mapping(address => ContractStats) public contractStats;
    
    // Events
    event TestRequested(
        bytes32 indexed requestId,
        address indexed requester,
        address indexed targetContract,
        string functionName,
        uint256 txCount,
        uint256 timestamp
    );
    
    event TestResultStored(
        bytes32 indexed testId,
        address indexed tester,
        address indexed contractAddress,
        uint256 parallelScore
    );
    
    event TestCompleted(
        bytes32 indexed testId,
        address indexed tester,
        string functionName,
        uint256 successRate,
        uint256 parallelScore
    );
    
    /**
     * @dev Request a new test to be performed by the backend
     * @param targetContract Address of the contract to test
     * @param functionName Name of the function to test (globalInc/shardedInc)
     * @param txCount Number of transactions to send
     * @return requestId Unique identifier for this test request
     */
    function requestTest(
        address targetContract,
        string memory functionName,
        uint256 txCount
    ) external returns (bytes32) {
        require(targetContract != address(0), "Invalid contract address");
        require(bytes(functionName).length > 0, "Function name required");
        require(txCount > 0 && txCount <= 1000, "TX count must be 1-1000");
        
        // Generate unique request ID
        bytes32 requestId = keccak256(
            abi.encodePacked(
                msg.sender,
                targetContract,
                functionName,
                txCount,
                block.timestamp
            )
        );
        
        // Emit event for backend to listen
        emit TestRequested(
            requestId,
            msg.sender,
            targetContract,
            functionName,
            txCount,
            block.timestamp
        );
        
        return requestId;
    }
    
    /**
     * @dev Store a test result
     * @param testId Unique identifier for the test
     * @param result Test result data to store
     */
    function storeTestResult(bytes32 testId, TestResult memory result) external {
        require(result.contractAddress != address(0), "Invalid contract address");
        require(result.sent > 0, "Sent count must be > 0");
        require(result.success + result.failed == result.sent, "Invalid counts");
        require(result.parallelScore <= 100, "Score must be <= 100");
        require(result.successRate <= 100, "Success rate must be <= 100");
        
        // Set tester as msg.sender
        result.tester = msg.sender;
        
        // Store result
        testResults[testId] = result;
        testIds.push(testId);
        testerTests[msg.sender].push(testId);
        contractTests[result.contractAddress].push(testId);
        
        // Update contract stats
        ContractStats storage stats = contractStats[result.contractAddress];
        stats.testCount++;
        stats.totalScore += result.parallelScore;
        stats.avgScore = stats.totalScore / stats.testCount;
        
        if (stats.testCount == 1) {
            stats.bestScore = result.parallelScore;
            stats.worstScore = result.parallelScore;
        } else {
            if (result.parallelScore > stats.bestScore) {
                stats.bestScore = result.parallelScore;
            }
            if (result.parallelScore < stats.worstScore) {
                stats.worstScore = result.parallelScore;
            }
        }
        
        emit TestResultStored(
            testId,
            msg.sender,
            result.contractAddress,
            result.parallelScore
        );
        
        emit TestCompleted(
            testId,
            msg.sender,
            result.functionName,
            result.successRate,
            result.parallelScore
        );
    }
    
    /**
     * @dev Get a test result by ID
     * @param testId Test ID to retrieve
     * @return result Test result data
     */
    function getTestResult(bytes32 testId) external view returns (TestResult memory result) {
        return testResults[testId];
    }
    
    /**
     * @dev Get all test IDs
     * @return Array of all test IDs
     */
    function getAllTestIds() external view returns (bytes32[] memory) {
        return testIds;
    }
    
    /**
     * @dev Get test IDs for a specific tester
     * @param tester Tester address
     * @return Array of test IDs for the tester
     */
    function getTesterTests(address tester) external view returns (bytes32[] memory) {
        return testerTests[tester];
    }
    
    /**
     * @dev Get total number of stored tests
     * @return Number of stored tests
     */
    function getTotalTests() external view returns (uint256) {
        return testIds.length;
    }
    
    /**
     * @dev Get test results with pagination
     * @param offset Starting index
     * @param limit Number of results to return
     * @return results Array of test results
     */
    function getTestResults(uint256 offset, uint256 limit) external view returns (TestResult[] memory results) {
        uint256 total = testIds.length;
        if (offset >= total) {
            return new TestResult[](0);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        results = new TestResult[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            results[i - offset] = testResults[testIds[i]];
        }
    }
    
    /**
     * @dev Get test statistics
     * @return totalTests Total number of tests
     * @return avgScore Average parallel score
     * @return bestScore Best parallel score
     * @return worstScore Worst parallel score
     */
    function getTestStats() external view returns (
        uint256 totalTests,
        uint256 avgScore,
        uint256 bestScore,
        uint256 worstScore
    ) {
        totalTests = testIds.length;
        if (totalTests == 0) {
            return (0, 0, 0, 0);
        }
        
        uint256 totalScore = 0;
        bestScore = 0;
        worstScore = 100;
        
        for (uint256 i = 0; i < totalTests; i++) {
            TestResult memory result = testResults[testIds[i]];
            totalScore += result.parallelScore;
            
            if (result.parallelScore > bestScore) {
                bestScore = result.parallelScore;
            }
            
            if (result.parallelScore < worstScore) {
                worstScore = result.parallelScore;
            }
        }
        
        avgScore = totalScore / totalTests;
    }
    
    /**
     * @dev Get tests for a specific contract address
     * @param contractAddress Contract address to query
     * @return Array of test IDs for the contract
     */
    function getContractTests(address contractAddress) external view returns (bytes32[] memory) {
        return contractTests[contractAddress];
    }
    
    /**
     * @dev Get statistics for a specific contract
     * @param contractAddress Contract address to query
     * @return stats Contract statistics
     */
    function getContractStats(address contractAddress) external view returns (ContractStats memory stats) {
        return contractStats[contractAddress];
    }
    
    /**
     * @dev Get latest N test results
     * @param count Number of latest results to return
     * @return results Array of latest test results
     */
    function getLatestTests(uint256 count) external view returns (TestResult[] memory results) {
        uint256 total = testIds.length;
        if (total == 0 || count == 0) {
            return new TestResult[](0);
        }
        
        uint256 resultCount = count > total ? total : count;
        results = new TestResult[](resultCount);
        
        for (uint256 i = 0; i < resultCount; i++) {
            results[i] = testResults[testIds[total - 1 - i]];
        }
    }
    
    /**
     * @dev Get top scoring tests
     * @param count Number of top tests to return
     * @return results Array of top scoring test results
     */
    function getTopTests(uint256 count) external view returns (TestResult[] memory results) {
        uint256 total = testIds.length;
        if (total == 0 || count == 0) {
            return new TestResult[](0);
        }
        
        // Simple implementation: return all and let frontend sort
        // For production, implement on-chain sorting or use sorted storage
        uint256 resultCount = count > total ? total : count;
        results = new TestResult[](resultCount);
        
        // Get all scores
        uint256[] memory scores = new uint256[](total);
        for (uint256 i = 0; i < total; i++) {
            scores[i] = testResults[testIds[i]].parallelScore;
        }
        
        // Simple selection sort for top N (gas expensive for large datasets)
        for (uint256 i = 0; i < resultCount; i++) {
            uint256 maxIdx = i;
            for (uint256 j = i + 1; j < total; j++) {
                if (scores[j] > scores[maxIdx]) {
                    maxIdx = j;
                }
            }
            // Swap
            uint256 tempScore = scores[i];
            scores[i] = scores[maxIdx];
            scores[maxIdx] = tempScore;
            
            results[i] = testResults[testIds[i]];
        }
    }
    
    /**
     * @dev Check if a test ID exists
     * @param testId Test ID to check
     * @return exists Whether the test exists
     */
    function testExists(bytes32 testId) external view returns (bool exists) {
        return testResults[testId].timestamp != 0;
    }
    
    /**
     * @dev Generate a test ID from parameters
     * @param tester Tester address
     * @param contractAddress Contract address
     * @param timestamp Timestamp
     * @return testId Generated test ID
     */
    function generateTestId(
        address tester,
        address contractAddress,
        uint256 timestamp
    ) external pure returns (bytes32 testId) {
        return keccak256(abi.encodePacked(tester, contractAddress, timestamp));
    }
}

