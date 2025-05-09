function forwardRefreshTokenToClient(r) {
  // Hardcoded list of mutations that return refreshToken
  const mutationsWithRefreshToken = ["login", "refreshToken"];

  // Skip if no response body or not a mutation response
  if (!r.responseBody) {
    r.warn("No response body available, skipping cookie processing");
    return;
  }

  let responseBody;
  try {
    responseBody = JSON.parse(r.responseBody);
  } catch (e) {
    r.warn("Failed to parse response body: " + e);
    return;
  }

  // Skip if no data or not a mutation result
  if (!responseBody.data || typeof responseBody.data !== "object") {
    r.warn("Response body does not contain valid data object");
    return;
  }

  // Check if the response is from a mutation with refreshToken
  mutationsWithRefreshToken.forEach(function (mutation) {
    if (
      r.variables &&
      r.variables.operationName === mutation &&
      responseBody.data[mutation]
    ) {
      const refreshToken = responseBody.data[mutation].refreshToken;
      if (refreshToken) {
        r.headersOut[
          "Set-Cookie"
        ] = `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict`;
      }
    }
  });
}

function forwardRefreshTokenToServer(r) {
  // Skip GET requests or requests without a body
  if (r.method === "GET" || !r.requestText) {
    r.warn("Skipping request processing for GET or no body");
    return;
  }

  let refreshToken = "";
  const cookie = r.headersIn["Cookie"];
  if (cookie) {
    const match = cookie.match(/refreshToken=([^;]+)/);
    if (match) {
      refreshToken = match[1];
    }
  }

  let body;
  try {
    body = JSON.parse(r.requestText);
  } catch (e) {
    r.warn("Failed to parse request body: " + e);
    return;
  }

  if (body.query && body.query.includes("mutation refreshToken")) {
    body.variables = body.variables || {};
    body.variables.refreshToken = refreshToken;
    r.requestBody = JSON.stringify(body);
  }
}

export default {
  forwardRefreshTokenToClient,
  forwardRefreshTokenToServer,
};
