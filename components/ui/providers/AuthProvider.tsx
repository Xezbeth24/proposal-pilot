"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { 
  signInWithPopup,     // ← BACK TO POPUP
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User 
} from "firebase/auth";
import { auth } from "@/firebase";

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

  const login = async () => {
    console.log("🚀 Login clicked!");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'  // Fix mobile account selection
      });
      const result = await signInWithPopup(auth, provider);  // ← POPUP
      console.log("✅ Popup login success:", result.user.email);
    } catch (error: any) {
      console.error("❌ Login error:", error.code, error.message);
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("User closed popup - normal");
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("❌ Logout failed:", error);
    }
  };

  useEffect(() => {
    console.log("🔍 AuthProvider init");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("👤 User state:", user?.email || "null");
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
