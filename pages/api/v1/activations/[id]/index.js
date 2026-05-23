import { createRouter } from "next-connect";
import controller from "infra/controller";
import activation from "models/activation";
import authorization from "models/authorization";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:activation_token"), patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const userTryingToPatch = request.context.user;

  const activationTokenId = request.query.id;

  const validToken = await activation.findOneValidById(activationTokenId);

  await activation.activateUserByUserId(validToken.user_id);

  const usedToken = await activation.markTokenAsUsed(validToken.id);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPatch,
    "read:activation_token",
    usedToken,
  );

  return response.status(200).json(secureOutputValues);
}
