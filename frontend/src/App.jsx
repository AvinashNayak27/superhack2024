import React from "react";
import "./App.css";
import { useConnect } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import { client } from "./main";
import { baseSepolia } from "thirdweb/chains";
import { useActiveAccount } from "thirdweb/react";

const VotingAppIntro = () => {
  const { connect } = useConnect();
  const account = useActiveAccount();

  return (
    <div className="flex flex-col items-center min-h-screen bg-white mt-32">
      <div className="text-center">
        <div className="flex flex-row gap-2 mb-4 justify-center">
          <span className="inline-flex items-center">
            <img
              src="https://assets.api.uizard.io/api/cdn/stream/e1b54aec-1966-42a3-b7cd-adf7b9a0a364.png"
              alt="Voting Icon"
              className="w-10 h-auto"
            />
          </span>
          <h1 className="text-3xl font-bold text-black inline">
            CivGuard Voting
          </h1>
        </div>

        <p className="text-md text-gray-600 mb-6">
          Secure, user-friendly interface prioritizing privacy and
          accessibility.
        </p>
      </div>
      <div className="mb-6">
        <img
          src="https://assets.api.uizard.io/api/cdn/stream/1f758a1b-6759-4a7f-942a-d3bbf99cc338.png"
          alt="Voting Icon"
          className="w-64 h-auto"
        />
      </div>
      {!account ? (
        <button
          style={{
            cursor: "pointer",
            width: "335px",
            height: "56px",
            padding: "0px 8px",
            border: "0",
            boxSizing: "border-box",
            borderRadius: "12px",
            backgroundColor: "#030303",
            color: "#ffffff",
            fontSize: "18px",
            fontWeight: "700",
            lineHeight: "23px",
            outline: "none",
          }}
          onClick={() => {
            connect(async () => {
              const coinbase = createWallet("com.coinbase.wallet", {
                walletConfig: {
                  options: "all",
                },
              });
              await coinbase.connect({
                client,
                chain: baseSepolia,
              });
              return coinbase;
            });
          }}
        >
          Create or Connect Wallet
        </button>
      ) : (
        <button
          style={{
            cursor: "pointer",
            width: "335px",
            height: "56px",
            padding: "0px 8px",
            border: "0",
            boxSizing: "border-box",
            borderRadius: "12px",
            backgroundColor: "#030303",
            color: "#ffffff",
            fontSize: "18px",
            fontWeight: "700",
            lineHeight: "23px",
            outline: "none",
          }}
          onClick={() => {
            alert("App in progress ...");
          }}
        >
          Vote Now
        </button>
      )}
    </div>
  );
};

export default VotingAppIntro;
