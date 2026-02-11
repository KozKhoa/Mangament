import Image from "next/image";
import React from "react";

export interface ImgProps {
  className?: string;
  src: string;
  alt?: string;
}

const Img = React.forwardRef(({ className, alt, src }: ImgProps) => {
  return (
    <div className={`${className}`}>
      <Image src={src} alt={alt ?? ""} width={10000} height={10000} style={{ width: "100%", height: "auto" }}></Image>
    </div>
  );
});

export default Img;
