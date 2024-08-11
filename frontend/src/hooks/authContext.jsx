import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { readContract ,getContract} from "thirdweb";
import { client } from "../main";
import { defineChain } from "thirdweb";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isloading, setIsLoading] = useState(true);
  const [sub, setSub] = useState(null);
  const [zipCode, setZipCode] = useState(null);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          "https://backend-young-wildflower-4665.fly.dev/auth/check",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data && response.data.authenticated) {
          setIsAuthenticated(true);
          setSub(response.data.user.sub);
        } else {
          setIsAuthenticated(false);
          setToken(null);
          localStorage.removeItem("token");
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to validate token:", error);
        setIsAuthenticated(false);
        setToken(null);
        localStorage.removeItem("token");
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);


// connect to your contract
const contract = getContract({ 
  client, 
  chain: defineChain(84532), 
  address: "0x68E6773488b1ca6791DAC2C353f88bEf2B0B8841"
});

  const checkAuthenticationViaContract = async (_userAddress) => {
    const data = await readContract({ 
      contract, 
      method: "function getUser(address _userAddress) view returns ((address userAddress, string sub, string postalCode))", 
      params: [_userAddress] 
    })

    if (data) {
      setSub(data.sub);
      setZipCode(data.postalCode);
      setIsAuthenticated(true);
    }
  }

  const login = (newToken) => {
    setIsAuthenticated(true);
    setToken(newToken);
    localStorage.setItem("token", newToken);
    window.location.href = "/onboard";
  };

  const setZip = (zip) => {
    setZipCode(zip);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setToken(null);
    localStorage.removeItem("token");
  };

  const contextValue = {
    isAuthenticated,
    token,
    login,
    logout,
    isLoading: isloading,
    sub,
    zipCode,
    setZip,
    checkAuthenticationViaContract,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
