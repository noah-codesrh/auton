import {
  Router,
  type NextFunction,
  type Request,
  type Response,
  type Router as RouterType,
} from "express";
import {
  authenticateApiKey,
  paymentRequired,
  proxyToOpenRouter,
  resolveComputeBalance,
} from "../services/gateway.js";
import { buildGatewayModelsList } from "../services/marketplace-catalog.js";
import { isAutonApiKey } from "../utils/apiKeys.js";

export const gatewayRouter: RouterType = Router();

gatewayRouter.get("/v1/models", async (_req, res, next) => {
  try {
    const models = await buildGatewayModelsList();
    res.json(models);
  } catch (error) {
    next(error);
  }
});

async function gatewayHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: {
          message: "Missing Bearer API key in Authorization header",
          type: "authentication_error",
          code: "invalid_api_key",
        },
      });
    }

    const apiKeyString = authHeader.slice("Bearer ".length).trim();

    if (!isAutonApiKey(apiKeyString)) {
      return res.status(401).json({
        error: {
          message: "Invalid Auton API key format",
          type: "authentication_error",
          code: "invalid_api_key",
        },
      });
    }

    const auth = await authenticateApiKey(apiKeyString);

    if (!auth) {
      return res.status(401).json({
        error: {
          message: "Invalid or inactive API key",
          type: "authentication_error",
          code: "invalid_api_key",
        },
      });
    }

    const body = req.body as Record<string, unknown>;
    const model = String(body.model ?? "");

    if (!model) {
      return res.status(400).json({
        error: {
          message: "Missing required field: model",
          type: "invalid_request_error",
          code: "missing_model",
        },
      });
    }

    const balanceResult = await resolveComputeBalance(auth.userId, model);

    if ("error" in balanceResult) {
      return paymentRequired(res, balanceResult.error);
    }

    await proxyToOpenRouter(req, res, {
      ...balanceResult,
      apiKeyId: auth.apiKeyId,
    });
  } catch (error) {
    next(error);
  }
}

gatewayRouter.all("/*splat", gatewayHandler);
