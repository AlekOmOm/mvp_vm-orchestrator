import { WebSocketClient } from "./WebSocketClient.js";

const wsClient = new WebSocketClient("/jobs");

wsClient.connect();

