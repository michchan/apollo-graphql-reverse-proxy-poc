import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import http from "http";
import cors from "cors";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { PubSub } from "graphql-subscriptions";
import type {
  ApolloServerPlugin,
  GraphQLRequestContextWillSendResponse,
} from "@apollo/server";

// Define interfaces for resolver arguments
interface LoginArgs {
  username: string;
  password: string;
}

interface RefreshTokenArgs {
  refreshToken: string;
}

// Define GraphQL type definitions
const typeDefs = `#graphql
  type Query {
    hello: String!
  }

  type Mutation {
    login(username: String!, password: String!): String
    refreshToken(refreshToken: String!): String
  }

  type Notification {
    message: String!
  }

  type Subscription {
    notification: Notification!
  }
`;

// Create PubSub for subscriptions
const pubsub = new PubSub();

// Define resolvers
const resolvers = {
  Query: {
    hello: () => "Hello from GraphQL!",
  },
  Mutation: {
    login: (_: unknown, { username, password }: LoginArgs) => {
      if (username === "user" && password === "pass") {
        return "access-token-123";
      }
      throw new Error("Invalid credentials");
    },
    refreshToken: (_: unknown, { refreshToken }: RefreshTokenArgs) => {
      if (refreshToken === "refresh-token-123") {
        return "new-access-token-456";
      }
      throw new Error("Invalid refresh token");
    },
  },
  Subscription: {
    notification: {
      subscribe: () => pubsub.asyncIterator(["NOTIFICATION"]),
    },
  },
};

// Create a custom Apollo Server plugin to set the refresh token cookie
const refreshTokenPlugin: ApolloServerPlugin = {
  async requestDidStart() {
    return {
      async willSendResponse(
        context: GraphQLRequestContextWillSendResponse<any>
      ) {
        const { response, operationName } = context;

        const result =
          "singleResult" in response.body && response.body.singleResult;

        if (operationName === "login" && result && result.data?.login) {
          const refreshToken = "refresh-token-123";

          // Set refresh token in the headers
          response.http?.headers.set(
            "Set-Cookie",
            `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict`
          );
        }
      },
    };
  },
};
// Create executable schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create Express app and HTTP server
const app = express();
const httpServer = http.createServer(app);

// Create WebSocket server for subscriptions
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});

// Use WebSocket server with GraphQL schema
useServer({ schema }, wsServer);

// Create Apollo Server
const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    refreshTokenPlugin,
  ],
});

// Start the server
await server.start();

// Apply Apollo Server middleware
app.use(
  "/graphql",
  cors<cors.CorsRequest>(),
  express.json(),
  expressMiddleware(server)
);

// Start the HTTP server
await new Promise<void>((resolve) =>
  httpServer.listen({ port: 4000 }, resolve)
);
console.log(`🚀 Server ready at http://localhost:4000/graphql`);
console.log(`🚀 Server ready at ws://localhost:4000/graphql`);

// Publish notifications every 5 seconds
setInterval(() => {
  pubsub.publish("NOTIFICATION", {
    notification: { message: "New notification!" },
  });
}, 5000);
