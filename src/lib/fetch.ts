/**
 * 统一的 fetch 工具函数
 * 自动添加 credentials: 'include' 以确保认证 cookies 被发送
 */

type FetchOptions = RequestInit & {
  credentials?: RequestCredentials;
};

/**
 * 带认证的 fetch 封装
 * 自动添加 credentials: 'include' 以确保 NextAuth session cookie 被发送
 */
export async function authenticatedFetch(
  url: string | URL,
  options: FetchOptions = {}
): Promise<Response> {
  const fetchOptions: FetchOptions = {
    ...options,
    credentials: options.credentials ?? "include",
  };

  return fetch(url, fetchOptions);
}

/**
 * 带认证的 JSON fetch 封装
 */
export async function authenticatedFetchJson<T = unknown>(
  url: string | URL,
  options: FetchOptions = {}
): Promise<T> {
  const response = await authenticatedFetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(errorText);
  }

  return response.json();
}


