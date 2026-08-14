import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/** Returns false during SSR and the first client render, true after hydration. */
export function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
