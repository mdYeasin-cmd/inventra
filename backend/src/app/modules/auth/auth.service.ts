import type { IUser } from "../User/user.interface.js";

const signupUserIntoDB = async (userData: IUser) => {
  // Implement the logic to save user data into the database
  // This is a placeholder function and should be replaced with actual database logic
  return {
    id: "12345",
    ...userData,
  };
};

export const AuthServices = {
  signupUserIntoDB,
};
