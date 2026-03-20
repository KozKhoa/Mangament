import Image from "./image";
import Nation from "./nation";

export default interface Author {
  id?: string;
  name?: string;
  avatar?: Image;
  nation?: Nation;
}
