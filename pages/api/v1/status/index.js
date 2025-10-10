import database from "infra/database.js";
import { InternalServerError } from "infra/errors";

async function status(request, response) {
  try {
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
  } catch (error) {
    const publicErrorObject = new InternalServerError({
      cause: error,
    });

    console.log("\nErro dentro deo catch do controller");
    console.log(publicErrorObject);

    response.status(500).json(publicErrorObject);
  }
}

export default status;
