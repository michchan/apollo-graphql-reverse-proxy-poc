local typedefs = require "kong.db.schema.typedefs"

return {
  name = "refresh-token-plugin",
  fields = {
    { config = {
        type = "record",
        fields = {
          { set_cookie_header = typedefs.header_name { required = true, default = "X-Set-Refresh-Token" }, },
          { extract_cookie_name = { type = "string", required = true, default = "refreshToken" }, },
          { mutation_name = { type = "string", required = true, default = "refreshToken" }, },
        },
      },
    },
  },
}