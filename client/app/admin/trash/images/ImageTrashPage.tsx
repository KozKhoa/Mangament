"use client";

import Image from "next/image";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { MouseEvent, useEffect, useMemo, useState } from "react";

import withAdmin from "@/hoc/withAdmin";
import { modal } from "@/components/modal/modal.store";

import XICon from "@/public/x-icon.svg";
import ZoomIcon from "@/public/zooom.svg";
import TrashIcom from "@/public/trash.svg";

import adminService from "@/services/admin";

import * as ImageType from "@/types/image";
import { Pagination } from "@/types/pagination";

import Button from "@/components/buttons/button";
import Loading from "@/components/loadings/loading";
import Checkbox from "@/components/inputs/checkbox";
import SwitchPageBig from "@/components/switch-page/big";
import NumberInput from "@/components/inputs/number-input";
import SwitchPageSmall from "@/components/switch-page/small";
import { loadingBar } from "@/components/loadings/loading-bar/top-loading-bar.store";

export function ImageTrashPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = useMemo(() => Number(searchParams.get("page") ?? 1), [searchParams]);
  const limit = useMemo(() => Number(searchParams.get("limit") ?? 20), [searchParams]);

  const [loading, setLoading] = useState(true);
  const [lastSelected, setLastSelected] = useState<string>("");
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [pagination, setPagination] = useState<Pagination>();
  const [images, setImages] = useState<ImageType.default[]>([]);

  async function fetchImages() {
    const res = await adminService.getTrashImages({ page, limit });
    setLoading(false);

    setImages(res.data ?? []);
    setPagination(res.pagination);
  }

  function handleSetlectedAll() {
    if (selected.size === images.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(images.map((image) => image.id ?? "")));
    }
  }

  async function handleDeleteTrashImage(id: string) {
    if (!id) return;

    setDeleting((prev) => {
      const newSet = new Set(prev);
      newSet.add(id ?? "");
      return newSet;
    });

    const res = await adminService.deleteTrashImage(id);

    setDeleting((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id ?? "");
      return newSet;
    });

    if (!res.success) return toast.warning(res.message);

    setImages((prev) => prev.filter((img) => img.id !== id));

    fetchImages();

    toast.message("Xóa thành công");
  }

  async function handleDeleteManyTrashImages(ids: string[]) {
    if (!ids || ids.length <= 0) return;

    setDeleting((prev) => {
      const newSet = new Set(prev);
      ids.forEach((id) => newSet.add(id));
      return newSet;
    });

    const res = await adminService.deleteManyTrashImages(ids);

    if (!res.success) return toast.warning(res.message);

    setDeleting(new Set());

    setImages((prev) => {
      const removed = new Set(ids);
      return prev.filter((image) => !removed.has(image.id ?? ""));
    });

    fetchImages();

    toast.message("Xóa nhiều ảnh thành công");
  }

  function handleToggleSelectedImage(imageId: string, event: MouseEvent<HTMLButtonElement>) {
    function toggle(id: string) {
      if (selected.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
    }

    const newSet = new Set(selected);

    if (event.shiftKey) {
      let startToToggle = false;
      let isReverseSelected = false;

      const imageArr = [...images];

      for (const image of imageArr) {
        if (image.id === lastSelected) startToToggle = true;

        if (image.id === imageId && startToToggle === false) {
          startToToggle = true;
          isReverseSelected = true;
        }

        if (startToToggle && image.id !== lastSelected) toggle(image.id ?? "");

        if (!isReverseSelected && image.id === imageId) {
          break;
        } else if (isReverseSelected && image.id === lastSelected) {
          break;
        }
      }
    } else {
      toggle(imageId);
    }

    setLastSelected(imageId);
    setSelected(newSet);
  }

  function handleZoomImage(image: ImageType.default) {
    modal.open("custom", {
      content: (
        <div className="min-w-[350px] w-[80vw] h-[90vh] relative flex flex-col gap-1">
          <div className="relative w-full h-full">
            <Image src={[process.env.NEXT_PUBLIC_CDN_URL, image.key].join("/")} className="object-contain m-auto" alt={image.key ?? ""} fill />
          </div>

          <div className="w-full bg-background px-2 rounded-lg text-lg">
            <p>
              <span className="font-semibold">URL: </span> {image.url}
            </p>
            <p>
              <span className="font-semibold">Key: </span> {image.key}
            </p>
          </div>

          <XICon className="w-6 h-6 text-foreground/80 absolute top-0 right-0 cursor-pointer" onClick={modal.close} />

          <TrashIcom
            className="w-6 h-6 text-red-500 stroke-2 absolute top-0 left-0 cursor-pointer"
            onClick={() => {
              modal.close();
              image.id && handleDeleteTrashImage(image.id);
            }}
          />
        </div>
      ),

      onClickOutside: modal.close,
    });
  }

  function handleNavigate(key: string, value: number) {
    loadingBar.open({});
    const params = new URLSearchParams(searchParams.toString());

    params.set("page", "1");

    if (!key) {
      params.delete(key);
    } else {
      params.set(key, value.toString());
    }

    setLoading(true);

    setDeleting(new Set());
    setSelected(new Set());

    router.push(`?${params.toString()}`);
  }

  useEffect(() => {
    fetchImages();

    loadingBar.close();
  }, [searchParams]);

  return (
    <div>
      <div className="flex flex-row flex-wrap my-2">
        <SwitchPageSmall
          className="min-w-[180px]"
          maxPage={pagination?.totalPages ?? 0}
          page={page}
          onChange={(pageIndex) => handleNavigate("page", pageIndex)}
        />

        <div className="mx-2 w-fit">
          <p className="my-1">Page Size</p>
          <NumberInput
            className="bg-background-items"
            allowNegative={false}
            allowNumeric={false}
            value={limit}
            onChange={(value) => handleNavigate("limit", value)}
          />
        </div>

        <div className="flex flex-row flex-wrap gap-2 items-center p-2 ml-auto ">
          {selected.size > 0 && (
            <Button
              isProcessing={deleting.size > 0}
              disable={deleting.size > 0}
              buttonType="delete"
              className="font-semibold"
              onClick={() => handleDeleteManyTrashImages([...selected])}
            >
              Xóa
            </Button>
          )}

          <Button isProcessing={deleting.size > 0} disable={deleting.size > 0} className="font-semibold" onClick={handleSetlectedAll}>
            {selected.size === images.length ? "Hủy chọn tất cả" : "Chọn tất cả"}
          </Button>
        </div>
      </div>

      {loading ? (
        <Loading className="w-full h-64" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {images &&
            images.length > 0 &&
            images.map((image, i) => (
              <button
                key={i}
                disabled={deleting.has(image.id ?? "")}
                className={`border-4 relative rounded-lg overflow-hidden bg-background-items
                ${deleting.has(image.id ?? "") ? "border-red-500 opacity-20" : selected.has(image.id ?? "") ? "border-green-500" : "border-transparent"}
              `}
              >
                <div
                  className="absolute top-0 left-0 z-10 bg-background-items px-1 py-2 rounded-b-full cursor-pointer shadow-lg"
                  onClick={() => handleZoomImage(image)}
                >
                  <ZoomIcon className="w-7 h-7 text-foreground" />
                </div>

                <div
                  className="absolute top-0 right-0 z-10 p-2 bg-background-items px-1 py-2 rounded-b-full cursor-pointer shadow-lg"
                  onClick={(e) => handleToggleSelectedImage(image.id ?? "", e as any)}
                >
                  <Checkbox value={selected.has(image.id ?? "")} />
                </div>

                <Image
                  className={`object-contain ${selected.has(image.id ?? "") ? "opacity-40" : ""}`}
                  onClick={(e) => handleToggleSelectedImage(image.id ?? "", e as any)}
                  src={[process.env.NEXT_PUBLIC_CDN_URL, image.key].join("/") ?? image.url}
                  alt={image.key ?? ""}
                  width={300}
                  height={400}
                  style={{ width: "auto", height: "auto" }}
                />
              </button>
            ))}
        </div>
      )}

      <SwitchPageBig className="m-auto my-5" maxPage={pagination?.totalPages ?? 0} page={page} onChange={(pageIndex) => handleNavigate("page", pageIndex)} />
    </div>
  );
}

export default withAdmin(ImageTrashPage);
