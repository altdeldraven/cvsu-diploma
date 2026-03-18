import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import serverless from "serverless-http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");

async function loadApp() {
  const distAppPath = path.join(projectRoot, "dist", "index.cjs");
  if (fs.existsSync(distAppPath)) {
    const distModule = await import(pathToFileURL(distAppPath).href);
    return {
      app: distModule.default,
      ready: Promise.resolve(),
    };
  }

  const sourceServerPath = path.join(projectRoot, "server", "index.ts");
  if (fs.existsSync(sourceServerPath)) {
    const sourceModule = await import(pathToFileURL(sourceServerPath).href);
    return {
      app: sourceModule.default,
      ready: sourceModule.appReady,
    };
  }

  throw new Error(`Could not locate built server at ${distAppPath} or source server at ${sourceServerPath}`);
}

const { app, ready } = await loadApp();
await ready;

export default serverless(app);
