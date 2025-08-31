import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <DatabaseInfo />
    </>
  );
}

function UpdatedAt() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let updatedAtText = "Carregando...";

  if (!isLoading && data) {
    updatedAtText = new Date(data.updated_at).toLocaleString("pt-BR");
  }

  return (
    <div>
      <b>Última atualização:</b> {updatedAtText}
    </div>
  );
}

function DatabaseInfo() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let databaseVersionText = "Carregando...";
  let databaseMaxConnectionsText = "Carregando...";
  let databaseOpenConnectionstionText = "Carregando...";

  if (!isLoading && data) {
    let databaseInfo = data.dependencies.database;

    databaseVersionText = databaseInfo.version.toString();
    databaseMaxConnectionsText = databaseInfo.max_connections.toString();
    databaseOpenConnectionstionText =
      databaseInfo.opened_connections.toString();
  }

  return (
    <div>
      <span>
        <b>Banco de Dados:</b>
      </span>
      <ul>
        <li>Versão:{databaseVersionText}</li>
        <li>Limite de conexões:{databaseMaxConnectionsText}</li>
        <li>Conexões abertas:{databaseOpenConnectionstionText}</li>
      </ul>
    </div>
  );
}
