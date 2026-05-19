import email from "infra/email.js";
import database from "infra/database.js";
import webserver from "infra/webserver.js";
import { NotFoundError } from "infra/errors.js";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 Minutes

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          user_activation_tokens (user_id, expires_at)
        VALUES
          ($1, $2)
        RETURNING
          *`,
      values: [userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "CinemaTab <contato@cinematab.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no CinemaTab!",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no CinemaTab:

${webserver.origin}/cadastro/ativar/${activationToken.id}
    `,
  });
}

async function FindOneByUserId(userId) {
  const tokenFound = await runSelectQuery(userId);

  return tokenFound;

  async function runSelectQuery(userId) {
    const result = await database.query({
      text: `SELECT
                *
             FROM 
                user_activation_tokens
             WHERE
                user_id = $1
             LIMIT 
                1
             
          ;`,
      values: [userId],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
      });
    }

    return result.rows[0];
  }
}

const activation = {
  sendEmailToUser,
  create,
  FindOneByUserId,
};

export default activation;
