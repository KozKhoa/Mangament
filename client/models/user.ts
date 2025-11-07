import Image from "./image";

export default interface User {
  id: string;
  name: string;
  email: string;
  gender: string;
  joinDate: string;
  role: "admin" | "user";
  avatar: Image;
  birthday?: string;
}
