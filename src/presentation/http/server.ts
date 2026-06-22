import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { databasePath, port } from "../../config.ts";
import { GetRunningOverview } from "../../application/use-cases/get-running-overview.ts";
import { SqliteActivityRepository } from "../../infrastructure/sqlite/sqlite-activity-repository.ts";
import { SqliteMigrator } from "../../infrastructure/sqlite/migrator.ts";
import { OverviewController } from "./overview-controller.ts";

new SqliteMigrator(databasePath).run();

const repository = new SqliteActivityRepository(databasePath);
const controller = new OverviewController(new GetRunningOverview(repository));

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

    if (url.pathname === "/") {
      await controller.show(response);
      return;
    }

    if (url.pathname === "/styles.css") {
      const css = await readFile("public/styles.css", "utf8");
      response.writeHead(200, { "content-type": "text/css; charset=utf-8" });
      response.end(css);
      return;
    }

    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  } catch (error) {
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end(error instanceof Error ? error.message : "Unexpected server error");
  }
});

server.listen(port, () => {
  console.log(`Strava Analysis running at http://127.0.0.1:${port}`);
});
