import { vi } from "vitest";

export type MockedRouter = {
  push: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
  refresh: ReturnType<typeof vi.fn>;
  prefetch: ReturnType<typeof vi.fn>;
};

export const createRouter = (): MockedRouter => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
});

let router: MockedRouter = createRouter();
let pathname = "/zh";

export const __setPathname = (value: string) => {
  pathname = value;
};

export const __setRouter = (value: MockedRouter) => {
  router = value;
};

export const __resetNavigationMocks = () => {
  router = createRouter();
  pathname = "/zh";
};

export const useRouter = () => router;
export const usePathname = () => pathname;


