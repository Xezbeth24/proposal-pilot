"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User 
} from "firebase/auth";
import { auth } from "@/firebase";

// Define the context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fixed login function
  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Fixed useEffect with BOTH redirect handling AND auth state listener
  useEffect(() => {
  console.log("🔍 Checking redirect result...");
  
  getRedirectResult(auth)
    .then((result) => {
      console.log("📱 Redirect result:", result);
      if (result?.user) {
        console.log("✅ User from redirect:", result.user.email);
        setUser(result.user);
      } else {
        console.log("❌ No redirect user");
      }
    })
    .catch((error) => {
      console.error("❌ Redirect error:", error);
    })
    .finally(() => {
      setLoading(false);
    });


    // 2. Listen for auth state changes (for normal logins and keeping user logged in)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
