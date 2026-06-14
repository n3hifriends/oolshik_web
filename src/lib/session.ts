const ACCESS_TOKEN_KEY = "oolshikAdmin.accessToken";
const REFRESH_TOKEN_KEY = "oolshikAdmin.refreshToken";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function storage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export const session = {
  hasTokens(): boolean {
    return Boolean(this.getAccessToken() && this.getRefreshToken());
  },
  getAccessToken(): string | null {
    return storage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
  },
  getRefreshToken(): string | null {
    return storage()?.getItem(REFRESH_TOKEN_KEY) ?? null;
  },
  setTokens(tokens: TokenPair) {
    const s = storage();
    if (!s) return;
    s.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    s.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  },
  setAccessToken(accessToken: string) {
    storage()?.setItem(ACCESS_TOKEN_KEY, accessToken);
  },
  clear() {
    const s = storage();
    if (!s) return;
    s.removeItem(ACCESS_TOKEN_KEY);
    s.removeItem(REFRESH_TOKEN_KEY);
  },
};
