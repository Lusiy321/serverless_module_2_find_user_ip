import { Request, Response, Router } from "express";
import AuthController from "../controllers/authController";
import { userAuth } from "./user.auth.check";

const router = Router();

router.post("/sign-up", async (req: Request, res: Response) => {
  AuthController.signUp(req, res);
});

router.post("/sign-in", userAuth, async (req: Request, res: Response) => {
  AuthController.signIn(req, res);
});

router.get("/me", userAuth, async (req: Request, res: Response) => {
  AuthController.me(req, res);
});

export default router;
