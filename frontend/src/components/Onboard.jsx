import React, { useEffect } from "react";
import { client } from "../main";
import { baseSepolia } from "thirdweb/chains";
import { useActiveAccount, useWalletDetailsModal } from "thirdweb/react";
import { ConnectButton } from "thirdweb/react";
import Blockies from "react-blockies";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/authContext";
import { useState } from "react";

function Onboard() {
  const account = useActiveAccount();
  const { open } = useWalletDetailsModal();

  function handleClick() {
    open({
      client: client,
      chain: baseSepolia,
      account: account,
      theme: "light",
    });
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const address = account?.address;
      if (!address) {
        window.location.href = "/";
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [account]);

  const { login, isAuthenticated, logout } = useAuth();
  useEffect(() => {
    if (isAuthenticated) {
      console.log("User is authenticated");
      return;
    }
    // Check if the URL has a code parameter (after being redirected from the OIDC provider)
    const urlParams = new URLSearchParams(window.location.search);
    const authToken = urlParams.get("token");
    if (authToken) {
      localStorage.setItem("token", authToken);
      login(authToken);
    }
  }, [isAuthenticated]); // Added isAuthenticated as a dependency

  const imageSrc =
    "https://assets.api.uizard.io/api/cdn/stream/c7bf6b48-5025-4cbe-92d0-c0dab3470e35.png";

  return (
    <div className="flex flex-col justify-between items-center">
      <div className="flex flex-row gap-3 items-center p-1.5">
        <div className="text-gray-900 font-bold text-xl">CivGuard Voting</div>
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
              <img src="human.svg" alt="User" className="w-10 h-8" />
            </button>
            <p onClick={logout} className="text-gray-700 text-sm font-medium">
              Human
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 items-center p-1.5 border border-black  mt-12">
        <div className="bg-gray-200 rounded-lg p-6 w-80 text-center">
          <img
            src={imageSrc}
            alt="Secure Voting"
            className="mx-auto mb-4"
            style={{ width: "100px", height: "auto" }}
          />
          <h2 className="text-lg font-semibold">Secure Voting</h2>
          <p className="text-gray-600 mt-2">
            Join now for secure voting experience! Verify your proof of humanity
            to get started. Verify with worldId
          </p>
        </div>
      </div>
      {!isAuthenticated ? (
        <button
          onClick={() =>
            (window.location.href =
              "https://backend-young-wildflower-4665.fly.dev/login")
          }
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-12"
        >
          Verify with WorldID
        </button>
      ) : (
        <button
          onClick={() =>
            alert("View contests")
          }
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-12"
        >
          View Contests
        </button>
      )}
    </div>
  );
}

export default Onboard;
