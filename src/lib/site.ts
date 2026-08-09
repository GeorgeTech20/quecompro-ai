const LOCAL_SITE_URL = "http://localhost:3999";

function resolveSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL;

  try {
    return new URL(configured ?? LOCAL_SITE_URL);
  } catch {
    return new URL(LOCAL_SITE_URL);
  }
}

export const SITE_URL = resolveSiteUrl();
export const SITE_NAME = "QuéComproo";

export function absoluteUrl(pathname = "/"): string {
  return new URL(pathname, SITE_URL).toString();
}
