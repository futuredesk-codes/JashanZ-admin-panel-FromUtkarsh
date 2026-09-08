import { io } from "socket.io-client";
import { getStoredAuth } from "../api/client";

const SOCKET_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"
).replace(/\/api\/v1\/?$/, "");

// Connects using whichever portal's token applies to the current page
// (getStoredAuth already resolves Admin/Support/Finance/AdManager by path —
// see api/client.js). The backend puts every staff-role socket in a shared
// 'staff' room (see socketManager.js) so cross-portal broadcasts like
// business:status-changed reach whichever portal is listening.
export function connectStaffSocket() {
  const stored = getStoredAuth();
  return io(SOCKET_URL, {
    auth: { token: stored?.token },
    transports: ["websocket"],
  });
}
