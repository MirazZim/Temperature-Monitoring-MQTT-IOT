import { io } from "socket.io-client";
export const createSocket = (token) =>
  io("http://localhost:3001", {
    transports: ["polling"],
    auth: { token },
    withCredentials: true,
    upgrade: false, // optional, to ensure no WS upgrade attempt
  });
