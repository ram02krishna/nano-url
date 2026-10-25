import jwt from "jsonwebtoken";
import { userTokenSchema } from "../validation/token.validation.js";

function getSecret() {
	const secret = process.env.JWT_SECRET;
	if (!secret) {
		throw new Error("JWT_SECRET is not defined in the environment variables");
	}
	return secret;
}

export async function createUserToken(payload) {
	const secret = getSecret();
	const validationResult = await userTokenSchema.safeParseAsync(payload);

	if (validationResult.error) throw new Error(validationResult.error.message);

	const payloadValidatedData = validationResult.data;

	const token = jwt.sign(payloadValidatedData, secret, { expiresIn: "7d" });
	return token;
}

export async function validateToken(token) {
	try {
		const secret = getSecret();
		const decoded = jwt.verify(token, secret);
		const validationResult = await userTokenSchema.safeParseAsync(decoded);
		if (validationResult.error) {
			return { error: validationResult.error.message };
		}
		return { data: validationResult.data };
	} catch (error) {
		return { error: error.message };
	}
}
