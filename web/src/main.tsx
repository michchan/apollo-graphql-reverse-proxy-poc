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

const httpLink = new HttpLink({
  // This is setup for sitting behind a reverse proxy (Nginx/Kong) with the same domain. Use absolute URL for local development.
  // uri: "http://localhost:4000/graphql"
  uri: "/graphql",
});

const wsLink = new GraphQLWsLink(
  createClient({
    // This is setup for sitting behind a reverse proxy (Nginx/Kong) with the same domain. Use absolute URL for local development.
    // url: "ws://localhost:4000/graphql"
    url: "/graphql",
    connectionParams: {
      // Optional: Add authentication headers if needed
      authToken: "your-auth-token",
    },
    on: {
      connected: () => console.log("WebSocket connected!"),
      closed: () => console.log("WebSocket disconnected!"),
      error: (err) => console.error("WebSocket error:", err),
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
