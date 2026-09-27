import Image from "./image";

export default interface User {
  id: string;
  name: string;
  email: string;
  gender?: string;
  join_date?: Date;
  is_banned?: boolean;
  role: "admin" | "user";
  avatar?: Image;
  birthday?: Date;
}
