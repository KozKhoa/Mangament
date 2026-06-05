import Link from "@/components/link/Link";
import { routes } from "@/lib/routes";

import BookIcon from "@/public/book.svg";
import FavouriteIcon from "@/public/favourite.svg";
import HistoryIcon from "@/public/history.svg";
import RankingIcon from "@/public/ranking.svg";
import RandomIcon from "@/public/random.svg";

const currentYear = 2026;

const exploreLinks = [
  { label: "Truyện tranh", href: routes.story({ storyType: "manga" }) },
  { label: "Light novel", href: routes.story({ storyType: "light_novel" }) },
  { label: "Xếp hạng", href: routes.ranking() },
  { label: "Thể loại", href: routes.genre() },
];

const readerLinks = [
  { label: "Random truyện", href: "/stories/random" },
  { label: "Truyện yêu thích", href: "/favourites" },
  { label: "Lịch sử đọc", href: routes.history() },
  { label: "Tài khoản", href: "/me" },
];

const genreLinks = [
  { label: "Action", href: routes.genre({ genre: "action" }) },
  { label: "Fantasy", href: routes.genre({ genre: "fantasy" }) },
  { label: "Romance", href: routes.genre({ genre: "romance" }) },
  { label: "Comedy", href: routes.genre({ genre: "comedy" }) },
  { label: "Mystery", href: routes.genre({ genre: "mystery" }) },
  { label: "Slice of life", href: routes.genre({ genre: "slice_of_life" }) },
];

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="w-fit text-foreground/70 transition-colors duration-200 hover:text-foreground">
      {label}
    </Link>
  );
}

function FooterSection({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <nav className="flex flex-col gap-2.5" aria-label={title}>
      <p className="text-sm font-semibold uppercase text-foreground/50">{title}</p>
      <div className="flex flex-col gap-1.5">
        {links.map((link) => (
          <FooterLink key={link.href} href={link.href} label={link.label} />
        ))}
      </div>
    </nav>
  );
}

export default function Footer() {
  return (
    <footer className="mt-16 border-t-2 border-foreground/30 bg-background-items text-foreground">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_2fr]">
          <div className="flex flex-col gap-4">
            <Link href="/" className="w-fit">
              <p className="text-3xl font-holtwood">Mangament</p>
            </Link>

            <p className="max-w-xl text-foreground/70">
              Không gian đọc manga và novel gọn gàng, dễ theo dõi, lưu lịch sử đọc và tìm nhanh những bộ truyện hợp gu.
            </p>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:flex-wrap">
              <Link
                href={routes.story()}
                className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-foreground/25 px-4 py-2 text-center transition-colors duration-200 hover:bg-foreground/10 sm:w-fit"
              >
                <BookIcon className="h-5 w-5 shrink-0" />
                Khám phá
              </Link>

              <Link
                href="/stories/random"
                className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-foreground/25 px-4 py-2 text-center transition-colors duration-200 hover:bg-foreground/10 sm:w-fit"
              >
                <RandomIcon className="h-5 w-5 shrink-0" />
                Đọc ngẫu nhiên
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-7 sm:grid-cols-3">
            <FooterSection title="Khám phá" links={exploreLinks} />
            <FooterSection title="Tủ truyện" links={readerLinks} />
            <FooterSection title="Thể loại nổi bật" links={genreLinks} />
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-foreground/20 pt-5 text-sm text-foreground/60 md:flex-row md:items-center md:justify-between">
          <p>© {currentYear} Mangament. Đọc truyện theo cách của bạn.</p>

          <div className="flex flex-row flex-wrap gap-3">
            <Link href={routes.ranking()} className="flex items-center gap-1.5 transition-colors duration-200 hover:text-foreground">
              <RankingIcon className="h-4 w-4" />
              Xếp hạng
            </Link>
            <Link href="/favourites" className="flex items-center gap-1.5 transition-colors duration-200 hover:text-foreground">
              <FavouriteIcon className="h-4 w-4" />
              Yêu thích
            </Link>
            <Link href={routes.history()} className="flex items-center gap-1.5 transition-colors duration-200 hover:text-foreground">
              <HistoryIcon className="h-4 w-4" />
              Lịch sử
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
