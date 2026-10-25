import { db } from "../db/index.js";
import { usersTable } from "../models/user.model.js";

export async function createNewUser({
  firstname,
  lastname,
  email,
  salt,
  hashedPassword,
  otp,
  otpExpiry,
}) {
  const [user] = await db
    .insert(usersTable)
    .values({
      firstname,
      lastname,
      email,
      salt,
      password: hashedPassword,
      isVerified: false,
      otp,
      otpExpiry,
    })
    .returning({
      id: usersTable.id,
    });

  return user; 
}
