import { createRouter } from "next-connect";
import database from "infra/database.js";
import controller from "infra/controller";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const updatedAt = new Date().toISOString();

  const currentVersion = await database.getCurrentVersion();
  const maxConnections = await database.getMaxConnections();
  const getOpenConnections = await database.getOpenConnections(
    process.env.POSTGRES_DB,
  );

  response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: currentVersion,
        max_connections: parseInt(maxConnections),
        opened_connections: getOpenConnections,
      },
    },
  });
}
