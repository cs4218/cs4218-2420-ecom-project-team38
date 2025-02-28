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

export const emailErrorMsg =
  "Email should be a valid email address in the format example@example.com";

// Referenced from https://stackoverflow.com/questions/46155/how-can-i-validate-an-email-address-in-javascript
const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

export const isEmailValid = (email) => {
  return validateEmail(email) ? "" : emailErrorMsg;
};

export const isDOBValid = (formattedDOB) => {
  if (!formattedDOB instanceof Date || isNaN(formattedDOB)) {
    return "Invalid DOB: Please enter a valid date in the correct format";
  }
  const today = new Date();
  if (formattedDOB >= today) {
    return "Invalid DOB: Date must be before today's date";
  }
  return "";
};
