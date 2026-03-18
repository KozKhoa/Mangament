export type LoadingBarItem = {
  speed?: number;
  delay?: number;
  label?: string;
  color?: string;
  height?: number;

  props?: any;
};

type Listener = (modals: LoadingBarItem | null) => void;

let loading: LoadingBarItem | null = null;

const listeners = new Set<Listener>();

let timeout: NodeJS.Timeout;

function emit() {
  listeners.forEach((l) => l(loading));
}

export const loadingBar = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  open({ label, color, height, speed = 15, delay = 120, ...props }: { label?: string; color?: string; height?: number; speed?: number; delay?: number }) {
    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      loading = { label, color, height, speed, props };
      emit();
    }, delay);
  },

  close() {
    if (timeout) {
      timeout && clearTimeout(timeout);
      timeout = undefined as any;
    }
    loading = null;
    emit();
  },
};
