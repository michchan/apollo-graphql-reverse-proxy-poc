local RefreshTokenPlugin = {
  VERSION = "1.0.0",
  PRIORITY = 1000,
}

function RefreshTokenPlugin:header_filter(config)
  local set_cookie_header = kong.response.get_header(config.set_cookie_header)
  if set_cookie_header then
    kong.response.set_header("Set-Cookie", config.extract_cookie_name .. "=" .. set_cookie_header .. "; HttpOnly; Secure; SameSite=Strict")
    kong.response.clear_header(config.set_cookie_header)
  end
end

function RefreshTokenPlugin:access(config)
  local cookies = kong.request.get_header("Cookie")
  local refresh_token = ""
  if cookies then
    local cookie_name = config.extract_cookie_name
    local pattern = cookie_name .. "=([^;]+)"
    local match = string.match(cookies, pattern)
    if match then
      refresh_token = match
    end
  }

  local body = kong.request.get_body("application/json")
  if body and body.query and string.find(body.query, "mutation%s+" .. config.mutation_name) then
    local new_body = {
      query = body.query,
      variables = body.variables or {},
      operationName = body.operationName
    }
    new_body.variables.refreshToken = refresh_token
    kong.service.request.set_header("Content-Type", "application/json")
    kong.service.request.set_raw_body(require("cjson").encode(new_body))
  end
end

return RefreshTokenPlugin