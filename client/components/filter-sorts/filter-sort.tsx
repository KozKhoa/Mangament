import { useEffect, useRef, useState } from "react";

import ButtonDropdownCheckbox from "../buttons/dropdown/btn-dropdown-checkbox";
import ButtonDropdownRadio from "../buttons/dropdown/btn-drop-down-radio";

import StarIcon from "@/public/star.svg";
import LayerIcon from "@/public/layer.svg";
import SortIcon from "@/public/sort.svg";
import PeopleIcon from "@/public/people/people.svg";
import EyeIcon from "@/public/eye/open.svg";
import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";

import ButtonDropdown from "../buttons/dropdown/btn-dropdown";
import { convertJsonToParam } from "@/utils/convert";
import { snakeCaseToCapitalizeWord } from "@/utils/string";
import authorService from "@/services/author";
import { del, label, pre } from "framer-motion/client";
import genreService from "@/services/genre";
import { toast } from "sonner";

interface OptionItem {
  label: string;
  code: string;
  checked: boolean;
}

interface OptionsState {
  rating: OptionItem[];
  sort: OptionItem[];
  view: OptionItem[];
  author: OptionItem[];
  genre: OptionItem[];
}

interface FilterSortProps {
  onChange?: (params: {}) => void;
  className?: string;
}

