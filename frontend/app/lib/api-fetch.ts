/**
 * Cap how long we wait on the backend during static generation. Next.js kills
 * workers after ~60s per page; an unreachable or retrying API (e.g. Firestore)
 * can otherwise hang the whole build.
 */
export const PUBLIC_API_FETCH_TIMEOUT_MS = 20_000;

export function publicApiFetch(
  input: string | URL,
  init?: RequestInit,
): Promise<Response> {
  return fetch(input, {
    ...init,
    signal: AbortSignal.timeout(PUBLIC_API_FETCH_TIMEOUT_MS),
  });
}
