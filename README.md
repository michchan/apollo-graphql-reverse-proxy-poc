# Unified POC: Nginx or Kong Reverse Proxy with Yarn v4 and Node 22.14

This Proof-of-Concept (POC) implements a reverse proxy setup using either Nginx or Kong, switchable via the `REVERSE_PROXY_TYPE` environment variable. It uses Yarn v4 (Berry) 4.5.1 for package management, Node.js 22.14, and includes a `.nvmrc` file. Both proxies inject the `refreshToken` cookie into the request body for the `refreshToken` GraphQL mutation, supporting queries, mutations, subscriptions, and cookie handling (`HttpOnly`, `Secure`, `SameSite=Strict`).

## Requirements Met

1. **Testable Locally**: Runs via Docker Compose on `localhost:80` (Nginx/Kong) and `localhost:4000` (GraphQL server).
2. **Same Domain for SPA and Proxy**: SPA and proxy served at `localhost:80`, GraphQL server on `localhost:4000`.
3. **`/graphql` Endpoint**: Used for all GraphQL requests and subscriptions.
4. **Refresh Token in Cookie**: `login` mutation sets an `HttpOnly`, `Secure`, `SameSite=Strict` cookie via `X-Set-Refresh-Token` header.
5. **Refresh Token in Request Body**: Both proxies inject the cookie’s `refreshToken` into the `refreshToken` mutation’s variables.
6. **Switchable Proxies**: Use `REVERSE_PROXY_TYPE=nginx` or `kong` to select the proxy.
7. **Yarn v4**: Uses Yarn 4.5.1, managed via committed `.yarn/releases/yarn-4.5.1.cjs` files in `server` and `client`.
8. **Node 22.14**: Uses `node:22.14-alpine` for building and running, specified in `.nvmrc`.

## Prerequisites

- **Docker** and **Docker Compose**: For running the project.
- **Node.js 22.14** (optional, for local development): Managed via NVM.
- **Yarn** (optional, for local development): A minimal Yarn installation is needed to generate `.yarn/releases/yarn-4.5.1.cjs`.
- **Git**: To clone the repository.

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd poc-reverse-proxy-unified
   ```

2. **Set Node.js Version (Optional for Local Development)**
   If using NVM:
   ```bash
   nvm install
   nvm use
   ```

3. **Verify Yarn v4 (Optional for Local Development)**
   The repository includes `.yarn/releases/yarn-4.5.1.cjs` for Yarn 4.5.1. To verify:
   ```bash
   cd server
   yarn --version  # Should output 4.5.1
   cd ../client
   yarn --version  # Should output 4.5.1
   ```
   If `.yarn/releases/yarn-4.5.1.cjs` is missing or Yarn v1 is used, generate the file:
   - Create a temporary directory to install Yarn:
     ```bash
     mkdir temp-yarn
     cd temp-yarn
     npm init -y
     npm install yarn
     cd ..
     ```
   - Comment out `yarnPath` in `server/.yarnrc.yml` and `client/.yarnrc.yml`:
     ```yaml
     nodeLinker: node-modules
     # yarnPath: .yarn/releases/yarn-4.5.1.cjs
     ```
   - Generate `.yarn/releases/yarn-4.5.1.cjs`:
     ```bash
     cd server
     ../temp-yarn/node_modules/.bin/yarn set version --yarn-path 4.5.1
     cd ../client
     ../temp-yarn/node_modules/.bin/yarn set version --yarn-path 4.5.1
     ```
   - Restore `yarnPath` in `server/.yarnrc.yml` and `client/.yarnrc.yml`:
     ```yaml
     nodeLinker: node-modules
     yarnPath: .yarn/releases/yarn-4.5.1.cjs
     ```
   - Commit the files:
     ```bash
     git add server/.yarn/releases/yarn-4.5.1.cjs client/.yarn/releases/yarn-4.5.1.cjs server/.yarnrc.yml client/.yarnrc.yml
     git commit -m "Add Yarn 4.5.1 release files and update .yarnrc.yml"
     ```
   - Clean up:
     ```bash
     rm -rf temp-yarn
     ```

4. **Set Up Environment File**
   Copy the example environment file to create `.env`:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to set the desired proxy (default is `nginx`):
   ```bash
   # Example .env
   REVERSE_PROXY_TYPE=nginx
   # OR
   REVERSE_PROXY_TYPE=kong
   ```

5. **Build and Run**
   ```bash
   export $(grep -v '^#' .env | xargs) && docker-compose --profile $REVERSE_PROXY_TYPE up --build
   ```

6. **Access the App**
   - Open `http://localhost` in your browser.
   - Use username "user" and password "pass" for login.

