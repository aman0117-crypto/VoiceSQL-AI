import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    return sessionStorage.getItem("voice_sql_token");
  });

  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem("voice_sql_user");

    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const login = (newToken, userData = null) => {
    sessionStorage.setItem("voice_sql_token", newToken);

    if (userData) {
      sessionStorage.setItem(
        "voice_sql_user",
        JSON.stringify(userData)
      );
    }

    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem("voice_sql_token");
    sessionStorage.removeItem("voice_sql_user");

    setToken(null);
    setUser(null);
  };

  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}