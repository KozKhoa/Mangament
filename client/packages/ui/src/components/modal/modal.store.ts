import { nanoid } from "nanoid";

export type ModalType = "confirm" | "custom";

export type ModalItem = {
  id: string;
  type: ModalType;
  props?: any;
};

type Listener = (modals: ModalItem[]) => void;

let modals: ModalItem[] = [];
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l(modals));
}

export const modal = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  open(type: ModalType, props?: any) {
    modals = [...modals, { id: nanoid(), type, props }];
    emit();
  },

  close() {
    modals = modals.slice(0, -1);
    emit();
  },

  closeAll() {
    modals = [];
    emit();
  },
};
