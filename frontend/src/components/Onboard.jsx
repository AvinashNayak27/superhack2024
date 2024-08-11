import React, { useEffect, useState } from "react";
import { client } from "../main";
import { baseSepolia } from "thirdweb/chains";
import { useActiveAccount, useWalletDetailsModal } from "thirdweb/react";
import { ConnectButton } from "thirdweb/react";
import Blockies from "react-blockies";
import { useAuth } from "../hooks/authContext";
import { Reclaim } from "@reclaimprotocol/js-sdk";
import QRCode from "react-qr-code";
import useBrowserInfo from "../hooks/browser";
import axios from "axios";

function Onboard() {
  const account = useActiveAccount();
  const { open } = useWalletDetailsModal();
  const { deviceType } = useBrowserInfo();
  const [url, setUrl] = useState("");
  const [ready, setReady] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

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

  const { login, isAuthenticated, logout, setZip, zipCode, sub,checkAuthenticationViaContract } = useAuth();

  useEffect(() => {
    checkAuthenticationViaContract(account?.address).then(() => {
      console.log("User is authenticated");
    });
  }, [account]);

  async function addUser(data) {
    try {
      const token = localStorage.getItem('token'); // Retrieve the token from local storage
      const response = await axios.post(
        "https://backend-young-wildflower-4665.fly.dev/addUser",
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Set the Authorization header
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("There was an error!", error);
    }
  }
  
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

  const APP_ID = "0x7FeB79d4bd2D436F3b077955D4Af609DB2Ae0AE1"; //TODO: replace with your applicationId
  const reclaimClient = new Reclaim.ProofRequest(APP_ID);

  const openModal = (url) => {
    setCurrentUrl(url);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentUrl("");
    setUrl("");
  };

  useEffect(() => {
    if (ready) {
      closeModal();
    }
  }, [ready]);

  useEffect(() => {
    if (url && deviceType === "Desktop") {
      openModal(url);
    }
  }, [url]);

  async function generateVerificationRequest() {
    const providerId = "50fccb9e-d81c-4894-b4d1-111f6d33c7a0"; //TODO: replace with your provider ids you had selected while creating the application

    await reclaimClient.buildProofRequest(providerId);

    reclaimClient.setSignature(
      await reclaimClient.generateSignature(
        "0x812b8eab00bbb585400b899d2ca99a6ab4d1834bc953aa186fafc0126147fcd5" //TODO : replace with your APP_SECRET
      )
    );

    const { requestUrl, statusUrl } =
      await reclaimClient.createVerificationRequest();

    setUrl(requestUrl);

    if (deviceType === "Mobile") {
      window.open(requestUrl, "_blank");
    }

    await reclaimClient.startSession({
      onSuccessCallback: (proofs) => {
        console.log("Verification success", proofs);
        const proof = proofs[0];
        const parameters = JSON.parse(proof.claimData.parameters);
        const addresses = JSON.parse(parameters.paramValues.addresses);
        console.log("Addresses", addresses);
        const zipcode = addresses[0].address.match(/\b\d{6}\b/)[0];
        console.log("Zipcode", zipcode);
        setZip(zipcode);
        setReady(true);
        const data = {
          walletAddress: account?.address,
          sub: sub,
          zipCode: zipcode,
        };
        addUser(data).then((response) => {
          console.log("User added", response);
        });
      },
      onFailureCallback: (error) => {
        console.error("Verification failed", error);
      },
    });
  }

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

      <div className="flex flex-col gap-2 items-center p-4 border border-black mt-12">
        {!isAuthenticated && (
          <button
            onClick={() =>
              (window.location.href =
                "https://backend-young-wildflower-4665.fly.dev/login")
            }
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Verify with WorldID
          </button>
        )}
        {isAuthenticated && (
          <>
            <button className="mt-4 w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 focus:outline-none focus:bg-green-600">
              Verified with WorldID ✅
            </button>
          </>
        )}

        {!zipCode && (
          <>
            {deviceType === "Desktop" && !url && (
              <button
                className="mt-4 w-full bg-indigo-500 text-white py-2 px-4 rounded hover:bg-indigo-600 focus:outline-none focus:bg-indigo-600"
                onClick={generateVerificationRequest}
              >
                Verify Res. Address
              </button>
            )}
            {deviceType === "Mobile" && !url && (
              <button
                className="mt-4 w-full bg-indigo-500 text-white py-2 px-4 rounded hover:bg-indigo-600 focus:outline-none focus:bg-indigo-600"
                onClick={generateVerificationRequest}
              >
                Verify Res. Address
              </button>
            )}
          </>
        )}
        {zipCode && (
          <>
            <button className="mt-4 w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 focus:outline-none focus:bg-green-600">
              Verified Res. Address {zipCode} ✅
            </button>
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg">
            <QRCode value={currentUrl} />
            <button
              onClick={closeModal}
              className="mt-4 w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 focus:outline-none focus:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Onboard;
