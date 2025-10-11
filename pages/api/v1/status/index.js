import { createRouter } from "next-connect";
import database from "infra/database.js";
import { InternalServerError, MethodNotAllowedError } from "infra/errors";

const router = createRouter();

router.get(getHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

function onErrorHandler(error, request, response) {
  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.log("\nErro dentro do catch do next-connect:");
  console.log(publicErrorObject);

  response.status(500).json(publicErrorObject);
}

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

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
