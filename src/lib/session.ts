const SESSION_KEY = "oolshikAdmin.isLoggedIn";

function storage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export const session = {
  isLoggedIn(): boolean {
    return storage()?.getItem(SESSION_KEY) === "true";
  },
  login() {
    storage()?.setItem(SESSION_KEY, "true");
  },
  clear() {
    storage()?.removeItem(SESSION_KEY);
  },
};
