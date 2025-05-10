const REFRESH_TOKEN_HEADER = "X-Refresh-Token";
const REFRESH_TOKEN_COOKIE = "refreshToken";
const RESOURCES_WITH_REFRESH_TOKEN = ["login", "refreshSession"];

function extractRefreshTokenInRequestHeader(r) {
  const cookieHeader = r.headersIn["Cookie"];
  if (!cookieHeader) {
    return "";
  }
  const cookies = cookieHeader.split(";");

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const keyValuePair = cookie.trim().split("=");
    const name = keyValuePair[0];
    const value = keyValuePair[1];

    if (name === REFRESH_TOKEN_COOKIE) {
      r.log("Extracted refreshToken: " + value);
      return value;
    }
  }
  r.log("No refreshToken found in cookies");
  return "";
}

function setRefreshTokenInResponseHeader(r) {
  try {
    // Check if the backend returned a refresh token in the headers
    const refreshToken = r.headersOut[REFRESH_TOKEN_HEADER];

    if (refreshToken) {
      // Uncomment the following line with HTTPS:
      // r.headersOut['Set-Cookie'] = `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict`;
      r.headersOut[
        "Set-Cookie"
      ] = `${REFRESH_TOKEN_COOKIE}=${refreshToken}; HttpOnly; SameSite=Strict`;

      r.headersOut[REFRESH_TOKEN_HEADER] = "";
    }
  } catch (e) {
    r.error(`Error in setRefreshTokenInResponseHeader: ${e.message}`, e);
  }
}

function stripRefreshTokenInResponseBody(r, data, flags) {
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

export default {
  extractRefreshTokenInRequestHeader,
  setRefreshTokenInResponseHeader,
  stripRefreshTokenInResponseBody,
};
