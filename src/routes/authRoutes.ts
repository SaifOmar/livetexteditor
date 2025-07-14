import {Router} from "express";
import {home} from "../controllers/homeController";
import {login, register} from "../controllers/auth/authController";

const router = Router();

router.get("/", home);
router.post("/login", login);
router.post("/register", register);

export default router;
