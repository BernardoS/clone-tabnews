import email from "infra/email.js";
import database from "infra/database.js";
import webserver from "infra/webserver.js";
import { ForbiddenError, NotFoundError } from "infra/errors.js";
import user from "./user";
import authorization from "./authorization";

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

async function findOneValidById(tokenId) {
  const tokenFound = await runSelectQuery(tokenId);

  return tokenFound;

  async function runSelectQuery(tokenId) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          user_activation_tokens 
        WHERE
          id = $1
          AND used_at is null
          AND expires_at > NOW()
        LIMIT
          1`,
      values: [tokenId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message:
          "O token de ativação não foi encontrado no sistema ou expirado.",
        action:
          "Verifique se este usuário realizou o cadastro e tente novamente.",
      });
    }

    return results.rows[0];
  }
}

async function markTokenAsUsed(tokenId) {
  const updatedToken = await runUpdateQuery(tokenId);

  return updatedToken;

  async function runUpdateQuery(tokenId) {
    const result = await database.query({
      text: `
      UPDATE
        user_activation_tokens
      SET
        used_at = timezone('utc',NOW()),
        updated_at = timezone('utc',NOW())
      WHERE 
        id = $1
      RETURNING
        *
      `,
      values: [tokenId],
    });

    return result.rows[0];
  }
}

async function activateUserByUserId(userId) {
  const userToActive = await user.findOneById(userId);

  if (!authorization.can(userToActive, "read:activation_token")) {
    throw new ForbiddenError({
      message: "Você não pode mais utilizar tokens de ativação.",
      action: "Entre em contato com o suporte.",
    });
  }

  const activatedUser = await user.setFeatures(userId, [
    "create:session",
    "read:session",
    "update:user",
  ]);

  return activatedUser;
}

const activation = {
  sendEmailToUser,
  create,
  findOneValidById,
  markTokenAsUsed,
  activateUserByUserId,
  EXPIRATION_IN_MILLISECONDS,
};

export default activation;
