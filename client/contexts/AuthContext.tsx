"use client";

import { createContext, useContext, useEffect, useState } from "react";
import * as rememberMe from "@/lib/remember-me";
import authService from "@/services/auth";
import { toast } from "sonner";
import * as token from "@/lib/token";
import User from "@/types/user";
import userService from "@/services/user";

interface AuthContextProps {
  user: User | null;
  setUser: (user: User) => void;
  getUser: () => User | null;

  updateGender: (newGender: string) => void;
  updateUsername: (name: string) => void;
  updateBirthday: (date: Date) => void;
  updateAvatar: (avatar: File) => void;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  function getUser(): User | null {
    return user;
  }

  async function updateGender(newGender: string) {
    if (!user) return;

    const newUser: User = user;
    newUser.gender = newGender;

    const res = await userService.update(newUser);

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) toast.warning(res.message);

    toast.message("Update user gender successfully");

    setUser(newUser);
  }

  async function updateUsername(name: string) {
    if (!user) return;

    const newUser: User = user;
    newUser.name = name;

    const res = await userService.update(newUser);

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) toast.warning(res.message);

    toast.message("Update user name successfully");

    setUser(newUser);
  }

  async function updateBirthday(date: Date) {
    if (!user) return;

    const newUser: User = user;
    newUser.birthday = date;

    const res = await userService.update(newUser);

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) toast.warning(res.message);

    toast.message("Update user name successfully");

    setUser(newUser);
  }

  async function updateAvatar(avatar: File) {}

  useEffect(function () {
    const getUser = async () => {
      const res = await authService.me();

      if (res && res.success) {
        const user = res?.data.user;
        console.log(user);
        setUser(user);
        toast.message("Login with " + user.name);
      } else {
        toast.message("Your session has been expired");
      }
    };

    const rememer = rememberMe.getStatus();
    if (rememer && token.getAccessToken()) {
      getUser();
    }
  }, []);

  return <AuthContext.Provider value={{ user, setUser, getUser, updateGender, updateUsername, updateBirthday, updateAvatar }}>{children}</AuthContext.Provider>;
};

export default function useAuth() {
  const context = useContext(AuthContext);
  return context;
}
