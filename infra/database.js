import { Client } from "pg";

async function query(queryObject) {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
  });

  console.log("Credênciais do postgres:", {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
  });

  try {
    await client.connect();
    const result = await client.query(queryObject);
    return result;
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    await client.end();
  }
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
  //,
  return openConnections.rows[0].count;
}

export default {
  query: query,
  getCurrentVersion: getCurrentVersion,
  getMaxConnections: getMaxConnections,
  getOpenConnections: getOpenConnections,
};
