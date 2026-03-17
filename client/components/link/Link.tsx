"use client";

import NextJSLink, { LinkProps as NextJSLinkProps } from "next/link";
import { loadingBar } from "../loadings/loading-bar/top-loading-bar.store";
import { usePathname } from "next/navigation";

type LinkProps = NextJSLinkProps & {
  children: React.ReactNode;
  className?: string;

  [key: string]: any;
};

export default function Link({ children, ...props }: LinkProps) {
  const pathName = usePathname();

  return (
    <NextJSLink
      {...props}
      onClick={() => {
        if (pathName === props.href) {
          return;
        }
        loadingBar.open({});
      }}
    >
      {children}
    </NextJSLink>
  );
}
