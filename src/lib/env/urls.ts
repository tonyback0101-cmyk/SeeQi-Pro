const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

function resolveUrl(possible: Array<string | undefined>, envKeys: string[]): string {
  const url = possible.find((candidate) => typeof candidate === "string" && candidate.length > 0);
  if (!url) {
    throw new Error(
      `[env] Missing application URL. Please configure one of: ${envKeys.join(
        ", "
      )}. Production must set NEXT_PUBLIC_APP_URL or NEXTAUTH_URL (https://www.seeqicloud.com).`
    );
  }
  return stripTrailingSlash(url);
}

/**
 * 对外（浏览器、邮件、回调）可见的应用 URL
 * 优先顺序：
 * 1. NEXT_PUBLIC_APP_URL
 * 2. NEXTAUTH_URL
 * 3. NEXTAUTH_URL_INTERNAL
 */
export function getPublicAppUrl(): string {
  return resolveUrl(
    [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXTAUTH_URL, process.env.NEXTAUTH_URL_INTERNAL],
    ["NEXT_PUBLIC_APP_URL", "NEXTAUTH_URL", "NEXTAUTH_URL_INTERNAL"]
  );
}

/**
 * NextAuth 对外暴露的绝对 URL
 */
export function getNextAuthUrl(): string {
  return resolveUrl(
    [process.env.NEXTAUTH_URL, process.env.NEXTAUTH_URL_INTERNAL, process.env.NEXT_PUBLIC_APP_URL],
    ["NEXTAUTH_URL", "NEXTAUTH_URL_INTERNAL", "NEXT_PUBLIC_APP_URL"]
  );
}

/**
 * 服务端内部访问（Server-to-Server）使用的 URL
 */
export function getInternalAppUrl(): string {
  return resolveUrl(
    [process.env.NEXTAUTH_URL_INTERNAL, process.env.NEXTAUTH_URL, process.env.NEXT_PUBLIC_APP_URL],
    ["NEXTAUTH_URL_INTERNAL", "NEXTAUTH_URL", "NEXT_PUBLIC_APP_URL"]
  );
}

export function buildPublicAppUrl(path = ""): string {
  const base = getPublicAppUrl();
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

