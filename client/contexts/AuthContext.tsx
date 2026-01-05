"use client";

import { createContext, useContext, useEffect, useState } from "react";
import * as rememberMe from "@/lib/remember-me";
import authService from "@/services/auth";
import { toast } from "sonner";
import * as token from "@/lib/token";
import User from "@/types/user";
import userService from "@/services/user";
import { validateEmailFormat, validatePasswordFormat } from "@/lib/validation";
import { useRouter } from "next/navigation";

interface AuthContextProps {
  user: User | null;
  setUser: (user: User) => void;
  getUser: () => User | null;

  updateGender: (newGender: string) => void;
  updateUsername: (name: string) => void;
  updateBirthday: (date: Date) => void;
  updateAvatar: (avatar: File) => void;

  login: (email: string, password: string) => void;
  register: (name: string, email: string, password: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
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

  async function login(email: string, password: string) {
    if (!validateEmailFormat(email)) return toast.error("Invalid Email");
    if (!validatePasswordFormat(password)) return toast.error("Password must have at least six character");

    const login = await authService.login(email, password);

    if (!login) return toast.warning("Cannot connect with server");
    if (!login.success) return toast.warning(login.message);

    // save user info to auth context
    setUser(login?.data?.user);

    // save access token
    token.setAccessToken(login?.data?.token);

    toast.message(login?.message);

    // navigate to home page
    router.replace("/");
  }

  async function register(name: string, email: string, password: string) {
    if (!validateEmailFormat(email)) return toast.error("Invalid Email");
    if (!validatePasswordFormat(password)) return toast.error("Password must have at least six character");

    const register = await authService.register(name, email, password);

    if (register && register.success) {
      // save user info to auth context
      setUser(register.data.user);

      // save access token
      token.setAccessToken(register.data.token);

      toast.message(register.message);

      // navigate to home page
      router.replace("/");
    }
  }

  async function logout() {
    authService.logout();
    setUser(null);
    token.removeAccessToken();
    router.replace("/");
  }

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

  return (
    <AuthContext.Provider value={{ user, setUser, getUser, updateGender, updateUsername, updateBirthday, updateAvatar, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default function useAuth() {
  const context = useContext(AuthContext);
  return context;
}
