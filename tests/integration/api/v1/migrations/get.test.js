import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Retrieving pending migrations", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations");
      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar essa ação.",
        action:
          'Verifique se o seu usuário possui a feature "read:migrations".',
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("Retrieving pending migrations", async () => {
      const defaultUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(defaultUser.id);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar essa ação.",
        action:
          'Verifique se o seu usuário possui a feature "read:migrations".',
        status_code: 403,
      });
    });
  });

  describe("Privileged user", () => {
    test("With `read:migrations` retrieving pending migrations", async () => {
      const privilegedUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(privilegedUser.id);

      await orchestrator.addFeaturesToUser(privilegedUser.id, [
        "read:migrations",
      ]);

      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(Array.isArray(responseBody)).toBe(true);
    });
  });
});
