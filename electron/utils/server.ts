import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";

import { logger } from "./logger";

export function startProductionServer(distPath: string, initialPort: number = 45678): Promise<number> {
  return new Promise((resolve, reject) => {
    let currentPort = initialPort;

    const productionServer = http.createServer((req, res) => {
      const filePath = path.join(distPath, req.url === "/" ? "index.html" : (req.url || ""));

      // Security: prevent directory traversal
      if (!filePath.startsWith(distPath)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      const extname = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".wav": "audio/wav",
        ".mp3": "audio/mpeg",
        ".mp4": "video/mp4",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
        ".ttf": "font/ttf",
        ".ico": "image/x-icon",
      };

      const contentType = mimeTypes[extname] || "application/octet-stream";

      fs.readFile(filePath, (error, content) => {
        if (error) {
          if (error.code === "ENOENT") {
            // SPA fallback - serve index.html for any unknown route
            fs.readFile(path.join(distPath, "index.html"), (err, indexContent) => {
              if (err) {
                res.writeHead(500);
                res.end("Server Error");
              } else {
                res.writeHead(200, { "Content-Type": "text/html" });
                res.end(indexContent, "utf-8");
              }
            });
          } else {
            res.writeHead(500);
            res.end(`Server Error: ${error.code}`);
          }
        } else {
          res.writeHead(200, { "Content-Type": contentType });
          res.end(content, "utf-8");
        }
      });
    });

    productionServer.listen(currentPort, "127.0.0.1", () => {
      logger.log(`Production server running at http://localhost:${currentPort}`);
      resolve(currentPort);
    });

    productionServer.on("error", (err) => {
      if ((err as NodeJS.ErrnoException).code === "EADDRINUSE") {
        currentPort++;
        productionServer.listen(currentPort, "127.0.0.1");
      } else {
        reject(err);
      }
    });
  });
}
