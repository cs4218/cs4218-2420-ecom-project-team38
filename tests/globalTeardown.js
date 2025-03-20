import mongoose from "mongoose";

export default async function globalTeardown() {
  mongoose.disconnect();
  global.__MONGO_SERVER__.stop();
  global.__SERVER_PROCESS__.kill();
}
