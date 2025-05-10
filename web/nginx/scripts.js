function setRefreshTokenInResponseHeader(r) {
  try {
    // Check if the backend returned a refresh token in the headers
    const refreshToken = r.headersOut["X-Refresh-Token"];
    r.log("🚀 ~ setRefreshTokenInResponseHeader ~ r.headersOut:", r.headersOut);
    r.log("🚀 ~ setRefreshTokenInResponseHeader ~ refreshToken:", refreshToken);

    if (refreshToken) {
      // Uncomment the following line with HTTPS:
      // r.headersOut['Set-Cookie'] = `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict`;
      r.headersOut[
        "Set-Cookie"
      ] = `refreshToken=${refreshToken}; HttpOnly; SameSite=Strict`;

      r.headersOut["X-Refresh-Token"] = "";
      r.log(
        "🚀 ~ setRefreshTokenInResponseHeader ~ r.headersOut:",
        r.headersOut
      );
    }
  } catch (e) {
    r.log(`Error in setRefreshTokenInResponseHeader: ${e.message}`, e);
  }
}

const RESOURCE_NAMES_WITH_REFRESH_TOKEN = ["login", "refreshSession"];

function stripRefreshTokenInResponseBody(r, data, flags) {
  try {
    let responseBody = data.trim() ? JSON.parse(data) : {};
    let modifiedBody = responseBody;

    RESOURCE_NAMES_WITH_REFRESH_TOKEN.forEach((resourceName) => {
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
    r.log(`Error in stripRefreshTokenInResponseBody: ${e.message}`, e);
  }
}

export default {
  setRefreshTokenInResponseHeader,
  stripRefreshTokenInResponseBody,
};
