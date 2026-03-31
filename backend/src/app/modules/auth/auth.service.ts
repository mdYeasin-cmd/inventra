import AppError from "../../errors/AppError";
import { hashPassword } from "../../utils/bcrypt";
import { IUser } from "../User/user.interface";
import { User } from "../User/user.model";
import httpStatus from "http-status";

const signupUserIntoDB = async (userData: IUser) => {
  const { name, email, password } = userData;

  const isUserExist = await User.findOne({ email });

  if (isUserExist) {
    throw new AppError(httpStatus.CONFLICT, "User already exists");
  }

  const hashedPassword = await hashPassword(password);

  const userCreationData = {
    name,
    email,
    password: hashedPassword,
  };

  const user = await User.create(userCreationData);

  const userObject = user.toObject();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...userWithoutPassword } = userObject;

  return userWithoutPassword;
};

export const AuthServices = {
  signupUserIntoDB,
};
