import axios from "axios";

export const PRIMARY_URL = import.meta.env.VITE_API_URL || "https://pedroaruana-hiremind-api.hf.space";
export const FALLBACK_URL = "https://hiremind-ai-tw8s.onrender.com";

let activeUrl = PRIMARY_URL;

function isServerDown(err) {
  return !err.response || err.response.status >= 500;
}

export async function apiRequest(config) {
  const timeout = config.timeout || 15000;
  try {
    return await axios({ ...config, url: `${activeUrl}${config.url}`, timeout });
  } catch (err) {
    if (isServerDown(err) && activeUrl === PRIMARY_URL) {
      activeUrl = FALLBACK_URL;
      return await axios({ ...config, url: `${activeUrl}${config.url}`, timeout });
    }
    throw err;
  }
}

export function getActiveUrl() {
  return activeUrl;
}

export function prewarm() {
  fetch(`${PRIMARY_URL}/`, { signal: AbortSignal.timeout(6000) }).catch(() => {
    fetch(`${FALLBACK_URL}/`, { signal: AbortSignal.timeout(15000) }).catch(() => {});
  });
}
