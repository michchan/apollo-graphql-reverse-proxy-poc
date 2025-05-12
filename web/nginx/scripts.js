const RESOURCES_WITH_REFRESH_TOKEN = ["login", "refreshSession"];

function stripRefreshTokenInResponseBody(r, data, flags) {
  if (r.status >= 400) return;

  try {
    let responseBody = data.trim() ? JSON.parse(data) : {};
    let modifiedBody = responseBody;

    RESOURCES_WITH_REFRESH_TOKEN.forEach((resourceName) => {
      if (
        responseBody &&
        typeof responseBody === "object" &&
        responseBody.data &&
        responseBody.data[resourceName]
      ) {
        const refreshToken = responseBody.data[resourceName].refreshToken;
        if (refreshToken) {
          modifiedBody = Object.assign(responseBody.data[resourceName], {
            refreshToken: "",
          });
        }
      }
    });

    r.sendBuffer(JSON.stringify(modifiedBody), flags);
  } catch (e) {
    r.error(`Error in stripRefreshTokenInResponseBody: ${e.message}`, e);
  }
}

export default { stripRefreshTokenInResponseBody };
