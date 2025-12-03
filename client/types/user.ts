import Image from "./image";

export default interface User {
  id: string;
  name: string;
  email: string;
  gender?: string;
  join_date?: string;
  role: "admin" | "user";
  avatar?: Image;
  birthday?: Date;
}
