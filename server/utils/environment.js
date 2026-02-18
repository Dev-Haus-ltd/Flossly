/**
 * Determine the environment based on the BASE_URL
 * @param {string} baseUrl - The BASE_URL from runtime config
 * @returns {string} - "production" or "development"
 */
export const getEnvironmentFromUrl = (baseUrl) => {
  if (!baseUrl) return "development";

  const url = String(baseUrl).toLowerCase();

  // Production environment
  if (url.includes("app.flossly.ai")) {
    return "production";
  }

  // Explicit dev env
  if (url.includes("dev.flossly.ai")) {
    return "development";
  }

  // Development environment (default for dev, localhost, etc.)
  return "development";
};

/**
 * Determine environment from an incoming request host header.
 * @param {string} hostHeader e.g. "dev.flossly.ai" or "app.flossly.ai"
 */
export const getEnvironmentFromHost = (hostHeader) => {
  if (!hostHeader) return "development";
  const host = String(hostHeader).toLowerCase();
  if (host.includes("app.flossly.ai")) return "production";
  if (host.includes("dev.flossly.ai")) return "development";
  return "development";
};

/**
 * Get the current environment from runtime config
 * @returns {string} - "production" or "development"
 */
export const getCurrentEnvironment = () => {
  const config = useRuntimeConfig();
  return getEnvironmentFromUrl(config.public?.BASE_URL);
};
