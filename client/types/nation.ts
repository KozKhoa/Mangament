import Image from "./image";

export default interface Nation {
  name: string;
  flag_icon?: string;
  flag_image?: Image;

  [key: string]: any;
}
