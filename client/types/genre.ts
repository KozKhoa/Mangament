import Image from "./image";

export default interface Genre {
  id: string;
  name: string;
  description: string;

  thumbnail_id?: string;
  thumbnail?: Image;

  [key: string]: unknown;
}
