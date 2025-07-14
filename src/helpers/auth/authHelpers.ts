import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "supersecretkey"; // use env vars in production

export const createToken = (obj: object) => {
	return jwt.sign(obj, secret);
};
