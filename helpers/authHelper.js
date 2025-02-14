import bcrypt from "bcrypt";

export const hashPassword = async (password) => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

export const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

export const isPasswordValid = (password) => {
  return password && password.length >= 6
    ? ""
    : "Passsword should be at least 6 characters long";
};

export const isPhoneValid = (phone) => {
  return phone && /^[689]\d{7}$/.test(phone)
    ? ""
    : "Phone should be 8 digits long and begin with 6, 8 or 9";
};
