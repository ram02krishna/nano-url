import express from "express";
import { randomInt, timingSafeEqual } from "crypto";
import {
  signupPostRequestBodySchema,
  loginPostRequestBodySchema,
  forgotPasswordSchema,
  resendOtpSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../validation/request.validation.js";
import { ensureAuthenticated } from "../middlewares/auth.middleware.js";
import { hashPasswordWithSalt } from "../utils/hash.js";
import { getUserByEmail } from "../services/user.service.js";
import { createNewUser } from "../services/newuser.service.js";
import { createUserToken } from "../utils/token.js";
import { sendOTPEmail } from "../utils/email.js";
import { db } from "../db/index.js";
import { usersTable } from "../models/user.model.js";
import { eq } from "drizzle-orm";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = express.Router();

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

const generateOtp = () => randomInt(100000, 1000000).toString();

// Constant-time OTP comparison
const otpMatches = (stored, provided) => {
  if (!stored || typeof provided !== "string") return false;
  const a = Buffer.from(stored);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
};

router.post(
  "/signup",
  validate(signupPostRequestBodySchema),
  asyncHandler(async (req, res) => {
    const { firstname, lastname, email, password } = req.body;

    let oldUser = await getUserByEmail(email);

    if (oldUser) {
      return res.status(400).json({
        error: `User with email ${email} already exists!`,
      });
    }

    let { salt, password: hash } = hashPasswordWithSalt(password);

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + OTP_TTL_MS);

    const user = await createNewUser({
      firstname,
      lastname,
      email,
      salt,
      hashedPassword: hash,
      otp,
      otpExpiry,
    });

    const emailSent = await sendOTPEmail(email, otp);

    if (!emailSent) {
      return res.status(500).json({
        error: "User created, but the verification email could not be sent. Please try again later or contact support.",
      });
    }

    return res.status(201).json({
      message: "User created, OTP sent to email",
      data: {
        userId: user.id,
      },
    });
  })
);

router.post(
  "/login",
  validate(loginPostRequestBodySchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    let user = await getUserByEmail(email);

    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        error: "Account not verified. Please verify your email first.",
      });
    }

    let { password: hash } = hashPasswordWithSalt(
      password,
      user.salt
    );

    if (user.password !== hash) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    let token = await createUserToken({ id: user.id });

    return res.json({ token });
  })
);

router.post(
  "/verify-email",
  asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: "User already verified" });
    }

    if (!otpMatches(user.otp, otp)) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date() > new Date(user.otpExpiry)) {
      return res.status(400).json({ error: "OTP expired. Please register again or request new OTP." });
    }

    await db
      .update(usersTable)
      .set({
        isVerified: true,
        otp: null,
        otpExpiry: null,
      })
      .where(eq(usersTable.id, user.id));

    let token = await createUserToken({ id: user.id });

    return res.json({
      message: "Email verified successfully",
      token
    });
  })
);

router.post(
  "/resend-otp",
  validate(resendOtpSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await getUserByEmail(email);
    const generic = { message: "If that account is awaiting verification, a new code has been sent." };

    // Don't reveal whether the account exists / is already verified
    if (!user || user.isVerified) return res.status(200).json(generic);

    // Cooldown: the current OTP was issued at (otpExpiry - OTP_TTL_MS)
    const issuedAt = user.otpExpiry ? new Date(user.otpExpiry).getTime() - OTP_TTL_MS : 0;
    const waitMs = issuedAt + OTP_RESEND_COOLDOWN_MS - Date.now();
    if (waitMs > 0) {
      return res.status(429).json({
        error: `Please wait ${Math.ceil(waitMs / 1000)}s before requesting a new code.`,
        retryAfter: Math.ceil(waitMs / 1000),
      });
    }

    const otp = generateOtp();
    await db
      .update(usersTable)
      .set({ otp, otpExpiry: new Date(Date.now() + OTP_TTL_MS) })
      .where(eq(usersTable.id, user.id));

    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      return res.status(500).json({ error: "The verification email could not be sent. Please try again later." });
    }
    return res.status(200).json(generic);
  })
);

router.get(
  "/me",
  ensureAuthenticated,
  asyncHandler(async (req, res) => {
    const { id, firstname, lastname, email } = req.user;
    return res.json({ id, firstname, lastname, email });
  })
);

router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    let user = await getUserByEmail(email);

    if (!user) {
      
      return res.status(200).json({ message: "If that email is registered, you will receive a reset OTP shortly." });
    }

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + OTP_TTL_MS);

    await db
      .update(usersTable)
      .set({
        otp,
        otpExpiry,
      })
      .where(eq(usersTable.id, user.id));

    const emailSent = await sendOTPEmail(email, otp);

    if (!emailSent) {
      return res.status(500).json({
        error: "The reset OTP could not be sent right now. Please try again later.",
      });
    }

    return res.status(200).json({ message: "If that email is registered, you will receive a reset OTP shortly." });
  })
);

router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(400).json({ error: "Invalid request." });
    }

    if (!otpMatches(user.otp, otp)) {
      return res.status(400).json({ error: "Invalid OTP." });
    }

    if (new Date() > new Date(user.otpExpiry)) {
       return res.status(400).json({ error: "OTP has expired." });
    }

    let { salt, password: hash } = hashPasswordWithSalt(newPassword);

    await db
      .update(usersTable)
      .set({
        salt,
        password: hash,
        otp: null,
        otpExpiry: null,
      })
      .where(eq(usersTable.id, user.id));

    return res.status(200).json({ message: "Password reset successfully. You can now log in." });
  })
);

router.post(
  "/change-password",
  ensureAuthenticated,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await getUserByEmail(req.user.email); 

    if (!user) {
      return res.status(400).json({ error: "User not found." });
    }

    let { password: oldHash } = hashPasswordWithSalt(oldPassword, user.salt);

    if (user.password !== oldHash) {
      return res.status(400).json({ error: "Incorrect old password." });
    }

    let { salt: newSalt, password: newHash } = hashPasswordWithSalt(newPassword);

    await db
      .update(usersTable)
      .set({
        salt: newSalt,
        password: newHash,
      })
      .where(eq(usersTable.id, user.id));

    return res.status(200).json({ message: "Password changed successfully." });
  })
);

export default router;
