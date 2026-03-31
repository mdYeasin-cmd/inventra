type UserRole = "Admin" | "Manager";

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}
