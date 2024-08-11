// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IUserAggregator {
    struct User {
        address userAddress;
        string sub;
        string postalCode;
    }

    function getUser(address _userAddress) external view returns (User memory);
}

contract LocalElection {
    address public owner;
    IUserAggregator public userAggregator;

    struct Candidate {
        string name;
        uint256 voteCount;
    }

    struct Position {
        string name;
        Candidate[] candidates;
    }

    struct Election {
        string postalCode;
        mapping(string => Position) positions;
        string[] positionNames;
        uint256 votingStartTime;
        bool votingActive;
        mapping(address => bool) hasVoted;
    }

    struct VoteChoice {
        string positionName;
        uint256 candidateIndex;
    }

    struct Voter {
        address userAddress;
        string sub;
        string postalCode;
    }

    mapping(string => Election) public elections;
    string[] public electionPostalCodes;

    event ElectionCreated(string postalCode, string[] positions);
    event ElectionStarted(string postalCode, uint256 startTime);
    event ElectionEnded(string postalCode);
    event VoteCasted(address voter, string postalCode, VoteChoice[] choices);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action.");
        _;
    }

    modifier validPostalCode(string memory postalCode) {
        require(
            bytes(elections[postalCode].postalCode).length != 0,
            "Invalid postal code: No election exists for this postal code."
        );
        _;
    }

    modifier duringVoting(string memory postalCode) {
        require(elections[postalCode].votingActive, "Voting is not active.");
        _;
    }

    modifier votingEnded(string memory postalCode) {
        require(!elections[postalCode].votingActive, "Voting is still active.");
        _;
    }

    constructor(address _userAggregator) {
        owner = msg.sender;
        userAggregator = IUserAggregator(_userAggregator);
    }

    function createElection(
        string memory _postalCode,
        string[] memory presidentCandidates,
        string[] memory secretaryCandidates,
        string[] memory representativeCandidates
    ) public onlyOwner {
        require(
            bytes(elections[_postalCode].postalCode).length == 0,
            "Election already exists for this postal code."
        );

        elections[_postalCode].postalCode = _postalCode;

        _addPositionWithCandidates(
            _postalCode,
            "President",
            presidentCandidates
        );
        _addPositionWithCandidates(
            _postalCode,
            "Secretary",
            secretaryCandidates
        );
        _addPositionWithCandidates(
            _postalCode,
            "Representative",
            representativeCandidates
        );

        electionPostalCodes.push(_postalCode);

        emit ElectionCreated(_postalCode, elections[_postalCode].positionNames);
    }

    function _addPositionWithCandidates(
        string memory postalCode,
        string memory positionName,
        string[] memory candidateNames
    ) internal onlyOwner {
        Position storage position = elections[postalCode].positions[
            positionName
        ];
        position.name = positionName;

        for (uint256 i = 0; i < candidateNames.length; i++) {
            position.candidates.push(Candidate(candidateNames[i], 0));
        }

        elections[postalCode].positionNames.push(positionName);
    }

    function startElection(string memory postalCode)
        public
        onlyOwner
        validPostalCode(postalCode)
    {
        require(
            !elections[postalCode].votingActive,
            "Voting is already active."
        );
        elections[postalCode].votingStartTime = block.timestamp;
        elections[postalCode].votingActive = true;

        emit ElectionStarted(postalCode, elections[postalCode].votingStartTime);
    }

    function vote(string memory postalCode, VoteChoice[] memory choices)
        public
        validPostalCode(postalCode)
        duringVoting(postalCode)
    {
        require(
            !elections[postalCode].hasVoted[msg.sender],
            "You have already voted."
        );

        // Retrieve voter information from IUserAggregator
        IUserAggregator.User memory user = userAggregator.getUser(msg.sender);
        // Check if the user is registered
        require(user.userAddress != address(0), "User not registered."); // Check if user address is not the zero address

        require(
            keccak256(bytes(user.postalCode)) == keccak256(bytes(postalCode)),
            "User's postal code does not match election postal code."
        );

        for (uint256 i = 0; i < choices.length; i++) {
            string memory positionName = choices[i].positionName;
            uint256 candidateIndex = choices[i].candidateIndex;

            require(
                candidateIndex <
                    elections[postalCode]
                        .positions[positionName]
                        .candidates
                        .length,
                "Invalid candidate index."
            );
            elections[postalCode]
                .positions[positionName]
                .candidates[candidateIndex]
                .voteCount += 1;
        }

        elections[postalCode].hasVoted[msg.sender] = true;

        emit VoteCasted(msg.sender, postalCode, choices);
    }

    function endElection(string memory postalCode)
        public
        onlyOwner
        validPostalCode(postalCode)
    {
        require(elections[postalCode].votingActive, "Voting is not active.");

        elections[postalCode].votingActive = false;

        emit ElectionEnded(postalCode);
    }

    function getResults(string memory postalCode)
        public
        view
        validPostalCode(postalCode)
        votingEnded(postalCode)
        returns (string[] memory, string[] memory)
    {
        string[] memory positions = elections[postalCode].positionNames;
        string[] memory winners = new string[](positions.length);

        for (uint256 i = 0; i < positions.length; i++) {
            Position storage position = elections[postalCode].positions[positions[i]];
            uint256 highestVoteCount = 0;
            string memory winnerName = "";

            for (uint256 j = 0; j < position.candidates.length; j++) {
                if (position.candidates[j].voteCount > highestVoteCount) {
                    highestVoteCount = position.candidates[j].voteCount;
                    winnerName = position.candidates[j].name;
                }
            }

            winners[i] = winnerName;
        }

        return (positions, winners);
    }

    function electionInfo(string memory postalCode)
        public
        view
        validPostalCode(postalCode)
        returns (string[] memory, string[][] memory)
    {
        string[] memory positions = elections[postalCode].positionNames;
        string[][] memory candidates = new string[][](positions.length);

        for (uint256 i = 0; i < positions.length; i++) {
            Position storage position = elections[postalCode].positions[
                positions[i]
            ];
            string[] memory candidateNames = new string[](
                position.candidates.length
            );

            for (uint256 j = 0; j < position.candidates.length; j++) {
                candidateNames[j] = position.candidates[j].name;
            }

            candidates[i] = candidateNames;
        }

        return (positions, candidates);
    }
}
