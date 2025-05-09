import {
  ApolloServer,
  ApolloServerPlugin,
  GraphQLRequestContextWillSendResponse,
} from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import http from "http";
import cors from "cors";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { PubSub } from "graphql-subscriptions";

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
  type AuthPayload {
    accessToken: String!
    refreshToken: String!
  }

  type Query {
    hello: String!
  }

  type Mutation {
    login(username: String!, password: String!): AuthPayload!
    refreshSession(refreshToken: String!): AuthPayload!
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
        const result = {
          accessToken: "access-token-123",
          refreshToken: "refresh-token-123",
        };
        // Publish a notification when login is successful
        pubsub.publish("NOTIFICATION", {
          notification: { message: `User ${username} has logged in!` },
        });
        return result;
      }
      throw new Error("Invalid credentials");
    },
    refreshSession: (_: unknown, { refreshToken }: RefreshTokenArgs) => {
      if (refreshToken === "refresh-token-123") {
        return {
          accessToken: "new-access-token-456",
          refreshToken: "new-refresh-token-789",
        };
      }
      throw new Error("Invalid refresh token");
    },
  },
  Subscription: {
    notification: {
      subscribe: () => {
        console.log("🚀 ~ subscribe");
        return pubsub.asyncIterator(["NOTIFICATION"]);
      },
    },
  },
};

const RESOURCE_NAMES_WITH_REFRESH_TOKEN = ["login", "refreshSession"];

const refreshTokenPlugin: ApolloServerPlugin = {
  async requestDidStart() {
    return {
      async willSendResponse(
        context: GraphQLRequestContextWillSendResponse<any>
      ) {
        const { response } = context;

        const result =
          "singleResult" in response.body && response.body.singleResult;

        const matchedResourceName =
          result &&
          result.data &&
          RESOURCE_NAMES_WITH_REFRESH_TOKEN.find(
            (resourceName) => resourceName in (result.data ?? {})
          );

        if (
          matchedResourceName &&
          result &&
          result.data &&
          result.data[matchedResourceName]
        ) {
          const refreshToken = (result.data[matchedResourceName] as any)
            .refreshToken;
          // Set refresh token in the headers
          response.http?.headers.set("X-Refresh-Token", refreshToken);
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
useServer(
  {
    schema,
    onConnect: async (ctx) => {
      console.log(
        "🚀 ~ onConnect: ~ ctx.connectionParams:",
        JSON.stringify(ctx.connectionParams, null, 2)
      );
    },
    onDisconnect: (ctx, code, reason) => {
      console.log("Disconnected!", {
        connectionParams: ctx.connectionParams,
        code,
        reason,
      });
    },
    onSubscribe: (ctx, msg) => {
      console.log("Client subscribed, message:", msg);
    },
  },
  wsServer
);

// Create Apollo Server
const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    refreshTokenPlugin,
  ],
  status400ForVariableCoercionErrors: true,
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
