/**
 * Asynchronous execution utilities with diagnostic timeout guards.
 * Ensures no asynchronous operation (e.g. Firestore network queries) can hang indefinitely.
 */

export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
  operationName: string
): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      console.warn(`[TIMEOUT]\noperation: ${operationName} (exceeded ${ms}ms)`);
      resolve(fallback);
    }, ms);
  });

  return Promise.race([
    promise
      .then((res) => {
        clearTimeout(timer);
        return res;
      })
      .catch((err) => {
        clearTimeout(timer);
        console.warn(`[ERROR] operation: ${operationName} failed:`, err);
        return fallback;
      }),
    timeoutPromise
  ]);
}
