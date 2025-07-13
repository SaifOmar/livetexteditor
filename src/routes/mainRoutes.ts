import { Router } from "express";
import { home } from "../controllers/homeController";
import { login, register } from "../controllers/auth/authController";
import jwt from "jsonwebtoken";

const router = Router();

router.get("/", home);
router.post("/login", login);
router.post("/register", register);
router.post("/verify", function (req, res) {
  const token = req.headers.authorization;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
      if (err) {
        res.status(401).json("Unauthorized");
      } else {
        res.status(200).json("Authorized");
      }
    });
  }
});

export default router;
