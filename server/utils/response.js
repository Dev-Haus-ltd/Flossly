export function success(data) {
  return {
    code: 0,
    success: true,
    data,
  };
}

export function error(statusCode, message) {
  // Normalize message to a string to avoid framework operations like .replace failing on non-strings
  let msg = message || (statusCode === 403 ? "Forbidden" : statusCode === 401 ? "Unauthenticated" : "Server Error");
  if (typeof msg !== "string") {
    if (msg && typeof msg.message === "string" && msg.message.trim() !== "") {
      msg = msg.message;
    } else if (msg && typeof msg.toString === "function") {
      msg = msg.toString();
    } else {
      try {
        msg = JSON.stringify(msg);
      } catch (_) {
        msg = "Server Error";
      }
    }
  }

  throw createError({
    statusCode,
    statusMessage: msg,
    data: {
      code: 1,
      success: false,
      message: msg,
    },
  });
}
