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
    if (stack.length === 0) {
      document.body.style.overflow = "";
      return;
    }

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") modal.close();
    };

    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onEsc);
    };
  }, [stack.length]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <AnimatePresence>
      {stack.map((m, index) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="fixed inset-0 pointer-events-auto"
          style={{ zIndex: 50 + index }}
        >
          <Modal onClickOutside={m.props?.onClickOutside}>
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
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
