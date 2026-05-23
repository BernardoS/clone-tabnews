import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";
import activation from "models/activation";
import user from "models/user.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/activations/[id]", () => {
  describe("Anonymous user", () => {
    test("With noexistent token", async () => {
      const activationResponse = await fetch(
        `http://localhost:3000/api/v1/activations/78ab8d58-5ff8-4367-b769-0409d9becd7b`,
        {
          method: "PATCH",
        },
      );

      expect(activationResponse.status).toBe(404);

      const responseBody = await activationResponse.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message:
          "O token de ativação não foi encontrado no sistema ou expirado.",
        action:
          "Verifique se este usuário realizou o cadastro e tente novamente.",
        status_code: 404,
      });
    });

    test("With expired token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - activation.EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser();

      const expiredActivationToken = await activation.create(createdUser.id);

      jest.useRealTimers();

      const activationResponse = await fetch(
        `http://localhost:3000/api/v1/activations/${expiredActivationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(activationResponse.status).toBe(404);

      const responseBody = await activationResponse.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message:
          "O token de ativação não foi encontrado no sistema ou expirado.",
        action:
          "Verifique se este usuário realizou o cadastro e tente novamente.",
        status_code: 404,
      });
    });

    test("With already used token", async () => {
      const createdUser = await orchestrator.createUser();

      const expiredActivationToken = await activation.create(createdUser.id);

      const firstActivationResponse = await fetch(
        `http://localhost:3000/api/v1/activations/${expiredActivationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(firstActivationResponse.status).toBe(200);

      const secondActivationResponse = await fetch(
        `http://localhost:3000/api/v1/activations/${expiredActivationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(secondActivationResponse.status).toBe(404);

      const responseBody = await secondActivationResponse.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message:
          "O token de ativação não foi encontrado no sistema ou expirado.",
        action:
          "Verifique se este usuário realizou o cadastro e tente novamente.",
        status_code: 404,
      });
    });

    test("With a valid token", async () => {
      const createdUser = await orchestrator.createUser();

      const activationToken = await activation.create(createdUser.id);

      const activationResponse = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(activationResponse.status).toBe(200);

      const responseBody = await activationResponse.json();

      expect(responseBody).toEqual({
        id: activationToken.id,
        used_at: responseBody.used_at,
        user_id: activationToken.user_id,
        expires_at: activationToken.expires_at.toISOString(),
        created_at: activationToken.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(uuidVersion(responseBody.user_id)).toBe(4);

      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const expiresAt = new Date(responseBody.expires_at);
      const createdAt = new Date(responseBody.created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      expect(expiresAt - createdAt).toBe(activation.EXPIRATION_IN_MILLISECONDS);

      const activatedUser = await user.findOneById(responseBody.user_id);

      expect(activatedUser.features).toEqual([
        "create:session",
        "read:session",
        "update:user",
      ]);
    });

    test("With a valid token but already activated user", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser.id);
      const activationToken = await activation.create(createdUser.id);

      const activationResponse = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(activationResponse.status).toBe(403);

      const responseBody = await activationResponse.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não pode mais utilizar tokens de ativação.",
        action: "Entre em contato com o suporte.",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With valid token, but already logged in user", async () => {
      const user1 = await orchestrator.createUser();
      await orchestrator.activateUser(user1.id);
      const user1SessionObject = await orchestrator.createSession(user1.id);

      const user2 = await orchestrator.createUser();
      const user2ActivationToken = await activation.create(user2.id);

      const activationResponse = await fetch(
        `http://localhost:3000/api/v1/activations/${user2ActivationToken.id}`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${user1SessionObject.token}`,
          },
        },
      );

      expect(activationResponse.status).toBe(403);

      const responseBody = await activationResponse.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar essa ação.",
        action:
          'Verifique se o seu usuário possui a feature "read:activation_token".',
        status_code: 403,
      });
    });
  });
});
