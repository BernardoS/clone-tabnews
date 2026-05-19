import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";
import activation from "models/activation";

const router = createRouter();

router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const activationTokenId = request.query.id;

  const validToken = await activation.findOneValidById(activationTokenId);

  const usedToken = await activation.markTokenAsUsed(validToken.id);

  await activation.activateUserByUserId(validToken.user_id);

  return response.status(200).json(usedToken);
}
