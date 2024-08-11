import React, { useState,useEffect } from "react";
import { useParams } from "react-router-dom";
import { useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { client } from "../main";
import { defineChain } from "thirdweb/chains";
import { prepareContractCall, sendAndConfirmTransaction } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { ConnectButton } from "thirdweb/react";
import Blockies from "react-blockies";
import { useAuth } from "../hooks/authContext";


function Election() {
    const account = useActiveAccount()
  const contract = getContract({
    client,
    chain: defineChain(84532),
    address: "0x9A3d4E9FD22e75869e5425Fe9A9569af49F189dE",
  });

  const { isAuthenticated, checkAuthenticationViaContract, logout } = useAuth();

  useEffect(() => {
    checkAuthenticationViaContract(account?.address).then(() => {
      console.log("User is authenticated");
    });
  }, [account]);

  function handleClick() {
    open({
      client: client,
      chain: baseSepolia,
      account: account,
      theme: "light",
    });
  }


  const params = useParams();
  const key = params?.key;

  const { data: electionInfo, isLoading: isElectionInfoLoading } =
    useReadContract({
      contract,
      method:
        "function electionInfo(string postalCode) view returns (string[], string[][])",
      params: [key],
    });

  const positions = electionInfo?.[0] || [];
  const participants = electionInfo?.[1] || [];

  const [votes, setVotes] = useState(
    positions.reduce((acc, position) => ({ ...acc, [position]: -1 }), {})
  );

  const handleVote = (position, participantIndex) => {
    setVotes((prevVotes) => ({
      ...prevVotes,
      [position]: participantIndex,
    }));
  };

  const handleSubmit = async () => {
    const formattedVotes = Object.entries(votes).map(([position, index]) => [
        position,
        index
      ]);
    console.log("Votes:", formattedVotes);
    const transaction = await prepareContractCall({
      contract,
      method:
        "function vote(string postalCode, (string positionName, uint256 candidateIndex)[] choices)",
      params: [key, formattedVotes],
    });
    const { transactionHash } = await sendAndConfirmTransaction({
      transaction,
      account,
    });

    console.log(transactionHash);
  };

  const { data: election, isLoading } = useReadContract({
    contract,
    method:
      "function elections(string) view returns (string postalCode, uint256 votingStartTime, bool votingActive)",
    params: [key],
  });

  if (isLoading || isElectionInfoLoading) {
    return <div className="text-center text-lg py-6">Loading...</div>;
  }

    if (Array.isArray(election) && !election[2]) {
      return <p className="text-center text-lg py-6">Voting not started yet</p>;
    }

  return (
    <div className="flex flex-col justify-between items-center">
      <div className="flex flex-row gap-3 items-center p-1.5">
      <a href="/" class="text-gray-900 font-bold text-xl">
  CivGuard Voting
</a>
        <div style={{ display: "none" }}>
          <ConnectButton client={client} />
        </div>

        {!isAuthenticated ? (
          <div className="flex flex-row gap-3 items-center p-1.5 border border-black ml-4">
            <button onClick={handleClick}>
              <Blockies seed={account?.address} size={10} scale={3} />
            </button>
            <p className="text-gray-700 text-sm font-medium">Not Human</p>
          </div>
        ) : (
          <div className="flex flex-row gap-3 items-center p-1.5 border border-black ml-4">
            <button onClick={handleClick}>
            <img src="https://civguard.vercel.app/human.svg" alt="User" className="w-10 h-8" />
            </button>
            <p onClick={logout} className="text-gray-700 text-sm font-medium">
              Human
            </p>
          </div>
        )}
      </div>
      <div className="bg-white shadow-md rounded-lg p-6">
        {positions.map((position, positionIndex) => (
          <div key={position} className="mb-6">
            <h2 className="text-xl font-semibold mb-3">{position}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {participants[positionIndex].map(
                (participant, participantIndex) => (
                  <button
                    key={participant}
                    onClick={() => handleVote(position, participantIndex)}
                    className={`py-2 px-4 rounded-md transition-colors ${
                      votes[position] === participantIndex
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                  >
                    {participant}
                  </button>
                )
              )}
            </div>
          </div>
        ))}
        <button
          onClick={handleSubmit}
          className="mt-6 w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
        >
          Submit Votes
        </button>
      </div>
    </div>
  );
}

export default Election;