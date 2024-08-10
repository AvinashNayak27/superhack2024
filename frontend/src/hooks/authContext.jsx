import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isloading, setIsLoading] = useState(true);
  const [sub, setSub] = useState(null);

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

  const login = (newToken) => {
    setIsAuthenticated(true);
    setToken(newToken);
    localStorage.setItem("token", newToken);
    window.location.href = "/onboard";
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
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
