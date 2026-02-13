import { getConfig } from "@app/config";

/**
 * kong:8000을 ngrok host로 치환
 * URL이 없거나 NGROK_URL 환경변수가 없으면 원본 반환
 *
 * @param url - 치환할 URL
 * @returns ngrok host로 치환된 URL 또는 원본 URL
 */
export function replaceKongWithNgrok(url: string): string;
export function replaceKongWithNgrok(url: null): null;
export function replaceKongWithNgrok(url: string | null): string | null;
export function replaceKongWithNgrok(url: string | null): string | null {
  if (!url) {
    return null;
  }

  const ngrokUrl = getConfig().dev.NGROK_URL;

  if (!ngrokUrl) {
    return url;
  }

  const ngrokHost = new URL(ngrokUrl).host;
  return url.replace("kong:8000", ngrokHost);
}
