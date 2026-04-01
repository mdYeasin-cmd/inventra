import AppError from "../../errors/AppError";
import { comparePassword, hashPassword } from "../../utils/bcrypt";
import { IUser } from "../User/user.interface";
import { User } from "../User/user.model";
import httpStatus from "http-status";
import { ILoginUser } from "./auth.interface";
import { createToken } from "../../utils/jwtUtil";

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

const loginUserIntoDB = async (loginData: ILoginUser) => {
  const { email, password } = loginData;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, "This user is not found!");
  }

  const isPasswordMatched = await comparePassword(password, user.password);

  if (!isPasswordMatched) {
    throw new AppError(httpStatus.FORBIDDEN, "Password do not matched!");
  }

  const jwtPayload = {
    userId: user?._id,
    name: user?.name,
    role: user?.role,
  };

  const accessToken = createToken(jwtPayload, 60 * 60); // 1 hour

  const refreshToken = createToken(jwtPayload, 7 * 24 * 60 * 60); // 7 days

  return {
    accessToken,
    refreshToken,
  };
};

export const AuthServices = {
  signupUserIntoDB,
  loginUserIntoDB,
};
