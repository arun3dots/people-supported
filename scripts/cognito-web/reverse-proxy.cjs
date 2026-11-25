const { createServer, request: httpRequest } = require("node:http");

function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function startNginxLikeProxy({ backendPort, webPort, adminPort }) {
  const server = createServer(async (req, res) => {
    const rawHost = String(req.headers.host || "").toLowerCase();
    const hostname = rawHost.replace(/:\d+$/, "");
    const urlPath = req.url || "/";
    const isApi = urlPath === "/api" || urlPath.startsWith("/api/");
    const targetPort = isApi
      ? backendPort
      : hostname === "admin.cantracare.test"
        ? adminPort
        : webPort;

    const body =
      req.method === "GET" || req.method === "HEAD"
        ? null
        : await collectBody(req);

    const headers = { ...req.headers };
    headers["x-forwarded-host"] = rawHost;
    headers["x-forwarded-proto"] = "http";
    headers["x-forwarded-for"] = "127.0.0.1";

    const upstream = httpRequest(
      {
        hostname: "127.0.0.1",
        port: targetPort,
        path: urlPath,
        method: req.method,
        headers,
      },
      (upRes) => {
        res.writeHead(upRes.statusCode || 502, upRes.headers);
        upRes.pipe(res);
      },
    );
    upstream.on("error", (err) => {
      if (!res.headersSent) res.writeHead(502);
      res.end(`Upstream proxy error: ${err.message}`);
    });
    if (body && body.length > 0) upstream.write(body);
    upstream.end();
  });

  await new Promise((resolve, reject) =>
    server.once("error", reject).listen(0, "127.0.0.1", resolve),
  );
  const { port } = server.address();
  return {
    port,
    webOrigin: `http://web.cantracare.test:${port}`,
    adminOrigin: `http://admin.cantracare.test:${port}`,
    close: () =>
      new Promise((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      ),
  };
}

module.exports = { startNginxLikeProxy };
