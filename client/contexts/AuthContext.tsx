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

import { signOut } from "next-auth/react";

interface AuthContextProps {
  user: User | null;
  loading: boolean;

  setUser: (user: User) => void;

  updateGender: (newGender: string) => Promise<string | number | void>;
  updateUsername: (name: string) => Promise<string | number | void>;
  updateBirthday: (date: Date) => Promise<string | number | void>;
  updateAvatar: (avatar: File) => Promise<string | number | void>;

  login: (email: string, password: string) => Promise<string | number | void>;
  loginWithGoogle: (idToken: string) => Promise<string | number | void>;
  register: (name: string, email: string, password: string) => Promise<string | number | void>;

  changePassword: (oldPassword: string, newPassword: string) => Promise<string | number | void>;
  logout: () => Promise<string | number | void>;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  async function updateGender(newGender: string) {
    if (!user) return;

    const newUser: User = { ...user };
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

    const newUser: User = { ...user };
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
    } else {
      setUser(null);
      token.removeAccessToken();
    }

    setLoading(false);
  }

  async function login(email: string, password: string): Promise<string | number | void> {
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

  async function loginWithGoogle(idToken: string): Promise<string | number | void> {
    setLoading(true);
    const res = await authService.loginWithGoogle(idToken);
    setLoading(false);

    if (!res.success) return toast.warning(res.message);

    console.log(res);

    const user = res.data?.user;
    const accessToken = res.data?.accessToken;

    if (user && accessToken) {
      setUser(user);
      token.setAccessToken(accessToken);

      toast.message(res.message);

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
    rememberMe.turnOff();
    await signOut();

    toast.message("Đã đăng xuất thành công");

    router.refresh();
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    if (!user) return;

    const res = await authService.changePassword(oldPassword, newPassword);

    if (!res.success) return toast.warning(res.message);

    router.replace("/login");

    toast.message("Đổi mật khẩu thành công!");

    setUser(null);
    token.removeAccessToken();
  }

  useEffect(function () {
    console.log("Xin chào");
    const rememer = rememberMe.getStatus();
    if (rememer && token.getAccessToken()) {
      me();
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        setUser,
        updateGender,
        updateUsername,
        updateBirthday,
        updateAvatar,
        login,
        loginWithGoogle,
        register,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default function useAuth() {
  const context = useContext(AuthContext);
  return context;
}
