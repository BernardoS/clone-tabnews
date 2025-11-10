import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With exact case match", async () => {
      const firstResponse = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "MesmoCase",
          email: "mesmo.case@gmail.com",
          password: "senha123",
        }),
      });

      expect(firstResponse.status).toBe(201);

      const secondResponse = await fetch(
        "http://localhost:3000/api/v1/users/MesmoCase",
      );

      expect(secondResponse.status).toBe(200);

      const secondResponseBody = await secondResponse.json();

      expect(secondResponseBody).toEqual({
        id: secondResponseBody.id,
        username: "MesmoCase",
        email: "mesmo.case@gmail.com",
        password: "senha123",
        created_at: secondResponseBody.created_at,
        updated_at: secondResponseBody.updated_at,
      });

      expect(uuidVersion(secondResponseBody.id)).toBe(4);
      expect(Date.parse(secondResponseBody.created_at)).not.toBeNaN();
      expect(Date.parse(secondResponseBody.updated_at)).not.toBeNaN();
    });

    test("With exact case mismatch", async () => {
      const firstResponse = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "CaseDiferente",
          email: "case.diferente@gmail.com",
          password: "senha123",
        }),
      });

      expect(firstResponse.status).toBe(201);

      const secondResponse = await fetch(
        "http://localhost:3000/api/v1/users/casediferente",
      );

      expect(secondResponse.status).toBe(200);

      const secondResponseBody = await secondResponse.json();

      expect(secondResponseBody).toEqual({
        id: secondResponseBody.id,
        username: "CaseDiferente",
        email: "case.diferente@gmail.com",
        password: "senha123",
        created_at: secondResponseBody.created_at,
        updated_at: secondResponseBody.updated_at,
      });

      expect(uuidVersion(secondResponseBody.id)).toBe(4);
      expect(Date.parse(secondResponseBody.created_at)).not.toBeNaN();
      expect(Date.parse(secondResponseBody.updated_at)).not.toBeNaN();
    });

    test("With nonexistent username", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/usuarioInexistente",
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
        status_code: 404,
      });
    });
  });
});
