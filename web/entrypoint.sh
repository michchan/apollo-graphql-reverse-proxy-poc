#!/bin/sh

# Required environment variables (from ENV)
required_vars="ALLOWED_ORIGIN ALLOWED_HEADERS SERVER_NAME GRAPHQL_API_KEY"

# Check if all required variables are set
for var in $required_vars; do
  # Use eval to get the value of the variable named in $var
  value=$(eval echo "\$$var")
  if [ -z "$value" ]; then
    echo "Error: Environment variable $var is not set"
    exit 1
  fi
done

# Construct envsubst pattern with escaped dollar signs
envsubst_pattern=""
for var in $required_vars; do
  envsubst_pattern="$envsubst_pattern \$"$var
done
envsubst_pattern=$(echo "$envsubst_pattern" | sed 's/^ //') # Remove leading space

# Substitute variables based on reverse proxy type
envsubst "$envsubst_pattern" < /etc/nginx/templates/nginx.conf.template > /etc/nginx/nginx.conf
nginx -v
nginx -g 'daemon off;'