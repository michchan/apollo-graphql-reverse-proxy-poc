function setRefreshTokenInResponseHeader(r) {
  try {
    // Check if the backend returned a refresh token in the headers
    const refreshToken = r.headersOut["X-Refresh-Token"];
    if (refreshToken) {
      // Uncomment the following line with HTTPS:
      // r.headersOut['Set-Cookie'] = `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict`;
      r.headersOut[
        "Set-Cookie"
      ] = `refreshToken=${refreshToken}; HttpOnly; SameSite=Strict`;

      r.headersOut["X-Refresh-Token"] = "";
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
    r.log(`Error in stripRefreshTokenInResponseBody: ${e.message}`, {
      data,
      e,
    });
  }
}

// Somehow these keys make the websocket connection establishment failed.
const WS_PASS_THROUGH_HEADER_BLACKLIST = [
  "Upgrade",
  "Sec-WebSocket-Extensions",
  "Sec-WebSocket-Protocol",
];

function handleGraphqlRequest(r) {
  // Copy all headers from the original request to the outgoing headers
  for (const header in r.headersIn) {
    r.headersOut[header] = r.headersIn[header];
  }

  // Handle Web socket request
  if (r.headersIn["Upgrade"] === "websocket") {
    WS_PASS_THROUGH_HEADER_BLACKLIST.forEach((blacklistedHeader) => {
      r.headersOut[blacklistedHeader] = "";
    });
    r.internalRedirect("@graphql_upstream_ws");
    return;
  }
  // Handle HTTP request
  setRefreshTokenFromRequestCookie(r);
  r.internalRedirect("@graphql_upstream_http");
}

function setRefreshTokenFromRequestCookie(r) {
  const cookieHeader = r.headersOut["Cookie"];
  if (!cookieHeader) return;

  const cookies = parseCookies(cookieHeader);
  r.log("🚀 ~ setRefreshTokenFromRequestCookie ~ cookies:", cookies);
}

// Utility function to parse cookies from the Cookie header
function parseCookies(cookieHeader) {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader
      .replace(/\s/g, "")
      .split(";")
      .forEach((cookie) => {
        const keyValuePair = cookie.split("=").map((part) => part.trim());
        const name = keyValuePair[0];
        const value = keyValuePair[1];
        cookies[name] = value;
      });
  }
  return cookies;
}

export default {
  handleGraphqlRequest,
  setRefreshTokenInResponseHeader,
  stripRefreshTokenInResponseBody,
};