export default function FilterSort({ onChange, className }: FilterSortProps) {
  const [render, setRender] = useState(false);
  const [filter, setFilter] = useState({});
  const [sort, setSort] = useState({ sort: "created_at:desc" });
  const [options, setOption] = useState<OptionsState>({
    rating: [
      {
        label: "Trên 4 sao",
        code: "4-6",
        checked: false,
      },
      {
        label: "Từ 3 đến 4 sao",
        code: "3-4",
        checked: false,
      },
      {
        label: "Từ 2 đến 3 sao",
        code: "2-3",
        checked: false,
      },
      {
        label: "Từ 1 đến 2 sao",
        code: "1-2",
        checked: false,
      },
      {
        label: "Dưới 1 sao",
        code: "0-1",
        checked: false,
      },
    ],
    sort: [
      {
        label: "Mới nhất",
        code: "created_at:desc",
        checked: true,
      },
      {
        label: "Cũ nhất",
        code: "created_at:asc",
        checked: false,
      },
      {
        label: "View tăng dần",
        code: "view:asc",
        checked: false,
      },
      {
        label: "View giảm dần",
        code: "view:desc",
        checked: false,
      },
      {
        label: "Số sao tăng dần",
        code: "star:asc",
        checked: false,
      },
      {
        label: "Số sao giảm dần",
        code: "star:desc",
        checked: false,
      },
    ],
    view: [
      {
        label: "Trên 1 triệu view",
        code: "1000000-2147483647",
        checked: false,
      },
      {
        label: "Từ 500.000 đến 1 triệu view",
        code: "500000-1000000",
        checked: false,
      },

      {
        label: "Từ 100.000 đến 500.000 view",
        code: "100000-500000",
        checked: false,
      },
      {
        label: "Từ 50.000 đến 100.000 view",
        code: "50000-100000",
        checked: false,
      },
      {
        label: "Từ 10.000 đến 50.000 view",
        code: "10000-50000",
        checked: false,
      },
      {
        label: "Từ 1.000 đến 10.000 view",
        code: "1000-10000",
        checked: false,
      },
      {
        label: "Dưới 1.000 view",
        code: "0-1000",
        checked: false,
      },
    ],
    author: [],
    genre: [],
  });

  // This is use to get data like author name, genre from server
  useEffect(() => {
    const updateAuthor = async () => {
      const res = await authorService.get();
      if (res.success) {
        const authors = res.data.map((author: { id: string; name: string }) => {
          const { id, name, ...newAuthor } = {
            ...author,
            ...{
              label: author.name,
              checked: false,
              code: author.id,
            },
          };

          return newAuthor;
        });
        setOption((prev) => {
          return {
            ...prev,
            ...{ author: authors },
          };
        });
        return authors;
      } else {
        toast.warning(res.message);
      }
    };

    const udpateGenre = async () => {
      const res = await genreService.get();
      const genres = res.data.map((genre: string) => {
        return {
          label: snakeCaseToCapitalizeWord(genre),
          code: genre,
          checked: false,
        };
      });

      setOption((prev) => {
        return {
          ...prev,
          ...{ genre: genres },
        };
      });
      return genres;
    };

    updateAuthor();
    udpateGenre();
  }, []);

  const handleFilter = (
    field: string,
    value: { label: string; code?: string; checked: boolean }[]
  ) => {
    let temp: string[] = [];
    value.forEach((v, i) => {
      if (v.checked) {
        // temp = temp + v.code + ",";
        temp.push(v.code || "");
      }
    });

    setFilter((prev) => {
      return {
        ...prev,
        ...{
          [field]: temp,
        },
      };
    });
  };

  const handleSort = (
    value: {
      label: string;
      code?: string;
      checked: boolean;
    }[]
  ) => {
    value.forEach((v, i) => {
      if (v.checked) {
        setSort({ sort: v.code || "" });
        return;
      }
    });
  };

  // Auto call onChange when filter or sort are updated
  useEffect(() => {
    const params = {
      ...filter,
      ...sort,
    };
    onChange?.(params);
  }, [filter, sort]);

  const displayOptionChecked = (options: OptionItem[]) => {
    let result = "";
    options.forEach((op, i) => {
      if (op.checked) {
        let temp = "";
        if (result === "") result = result + ": ";
        else temp = ", " + temp;

        temp = temp + op.label;

        result = result + temp;
      }
    });

    return result;
  };

  return (
    <div className={`flex flex-row flex-wrap gap-2 ${className}`}>
      {/* Sort */}
      <ButtonDropdownRadio
        label={
          <div className="flex flex-row flex-wrap gap-1.5 justify-center items-center w-fit h-fit">
            <SortIcon className="w-5 h-5 text-foreground "></SortIcon>
            <p className=" font-bold">Sắp xếp</p>
            <div>{displayOptionChecked(options.sort)}</div>
          </div>
        }
        name="filter-sort-sort"
        onFinishCheck={(checked) => handleSort(checked)}
        options={options.sort}
      ></ButtonDropdownRadio>

      {/* Rating */}
      <ButtonDropdownCheckbox
        label={
          <>
            <div className="flex flex-row flex-wrap gap-1.5 justify-center items-center w-fit h-fit">
              <StarIcon className="w-5 h-5 stroke-foreground text-transparent"></StarIcon>
              <p className="font-bold">Đánh giá</p>
              <div>{displayOptionChecked(options.rating)}</div>
            </div>
          </>
        }
        name="fiter-sort-rating"
        options={options.rating}
        onFinishCheck={(checked) => handleFilter("star", checked)}
      ></ButtonDropdownCheckbox>

      {/* Genre */}
      {options.genre.length > 0 && (
        <ButtonDropdownCheckbox
          label={
            <div className="flex flex-row flex-wrap gap-1.5 justify-center items-center w-fit h-fit">
              <LayerIcon className="w-5 h-5 text-foreground"></LayerIcon>
              <p className="font-bold">Thể loại</p>
              <div>{displayOptionChecked(options.genre)}</div>
            </div>
          }
          name="filter-sort-genre"
          options={options.genre}
          onFinishCheck={(checked) => handleFilter("genre", checked)}
        ></ButtonDropdownCheckbox>
      )}
      {/* Author */}
      {options.author.length > 0 && (
        <ButtonDropdownCheckbox
          label={
            <div className="flex flex-row flex-wrap gap-1.5 justify-center items-center w-fit h-fit">
              <PeopleIcon className="w-5 h-5 text-foreground stroke-0"></PeopleIcon>
              <p className="font-bold">Tác giả</p>
              <div>{displayOptionChecked(options.author)}</div>
            </div>
          }
          options={options.author}
          name="filter-sort-author"
          onFinishCheck={(checked) => handleFilter("author", checked)}
        ></ButtonDropdownCheckbox>
      )}

      {/* View */}
      <ButtonDropdownCheckbox
        label={
          <div className="flex flex-row flex-wrap gap-1.5 justify-center items-center w-fit h-fit">
            <EyeIcon className="w-5 h-5 text-foreground"></EyeIcon>
            <p className="font-bold">View</p>
            <div>{displayOptionChecked(options.view)}</div>
          </div>
        }
        options={options.view}
        onFinishCheck={(checked) => handleFilter("view", checked)}
        name="filter-sort-view"
      ></ButtonDropdownCheckbox>
    </div>
  );
}

// <ButtonDropdown
//         className="border border-foreground rounded-[5]"
//         icon={
//           <div
//             className={`flex flex-row relative justify-start items-center gap-1.5 cursor-pointer w-fit
//         font-afacad text-foreground bg-background px-2
//         `}
//           >
//             <div className="flex flex-row gap-1.5 justify-center items-center w-fit h-fit">
//               <SortIcon className="w-5 h-5 text-foreground"></SortIcon>
//               <p>Sắp xếp</p>
//             </div>
//             <div className="w-[1em] h-[1em]">
//               <SharpTriangleDownIcon className="w-[1em] h-[1em] text-foreground" />
//             </div>
//           </div>
//         }
//         showCloseButton={true}
//         closeButtonLabel="Finish"
//       >

//       </ButtonDropdown>
