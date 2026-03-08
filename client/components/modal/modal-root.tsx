"use client";

import { useEffect, useState } from "react";
import { modal, ModalItem } from "./modal.store";
import Modal from "./ui/modal";
import { AnimatePresence, motion } from "framer-motion";
import ConfirmModal from "./ui/confirm-modal";

export function ModalRoot() {
  const [stack, setStack] = useState<ModalItem[]>([]);

  useEffect(() => modal.subscribe(setStack), []);

  useEffect(() => {
    if (stack.length === 0) return;

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") modal.close();
    };

    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [stack.length]);

  if (stack.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1, ease: "linear" }}>
        {stack.map((m, index) => (
          <Modal key={m.id} zIndex={50 + index} onClose={modal.close}>
            {m.type === "confirm" && (
              <ConfirmModal
                title={m.props?.title ?? ""}
                onCancel={async () => {
                  await m.props?.onCancel?.();
                }}
                onConfirm={async () => {
                  await m.props?.onConfirm?.();
                }}
              >
                {m.props?.content}
              </ConfirmModal>
            )}

            {m.type === "custom" && <div>{m.props?.content}</div>}
          </Modal>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
