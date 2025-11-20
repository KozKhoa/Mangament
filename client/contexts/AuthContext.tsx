"use client";

import { createContext, useContext, useEffect, useState } from "react";
import * as rememberMe from "@/lib/remember-me";
import authService from "@/services/auth";
import { toast } from "sonner";
import * as token from "@/lib/token";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextProps {
  user: User | null;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(function () {
    const getUser = async () => {
      const res = await authService.me();

      if (res && res.success) {
        const user = res?.data.user;
        console.log(user);
        setUser(user);
      } else {
        toast.error("Your session has been expired");
      }
    };

    const rememer = rememberMe.getStatus();
    if (rememer && token.getAccessToken()) {
      getUser();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default function useAuth() {
  const context = useContext(AuthContext);
  return context;
}
