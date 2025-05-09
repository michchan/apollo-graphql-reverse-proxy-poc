import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { gql } from "@apollo/client";

const HELLO_QUERY = gql`
  query Hello {
    hello
  }
`;

const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      accessToken
      refreshToken
    }
  }
`;

const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken)
  }
`;

const NOTIFICATIONS_SUBSCRIPTION = gql`
  subscription OnNotification {
    notification {
      message
    }
  }
`;

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notifications, setNotifications] = useState<string[]>([]);

  const { data: queryData } = useQuery(HELLO_QUERY);
  const [login] = useMutation(LOGIN_MUTATION);
  const [refreshToken] = useMutation(REFRESH_TOKEN_MUTATION);
  const { data: subData } = useSubscription(NOTIFICATIONS_SUBSCRIPTION);

  // Add new notifications to the array when received
  useEffect(() => {
    if (subData?.notification?.message) {
      setNotifications((prev) => [...prev, subData.notification.message]);
    }
  }, [subData]);

  const handleLogin = async () => {
    try {
      const result = await login({ variables: { username, password } });
      console.log("Login successful:", result.data);
    } catch (e) {
      console.error("Login failed:", e);
    }
  };

  const handleRefresh = async () => {
    try {
      // Note: The refreshToken variable is injected by the proxy
      const result = await refreshToken({ variables: { refreshToken: "" } });
      console.log("Token refreshed:", result.data);
    } catch (e) {
      console.error("Refresh failed:", e);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">GraphQL POC</h1>

      <div className="mb-4">
        <h2>Query</h2>
        <p>{queryData?.hello || "Loading..."}</p>
      </div>

      <div className="mb-4">
        <h2>Login Mutation</h2>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="border p-1 mr-2"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="border p-1 mr-2"
        />
        <button onClick={handleLogin} className="bg-blue-500 text-white p-1">
          Login
        </button>
        <p>Use username: "user", password: "pass"</p>
      </div>

      <div className="mb-4">
        <h2>Refresh Token Mutation</h2>
        <button onClick={handleRefresh} className="bg-green-500 text-white p-1">
          Refresh Token
        </button>
      </div>

      <div>
        <h2>Notifications</h2>
        {notifications.length === 0 ? (
          <p>Waiting for notifications...</p>
        ) : (
          <ul className="list-disc pl-5">
            {notifications.map((notification, index) => (
              <li key={index} className="mb-1">
                {notification}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
