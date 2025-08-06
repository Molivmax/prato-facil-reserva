
import * as React from "react";
import {
  Toast,
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast";

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000000;

type ToasterToastCustom = ToasterToast & {
  position?: {
    x: number;
    y: number;
  };
  duration?: number;
};

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const toasts: ToasterToastCustom[] = [];

type ToasterStatus = {
  toasts: ToasterToastCustom[];
  dismiss: (toastId?: string) => void;
  toast: (props: Omit<ToasterToastCustom, "id">) => string;
};

const toastStatus: ToasterStatus = {
  toasts,
  dismiss: (toastId?: string) => {
    dispatch({
      type: "DISMISS_TOAST",
      toastId,
    });
  },
  toast: (props) => {
    const id = genId();
    const toast = { id, ...props };
    dispatch({
      type: "ADD_TOAST",
      toast,
    });
    return id;
  },
};

type ActionType =
  | {
      type: "ADD_TOAST";
      toast: ToasterToastCustom;
    }
  | {
      type: "UPDATE_TOAST";
      toast: Partial<ToasterToastCustom>;
      toastId: string;
    }
  | {
      type: "DISMISS_TOAST";
      toastId?: string;
    }
  | {
      type: "REMOVE_TOAST";
      toastId?: string;
    };

interface State {
  toasts: ToasterToastCustom[];
}

const reducer = (state: State, action: ActionType): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      if (toastId) {
        return {
          ...state,
          toasts: state.toasts.map((t) =>
            t.id === toastId
              ? {
                  ...t,
                  open: false,
                }
              : t
          ),
        };
      }

      return {
        ...state,
        toasts: state.toasts.map((t) => ({
          ...t,
          open: false,
        })),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state;
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: ActionType) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });

  if (action.type === "ADD_TOAST") {
    const { duration = 5000, id } = action.toast;
    
    setTimeout(() => {
      dispatch({
        type: "DISMISS_TOAST",
        toastId: id,
      });

      setTimeout(() => {
        dispatch({
          type: "REMOVE_TOAST",
          toastId: id,
        });
      }, TOAST_REMOVE_DELAY);
    }, duration);
  }
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    ...toastStatus,
  };
}

export const toast = toastStatus.toast;
