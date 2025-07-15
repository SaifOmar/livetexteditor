import {Router} from "express";
import {home} from "../controllers/homeController";
import {login, register} from "../controllers/auth/authController";
import {getDocByUUID, getDocs, storeDoc} from "../controllers/docs/docsController";
import {authenticationMiddleware} from "../middlewares/authenticationMiddleware";

const router = Router();

router.get("/", home);
router.post("/login", login);
router.post("/register", register);

router.get("/docs", authenticationMiddleware, getDocs);
router.get("/docs/:uuid", authenticationMiddleware, getDocByUUID);
router.post("/docs/store", authenticationMiddleware, storeDoc);

// router.get("/docs", authenticationMiddleware, getDocs);
// router.get("/docs/:id", authenticationMiddleware, getDocById);
export default router;
