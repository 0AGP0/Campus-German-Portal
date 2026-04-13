import "dotenv/config";
import http from "node:http";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const cliPortIndex = process.argv.findIndex((arg) => arg === "-p" || arg === "--port");
const cliPortValue = cliPortIndex >= 0 ? process.argv[cliPortIndex + 1] : undefined;
const port = Number(cliPortValue || process.env.PORT || 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    handle(req, res);
  });
  server.listen(port, hostname, () => {
    // eslint-disable-next-line no-console
    console.log(`> Ready on http://127.0.0.1:${port}`);
  });
  const shutdown = (signal) => {
    // eslint-disable-next-line no-console
    console.log(`> ${signal} received, shutting down...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
});
