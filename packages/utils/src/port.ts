/**
 * Parse and validate a port number from an environment variable.
 *
 * @param envVar - The environment variable value (can be undefined)
 * @param fallback - The fallback port number to use if the environment variable is invalid
 * @returns A valid port number
 */
export const parsePort = (
  envVar: string | undefined,
  fallback: number
): number => {
  if (!envVar) return fallback;
  const parsed = parseInt(envVar, 10);
  if (isNaN(parsed) || parsed <= 0 || parsed > 65535) {
    console.warn(
      `Invalid port "${envVar}" provided, falling back to ${fallback}`
    );
    return fallback;
  }
  return parsed;
};
