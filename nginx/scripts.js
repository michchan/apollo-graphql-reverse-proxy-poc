function setRefreshTokenCookie(r) {
  if (r.headersOut["X-Set-Refresh-Token"]) {
    r.headersOut[
      "Set-Cookie"
    ] = `refreshToken=${r.headersOut["X-Set-Refresh-Token"]}; HttpOnly; Secure; SameSite=Strict`;
    delete r.headersOut["X-Set-Refresh-Token"];
  }
}

function modifyRequestBody(r) {
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
    r.warn("Failed to parse request body");
    r.proxyPass("http://gql-server:4000/graphql");
    return;
  }

  if (body.query && body.query.includes("mutation refreshToken")) {
    body.variables = body.variables || {};
    body.variables.refreshToken = refreshToken;
    r.requestBody = JSON.stringify(body);
  }

  r.proxyPass("http://gql-server:4000/graphql");
}
