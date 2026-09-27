// app/fonts.ts
import localFont from "next/font/local";

export const Holtwood_One_SC = localFont({
  src: [{ path: "../public/fonts/Holtwood_One_SC/HoltwoodOneSC-Regular.ttf", weight: "400", style: "normal" }],
  variable: "--font-holtwood",
});

export const Afacad = localFont({
  src: [
    { path: "../public/fonts/Afacad/static/Afacad-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/Afacad/static/Afacad-Italic.ttf", weight: "400", style: "italic" },

    { path: "../public/fonts/Afacad/static/Afacad-Medium.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/Afacad/static/Afacad-MediumItalic.ttf", weight: "500", style: "italic" },

    { path: "../public/fonts/Afacad/static/Afacad-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/Afacad/static/Afacad-SemiBoldItalic.ttf", weight: "600", style: "italic" },

    { path: "../public/fonts/Afacad/static/Afacad-Bold.ttf", weight: "700", style: "normal" },
    { path: "../public/fonts/Afacad/static/Afacad-BoldItalic.ttf", weight: "700", style: "italic" },
  ],
  variable: "--font-afacad",
});

export const Geist_Mono = localFont({
  src: [
    { path: "../public/fonts/Geist_Mono/static/GeistMono-Thin.ttf", weight: "100", style: "normal" },
    { path: "../public/fonts/Geist_Mono/static/GeistMono-ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "../public/fonts/Geist_Mono/static/GeistMono-Light.ttf", weight: "300", style: "normal" },
    { path: "../public/fonts/Geist_Mono/static/GeistMono-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/Geist_Mono/static/GeistMono-Medium.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/Geist_Mono/static/GeistMono-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/Geist_Mono/static/GeistMono-Bold.ttf", weight: "700", style: "normal" },
    { path: "../public/fonts/Geist_Mono/static/GeistMono-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "../public/fonts/Geist_Mono/static/GeistMono-Black.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-geist-mono",
});

export const Geist = localFont({
  src: [
    { path: "../public/fonts/Geist/static/Geist-Thin.ttf", weight: "100", style: "normal" },
    { path: "../public/fonts/Geist/static/Geist-ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "../public/fonts/Geist/static/Geist-Light.ttf", weight: "300", style: "normal" },
    { path: "../public/fonts/Geist/static/Geist-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/Geist/static/Geist-Medium.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/Geist/static/Geist-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/Geist/static/Geist-Bold.ttf", weight: "700", style: "normal" },
    { path: "../public/fonts/Geist/static/Geist-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "../public/fonts/Geist/static/Geist-Black.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-geist",
});

export const Roboto = localFont({
  src: [
    { path: "../public/fonts/Roboto/static/Roboto-Thin.ttf", weight: "100", style: "normal" },
    { path: "../public/fonts/Roboto/static/Roboto-ThinItalic.ttf", weight: "100", style: "italic" },

    { path: "../public/fonts/Roboto/static/Roboto-ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "../public/fonts/Roboto/static/Roboto-ExtraLightItalic.ttf", weight: "200", style: "italic" },

    { path: "../public/fonts/Roboto/static/Roboto-Light.ttf", weight: "300", style: "normal" },
    { path: "../public/fonts/Roboto/static/Roboto-LightItalic.ttf", weight: "300", style: "italic" },

    { path: "../public/fonts/Roboto/static/Roboto-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/Roboto/static/Roboto-Italic.ttf", weight: "400", style: "italic" },

    { path: "../public/fonts/Roboto/static/Roboto-Medium.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/Roboto/static/Roboto-MediumItalic.ttf", weight: "500", style: "italic" },

    { path: "../public/fonts/Roboto/static/Roboto-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/Roboto/static/Roboto-SemiBoldItalic.ttf", weight: "600", style: "italic" },

    { path: "../public/fonts/Roboto/static/Roboto-Bold.ttf", weight: "700", style: "normal" },
    { path: "../public/fonts/Roboto/static/Roboto-BoldItalic.ttf", weight: "700", style: "italic" },

    { path: "../public/fonts/Roboto/static/Roboto-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "../public/fonts/Roboto/static/Roboto-ExtraBoldItalic.ttf", weight: "800", style: "italic" },

    { path: "../public/fonts/Roboto/static/Roboto-Black.ttf", weight: "900", style: "normal" },
    { path: "../public/fonts/Roboto/static/Roboto-BlackItalic.ttf", weight: "900", style: "italic" },
  ],
  variable: "--font-roboto",
});

export const Aclonica = localFont({
  src: [{ path: "../public/fonts/Aclonica/Aclonica-Regular.ttf", weight: "400", style: "normal" }],
  variable: "--font-aclonica",
});
