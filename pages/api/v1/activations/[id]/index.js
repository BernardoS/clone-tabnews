import { createRouter } from "next-connect";
import controller from "infra/controller";
import activation from "models/activation";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:activation_token"), patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const activationTokenId = request.query.id;

  const validToken = await activation.findOneValidById(activationTokenId);

  await activation.activateUserByUserId(validToken.user_id);

  const usedToken = await activation.markTokenAsUsed(validToken.id);

  return response.status(200).json(usedToken);
}
