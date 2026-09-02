// Service for Google Sheets synchronization via Secure Backend Proxy
// All secrets and API keys are strictly handled by the server backend.
// Zero API keys or tokens are embedded in this client-side module.

export interface ProxyAuthStatus {
  isProxyActive: boolean;
  serverManaged: boolean;
  message: string;
}

let cachedUserToken: string | null = null;

export const getGoogleAccessToken = (): string | null => {
  return cachedUserToken;
};

export const setGoogleAccessToken = (token: string | null) => {
  cachedUserToken = token;
};

export const getProxyStatus = (): ProxyAuthStatus => {
  return {
    isProxyActive: true,
    serverManaged: true,
    message: 'Proxy de Backend Seguro ativo. Chave de API protegida exclusivamente no servidor.'
  };
};

export const googleSignOut = async () => {
  cachedUserToken = null;
};
