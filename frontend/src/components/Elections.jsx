import React from "react";
import { useAuth } from "../hooks/authContext";
import { useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { ConnectButton } from "thirdweb/react";
import { client } from "../main";
import Blockies from "react-blockies";
import { getContract, readContract } from "thirdweb";
import { useState } from "react";
import { defineChain } from "thirdweb/chains";

const getElectionPostalCodes = async (key) => {
  const contract = getContract({
    client,
    chain: defineChain(84532),
    address: "0x9A3d4E9FD22e75869e5425Fe9A9569af49F189dE",
  });
  try {
    const data = await readContract({
      contract,
      method: "function electionPostalCodes(uint256) view returns (string)",
      params: [key],
    });

    return data;
  } catch (err) {
    console.error(err);
  }
};

function Elections() {
  const account = useActiveAccount();
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
  const [elections, setElections] = useState(null);

  useEffect(() => {
    const fetchElections = async () => {
      const electionKeys = [0, 1, 2, 3, 4];
      try {
        const postalCodes = await Promise.all(
          electionKeys.map(async (key) => {
            try {
              return [key, await getElectionPostalCodes(key)];
            } catch (err) {
              console.error(`Error fetching postal code for key ${key}:`, err);
              return [key, null];
            }
          })
        );
        setElections(Object.fromEntries(postalCodes.filter(([, code]) => code !== null)));
      } catch (err) {
        console.error("Error fetching elections:", err);
      }
    };

    fetchElections();
  }, []);


  console.log(elections);

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
              <img
                src="https://civguard.vercel.app/human.svg"
                alt="User"
                className="w-10 h-8"
              />
            </button>
            <p onClick={logout} className="text-gray-700 text-sm font-medium">
              Human
            </p>
          </div>
        )}
      </div>
      {isAuthenticated ? (
        <div className="p-6 bg-gray-100 rounded-lg shadow-md mt-12">
          <h1 className="text-2xl font-bold mb-2">Elections</h1>
          <p className="text-lg text-gray-700 mb-4">
            Here you can vote for your favorite candidate
          </p>
          {Object?.entries(elections).map(([key, postalCode]) => (
            <div
              key={key} // Ensure to add a key for the list items
              className="flex flex-row justify-between items-center p-4 mb-2 bg-white border rounded-lg shadow-sm"
            >
              <span className="text-gray-800">Election {postalCode}</span>
              <button
                onClick={() => {
                  window.location.href = `/election/${postalCode}`;
                }}
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                Vote Now
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center  h-screen mt-8">
          <h1 class="text-2xl font-bold text-red-500 mb-4">
            Not authenticated
          </h1>
          <p class="text-lg text-gray-700 mb-6">
            You need to authenticate to vote
          </p>
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            class="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors"
          >
            Go Home
          </button>
        </div>
      )}
    </div>
  );
}

export default Elections;
