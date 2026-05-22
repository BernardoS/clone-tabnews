import webserver from "infra/webserver.js";
import activation from "models/activation.js";
import user from "models/user.js";
import { headers } from "next/headers";
import orchestrator from "tests/orchestrator.js";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  let createUserResponseBody;
  let emailActivationTokenId;
  let createSessionResponseBody;

  test("Create user account", async () => {
    const createUserResponse = await fetch(
      "http://localhost:3000/api/v1/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "RegistrationFlow",
          email: "registration.flow@bernardo.dev",
          password: "RegistrationFlowPassword",
        }),
      },
    );

    expect(createUserResponse.status).toBe(201);

    createUserResponseBody = await createUserResponse.json();

    expect(createUserResponseBody).toEqual({
      id: createUserResponseBody.id,
      username: "RegistrationFlow",
      features: ["read:activation_token"],
      created_at: createUserResponseBody.created_at,
      updated_at: createUserResponseBody.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@cinematab.com.br>");

    expect(lastEmail.recipients[0]).toBe("<registration.flow@bernardo.dev>");

    expect(lastEmail.subject).toBe("Ative seu cadastro no CinemaTab!");

    expect(lastEmail.text).toContain("RegistrationFlow");

    emailActivationTokenId = orchestrator.extractUUID(lastEmail.text);

    expect(lastEmail.text).toContain(
      `${webserver.origin}/cadastro/ativar/${emailActivationTokenId}`,
    );

    const validToken = await activation.findOneValidById(
      emailActivationTokenId,
    );

    expect(validToken.user_id).toBe(createUserResponseBody.id);

    expect(uuidVersion(validToken.id)).toBe(4);
  });

  test("Activate Account", async () => {
    const activationResponse = await fetch(
      `http://localhost:3000/api/v1/activations/${emailActivationTokenId}`,
      {
        method: "PATCH",
      },
    );

    expect(activationResponse.status).toBe(200);

    const activationResponseBody = await activationResponse.json();

    expect(Date.parse(activationResponseBody.used_at)).not.toBeNaN();

    const activatedUser = await user.findOneById(
      activationResponseBody.user_id,
    );

    expect(activatedUser.features).toEqual([
      "create:session",
      "read:session",
      "update:user",
    ]);
  });

  test("Login", async () => {
    const createSessionResponse = await fetch(
      "http://localhost:3000/api/v1/sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "registration.flow@bernardo.dev",
          password: "RegistrationFlowPassword",
        }),
      },
    );

    expect(createSessionResponse.status).toBe(201);

    createSessionResponseBody = await createSessionResponse.json();

    expect(createSessionResponseBody.user_id).toEqual(
      createUserResponseBody.id,
    );
  });

  test("Get user information", async () => {
    const userInfoResponse = await fetch("http://localhost:3000/api/v1/user", {
      headers: {
        Cookie: `session_id=${createSessionResponseBody.token}`,
      },
    });

    expect(userInfoResponse.status).toBe(200);

    const userInfoResponseResponseBody = await userInfoResponse.json();

    expect(userInfoResponseResponseBody).toEqual({
      id: createUserResponseBody.id,
      username: "RegistrationFlow",
      email: userInfoResponseResponseBody.email,
      password: userInfoResponseResponseBody.password,
      features: ["create:session", "read:session", "update:user"],
      created_at: createUserResponseBody.created_at,
      updated_at: userInfoResponseResponseBody.updated_at,
    });

    expect(uuidVersion(userInfoResponseResponseBody.id)).toBe(4);
    expect(Date.parse(userInfoResponseResponseBody.created_at)).not.toBeNaN();
    expect(Date.parse(userInfoResponseResponseBody.updated_at)).not.toBeNaN();
  });
});
