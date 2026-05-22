import { createRouter } from "next-connect";
import database from "infra/database.js";
import controller from "infra/controller";
import authorization from "models/authorization";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;

  const updatedAt = new Date().toISOString();

  const currentVersion = await database.getCurrentVersion();
  const maxConnections = await database.getMaxConnections();
  const getOpenConnections = await database.getOpenConnections(
    process.env.POSTGRES_DB,
  );

  const statusObject = {
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: currentVersion,
        max_connections: parseInt(maxConnections),
        opened_connections: getOpenConnections,
      },
    },
  };

  const secureOutputValue = authorization.filterOutput(
    userTryingToGet,
    "read:status",
    statusObject,
  );

  response.status(200).json(secureOutputValue);
}
