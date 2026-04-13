/** İstemci — yalnızca NEXT_PUBLIC_* bundle’a girer */
export const env = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_PATH ?? "/",
  apiBaseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "",
} as const;
