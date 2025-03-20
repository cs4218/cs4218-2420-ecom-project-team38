import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "child_process";

export default async function globalSetup() {
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  process.env.MONGO_URL = mongoUri;

  const serverProcess = spawn("npm", ["run", "server"], {
    shell: true,
    env: { ...process.env, MONGO_URL: mongoUri },
  });

  global.__MONGO_SERVER__ = mongoServer;
  global.__SERVER_PROCESS__ = serverProcess;
}
