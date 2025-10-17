import { Client } from "pg";
import { ServiceError } from "./errors.js";

async function query(queryObject) {
  let client;

  try {
    client = await getNewClient();
    const result = await client.query(queryObject);
    return result;
  } catch (error) {
    const serviceErrorObject = new ServiceError({
      message: "Erro na conexão com o Banco ou na Query.",
      cause: error,
    });
    throw serviceErrorObject;
  } finally {
    await client?.end();
  }
}

async function getNewClient() {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: getSSLValues(),
  });
  await client.connect();
  return client;
}

async function getCurrentVersion() {
  const currentVersion = await query("SHOW server_version;");
  return currentVersion.rows[0].server_version;
}

async function getMaxConnections() {
  const currentVersion = await query("SHOW max_connections;");
  return currentVersion.rows[0].max_connections;
}

async function getOpenConnections(databaseName) {
  const openConnections = await query({
    text: "SELECT COUNT(*)::int FROM pg_stat_activity WHERE datname = $1;",
    values: [databaseName],
  });

  return openConnections.rows[0].count;
}

const database = {
  query,
  getCurrentVersion,
  getMaxConnections,
  getOpenConnections,
  getNewClient,
};

export default database;

function getSSLValues() {
  if (process.env.POSTGRES_CA) {
    return {
      ca: process.env.POSTGRES_CA,
    };
  }

  return process.env.NODE_ENV == "production" ? true : false;
}
