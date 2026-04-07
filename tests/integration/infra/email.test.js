import email from "infra/email.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await orchestrator.deleteAllEmails();

    await email.send({
      from: "CinemaTab <contato@cinematab.com.br>",
      to: "bernardo@cinematab.com.br",
      subject: "Teste de assunto",
      text: "Teste de corpo.",
    });

    await email.send({
      from: "CinemaTab <contato@cinematab.com.br>",
      to: "bernardo@cinematab.com.br",
      subject: "Último email enviado",
      text: "Corpo do último e-mail",
    });

    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@cinematab.com.br>");
    expect(lastEmail.recipients[0]).toBe("<bernardo@cinematab.com.br>");
    expect(lastEmail.subject).toBe("Último email enviado");
    expect(lastEmail.text).toBe("Corpo do último e-mail\r\n");
  });
});
