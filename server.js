const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3001", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Log all headers for POST requests (server actions) - debug only
      if (req.method === "POST" && process.env.DEBUG_HEADERS === "true") {
        console.log("=== SERVER ACTION REQUEST ===");
        console.log("URL:", req.url);
        console.log("Headers:", JSON.stringify(req.headers, null, 2));
      }

      // Fix duplicated headers from Cloudflare + LiteSpeed proxy chain
      const fixHeader = (name) => {
        const value = req.headers[name];
        if (value && typeof value === "string" && value.includes(",")) {
          const fixed = value.split(",")[0].trim();
          req.headers[name] = fixed;
          console.log(`Fixed header ${name}: "${value}" -> "${fixed}"`);
        }
      };

      // Fix ALL potential duplicate headers
      fixHeader("x-forwarded-proto");
      fixHeader("x-forwarded-host");
      fixHeader("x-forwarded-for");
      fixHeader("x-forwarded-port");
      fixHeader("host");
      fixHeader("origin");

      // Override host-related headers to ensure single values
      req.headers["x-forwarded-proto"] = "https";
      req.headers["x-forwarded-host"] = "c7personalfitness.com";
      req.headers["host"] = "c7personalfitness.com";

      // Fix origin header if it exists
      if (req.headers["origin"]) {
        req.headers["origin"] = "https://c7personalfitness.com";
      }

      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  })
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log("> Ready on http://" + hostname + ":" + port);
    });
});
