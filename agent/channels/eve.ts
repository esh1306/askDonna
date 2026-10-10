import { eveChannel } from "eve/channels/eve";
import { httpBasic, localDev } from "eve/channels/auth";

// Self-hosted on a VPS: callers (the runner, the console, the voice bridge) use HTTP Basic auth.
// localDev() only applies under `eve dev`; it never opens a production `eve start` server.
export default eveChannel({
  auth: [
    httpBasic({
      username: process.env.DONNA_API_USER ?? "donna",
      password: process.env.DONNA_API_PASSWORD ?? "",
    }),
    localDev(),
  ],
});
