import {Router} from "express";
import {authenticationMiddleware} from "../middlewares/authenticationMiddleware";

const router = Router();

router.use(authenticationMiddleware);
router.get("", function (req, res) {
	res.json("we came here haha");
});
export default router;
