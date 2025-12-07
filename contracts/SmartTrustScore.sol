// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract SmartTrustScore {
    address public owner;

    struct ParticipantScore {
        address participant;
        uint256 score;
        uint256 successfulDeliveries;
        uint256 failedDeliveries;
        uint256 flaggedProducts;
        uint256 lastUpdated;
        bool exists;
    }

    mapping(address => ParticipantScore) public scores;
    address[] public participantList;

    event ScoreMinted(address indexed participant, uint256 initialScore);
    event ScoreUpdated(address indexed participant, uint256 newScore, string reason);
    event TrustLevelChanged(address indexed participant, string newLevel);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor() public {
        owner = msg.sender;
    }

    function mintTrustScore(address _participant) public onlyOwner {
        require(!scores[_participant].exists, "Score already exists");
        
        scores[_participant] = ParticipantScore({
            participant: _participant,
            score: 50,
            successfulDeliveries: 0,
            failedDeliveries: 0,
            flaggedProducts: 0,
            lastUpdated: block.timestamp,
            exists: true
        });

        participantList.push(_participant);
        emit ScoreMinted(_participant, 50);
        emit TrustLevelChanged(_participant, "Silver");
    }

    function recordSuccessfulDelivery(address _participant) public onlyOwner {
        require(scores[_participant].exists, "Participant not found");
        
        scores[_participant].successfulDeliveries++;
        updateScore(_participant);
        emit ScoreUpdated(_participant, scores[_participant].score, "Successful delivery");
    }

    function recordFailedDelivery(address _participant) public onlyOwner {
        require(scores[_participant].exists, "Participant not found");
        
        scores[_participant].failedDeliveries++;
        updateScore(_participant);
        emit ScoreUpdated(_participant, scores[_participant].score, "Failed delivery");
    }

    function recordFlaggedProduct(address _participant) public onlyOwner {
        require(scores[_participant].exists, "Participant not found");
        
        scores[_participant].flaggedProducts++;
        updateScore(_participant);
        emit ScoreUpdated(_participant, scores[_participant].score, "Product flagged");
    }

    function updateScore(address _participant) private {
        require(scores[_participant].exists, "Participant not found");
        
        ParticipantScore storage ps = scores[_participant];
        
        uint256 deliveryScore = 0;
        uint256 totalDeliveries = ps.successfulDeliveries + ps.failedDeliveries;
        
        if (totalDeliveries > 0) {
            deliveryScore = (ps.successfulDeliveries * 40) / totalDeliveries;
        } else {
            deliveryScore = 20;
        }
        
        uint256 riskPenalty = ps.flaggedProducts * 10;
        if (riskPenalty > 40) riskPenalty = 40;
        uint256 riskScore = 40 - riskPenalty;
        
        uint256 performanceScore = 20;
        if (ps.failedDeliveries > ps.successfulDeliveries) {
            performanceScore = 10;
        }
        
        uint256 newScore = deliveryScore + riskScore + performanceScore;
        if (newScore > 100) newScore = 100;
        
        string memory oldLevel = getTrustLevel(_participant);
        ps.score = newScore;
        ps.lastUpdated = block.timestamp;
        
        string memory newLevel = getTrustLevel(_participant);
        if (keccak256(bytes(oldLevel)) != keccak256(bytes(newLevel))) {
            emit TrustLevelChanged(_participant, newLevel);
        }
    }

    function getScore(address _participant) public view returns (uint256) {
        require(scores[_participant].exists, "Participant not found");
        return scores[_participant].score;
    }

    function getTrustLevel(address _participant) public view returns (string memory) {
        require(scores[_participant].exists, "Participant not found");
        uint256 score = scores[_participant].score;
        
        if (score >= 80) return "Platinum";
        if (score >= 60) return "Gold";
        if (score >= 40) return "Silver";
        return "Bronze";
    }

    function getParticipantDetails(address _participant) 
        public 
        view 
        returns (
            uint256 score,
            uint256 successfulDeliveries,
            uint256 failedDeliveries,
            uint256 flaggedProducts,
            string memory trustLevel
        ) 
    {
        require(scores[_participant].exists, "Participant not found");
        ParticipantScore memory ps = scores[_participant];
        
        return (
            ps.score,
            ps.successfulDeliveries,
            ps.failedDeliveries,
            ps.flaggedProducts,
            getTrustLevel(_participant)
        );
    }

    function getAllParticipants() public view returns (address[] memory) {
        return participantList;
    }

    function getParticipantCount() public view returns (uint256) {
        return participantList.length;
    }

    function participantExists(address _participant) public view returns (bool) {
        return scores[_participant].exists;
    }
}