7. **Test**
   - **Query**: Displays "Hello from GraphQL!" on load.
   - **Mutation (Login)**: Sets the `refreshToken` cookie.
   - **Mutation (Refresh)**: Uses the cookie’s token in the request body to get a new access token.
   - **Subscription**: Notification update every 5 seconds.

## Switching Proxies

- To use Nginx:
  ```bash
  export REVERSE_PROXY_TYPE=nginx
  docker-compose --profile nginx up --build
  ```
- To use Kong:
  ```bash
  export REVERSE_PROXY_TYPE=kong
  docker-compose --profile kong up --build
  ```

## Local Development (Optional)

To run the server or client locally without Docker:
1. **Server**:
   ```bash
   cd server
   yarn install
   yarn build
   yarn start
   ```
2. **Client**:
   ```bash
   cd client
   yarn install
   yarn dev
   ```

## Repository Setup (For Maintainers)

To regenerate `.yarn/releases/yarn-4.5.1.cjs` if needed:
- Create a temporary directory to install Yarn:
  ```bash
  mkdir temp-yarn
  cd temp-yarn
  npm init -y
  npm install yarn
  cd ..
  ```
- Comment out `yarnPath` in `server/.yarnrc.yml` and `client/.yarnrc.yml`:
  ```yaml
  nodeLinker: node-modules
  # yarnPath: .yarn/releases/yarn-4.5.1.cjs
  ```
- Generate `.yarn/releases/yarn-4.5.1.cjs`:
  ```bash
  cd server
  ../temp-yarn/node_modules/.bin/yarn set version --yarn-path 4.5.1
  cd ../client
  ../temp-yarn/node_modules/.bin/yarn set version --yarn-path 4.5.1
  ```
- Restore `yarnPath` in `server/.yarnrc.yml` and `client/.yarnrc.yml`:
  ```yaml
  nodeLinker: node-modules
  yarnPath: .yarn/releases/yarn-4.5.1.cjs
  ```
- Commit the files:
  ```bash
  git add server/.yarn/releases/yarn-4.5.1.cjs client/.yarn/releases/yarn-4.5.1.cjs server/.yarnrc.yml client/.yarnrc.yml
  git commit -m "Update Yarn 4.5.1 release files and .yarnrc.yml"
  ```
- Clean up:
  ```bash
  rm -rf temp-yarn
  ```

## Comparison: Nginx vs. Kong

- **Configuration**:
  - **Nginx**: Static `nginx.conf` with `njs` scripts. Simpler for small setups but less dynamic.
  - **Kong**: Declarative `kong.yml` with Lua plugins. More complex but API-driven and scalable.
- **Refresh Token in Request Body**:
  - **Nginx**: Uses `njs` to parse `r.requestText` and set `r.requestBody`. Limited by `njs` body handling.
  - **Kong**: Lua’s `kong.request.get_body` and `kong.service.request.set_raw_body` are robust for JSON manipulation.
- **WebSocket Handling**:
  - **Nginx**: Explicit `proxy_set_header` directives for WebSocket proxying.
  - **Kong**: Implicit WebSocket support via service/route model.
- **Extensibility**:
  - **Nginx**: Limited to `njs` or external modules, less suited for API management.
  - **Kong**: Built for API gateways, supports plugins, rate-limiting, and observability.
- **Performance**:
  - **Nginx**: Lighter, ideal for simple reverse proxy tasks.
  - **Kong**: Heavier due to API gateway features but more feature-rich.

## Notes

- **Yarn v4**: Uses Yarn 4.5.1, managed via committed `.yarn/releases/yarn-4.5.1.cjs` files. The `node-modules` linker ensures Docker compatibility.
- **Secure Cookie**: The `Secure` attribute requires HTTPS in production; not enforced locally.
- **Mutation Naming**: Proxies assume the `refreshToken` mutation is named exactly `refreshToken`. Aliases may require query parsing adjustments.
- **Nginx Limitations**: `njs` body parsing is less robust than Kong’s Lua; Kong is preferred for complex body manipulations.

Choose Nginx for lightweight, straightforward setups; choose Kong for dynamic, scalable API gateway features.