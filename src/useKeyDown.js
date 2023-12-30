import { useEffect } from "react";

export function useKeyDown(key, action) {
  useEffect(
    function () {
      function callback(e) {
        if (e.code === key) action();
      }
      document.addEventListener("keydown", callback);
      return () => document.addEventListener("keydown", callback);
    },
    [key, action]
  );
}
