"use client";

import { createContext, use, useContext, useEffect, useState } from "react";
import * as rememberMe from "@/lib/remember-me";
import authService from "@/services/auth";
import { toast } from "sonner";
import * as token from "@/lib/token";
import User from "@/types/user";
import userService from "@/services/user";
import { validateEmailFormat, validatePasswordFormat } from "@/lib/validation";
import { useRouter } from "next/navigation";
import { s } from "framer-motion/client";

interface AuthContextProps {
  user: User | null;
  loading: boolean;

  setUser: (user: User) => void;

  updateGender: (newGender: string) => Promise<any>;
  updateUsername: (name: string) => Promise<any>;
  updateBirthday: (date: Date) => Promise<any>;
  updateAvatar: (avatar: File) => Promise<any>;

  login: (email: string, password: string) => Promise<any>;
  register: (name: string, email: string, password: string) => Promise<any>;
  logout: () => Promise<any>;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  async function updateGender(newGender: string) {
    if (!user) return;

    const newUser: User = user;
    newUser.gender = newGender;

    setLoading(true);
    const res = await userService.updateUser(newUser);
    setLoading(false);

    if (!res.success) toast.warning(res.message);

    toast.message("Update user gender successfully");

    setUser(newUser);
  }

  async function updateUsername(name: string) {
    if (!user) return;

    const newUser: User = user;
    newUser.name = name;

    setLoading(true);
    const res = await userService.updateUser(newUser);
    setLoading(false);

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) toast.warning(res.message);

    toast.message("Update user name successfully");

    setUser(newUser);
  }

  async function updateBirthday(date: Date) {
    if (!user) return;

    const newUser: User = user;
    newUser.birthday = date;

    setLoading(true);
    const res = await userService.updateUser(newUser);
    setLoading(false);

    if (!res.success) toast.warning(res.message);

    toast.message("Update user name successfully");

    setUser(newUser);
  }

  async function updateAvatar(avatarFile: File) {
    if (!user) return;

    const newUser: User = { ...user, avatar: { file: avatarFile, url: undefined } };

    setLoading(true);
    const res = await userService.updateUser(newUser);
    setLoading(false);

    newUser.avatar = {
      url: res.data?.avatar?.key ? [process.env.NEXT_PUBLIC_CDN_URL, res.data?.avatar?.key].join("/") : res.data?.avatar?.url,
      key: res.data?.avatar?.key,
    };

    setUser(newUser);

    if (!res.success) toast.warning(res.message);

    toast.message("Cập nhật avatar thành công");
  }

  async function me() {
    setLoading(true);
    const res = await authService.me();

    const user = res.data;
    if (user) {
      setUser(user);
    }
    setLoading(false);
  }

  async function login(email: string, password: string): Promise<any> {
    if (!validateEmailFormat(email)) return toast.error("Invalid Email");
    if (!validatePasswordFormat(password)) return toast.error("Password must have at least six character");

    setLoading(true);
    const res = await authService.login(email, password);
    setLoading(false);

    if (!res.success) return toast.warning(res.message);

    const user = res.data?.user;
    const accessToken = res.data?.accessToken;

    if (user && accessToken) {
      setUser(user); // Save user
      token.setAccessToken(accessToken); // Save access token

      toast.message(res.message);

      // navigate to home page
      router.replace("/");
    }
  }

  async function register(name: string, email: string, password: string) {
    if (!validateEmailFormat(email)) return toast.error("Invalid Email");
    if (!validatePasswordFormat(password)) return toast.error("Password must have at least six character");

    setLoading(true);
    const res = await authService.register(name, email, password);
    setLoading(false);

    if (!res.success) return toast.warning(res.message);

    const user = res.data?.user;
    const accessToken = res.data?.accessToken;

    if (user && accessToken) {
      setUser(user);
      token.setAccessToken(accessToken);

      toast.message("Đăng ký thành công!");

      // navigate to home page
      router.replace("/");
    }
  }

  async function logout() {
    authService.logout();
    setUser(null);
    token.removeAccessToken();
    router.refresh();
  }

  useEffect(function () {
    console.log("Xin chào");
    const rememer = rememberMe.getStatus();
    if (rememer && token.getAccessToken()) {
      me();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, updateGender, updateUsername, updateBirthday, updateAvatar, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default function useAuth() {
  const context = useContext(AuthContext);
  return context;
}
