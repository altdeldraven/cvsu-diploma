// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DiplomaRegistry {
    address public owner;
    
    mapping(string => bytes32) private diplomaHashes;
    mapping(string => bool) private diplomaExists_;
    mapping(string => uint256) private diplomaTimestamps;
    
    event DiplomaRegistered(string certificateId, bytes32 diplomaHash, uint256 timestamp);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function registerDiploma(string calldata certificateId, bytes32 diplomaHash) external onlyOwner {
        require(!diplomaExists_[certificateId], "Diploma already registered");
        require(diplomaHash != bytes32(0), "Invalid diploma hash");
        
        diplomaHashes[certificateId] = diplomaHash;
        diplomaExists_[certificateId] = true;
        diplomaTimestamps[certificateId] = block.timestamp;
        
        emit DiplomaRegistered(certificateId, diplomaHash, block.timestamp);
    }
    
    function verifyDiploma(string calldata certificateId) external view returns (bytes32 hash, uint256 timestamp, bool exists) {
        return (
            diplomaHashes[certificateId],
            diplomaTimestamps[certificateId],
            diplomaExists_[certificateId]
        );
    }
    
    function isDiplomaRegistered(string calldata certificateId) external view returns (bool) {
        return diplomaExists_[certificateId];
    }
}
