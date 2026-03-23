/** @format */

import { User } from "../types/user.types";

export async function getCurrentUser(): Promise<User> {
  // Replace with real auth logic
  return {
    id: "1",
    fullName: "Farqleet Ahmed",
    email: "farqleet@example.com",
    role: "APPLICANT",
    avatar: null,
  };
}
