import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  split,
  HttpLink,
} from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";

const IS_DEV = import.meta.env.DEV;

const httpLink = new HttpLink({
  // This is setup for sitting behind a reverse proxy (Nginx) with the same domain. Use absolute URL for local development.
  uri: IS_DEV ? "http://localhost:4000/graphql" : "/graphql",
});

const wsLink = new GraphQLWsLink(
  createClient({
    // This is setup for sitting behind a reverse proxy (Nginx) with the same domain. Use absolute URL for local development.
    url: IS_DEV ? "ws://localhost:4000/graphql" : "/graphql",
    retryAttempts: 5,
    shouldRetry: () => true,
    lazyCloseTimeout: 5000,
    connectionParams: {
      // Optional: Add authentication headers if needed
      authToken: "your-auth-token",
    },
    on: {
      connected: (event) => console.log("WebSocket connected!", event),
      closed: (event) => console.log("WebSocket disconnected!", event),
      error: (err) => console.error("WebSocket error:", err),
      message: (msg) => console.log("WebSocket message received:", msg),
    },
  })
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);
