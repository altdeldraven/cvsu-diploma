import fs from "fs";
import path from "path";
import serverless from "serverless-http";

async function loadApp() {
  const distAppPath = path.join(process.cwd(), "dist", "index.cjs");

  if (fs.existsSync(distAppPath)) {
    const distModule = await import(distAppPath);
    return {
      app: distModule.default,
      ready: Promise.resolve(),
    };
  }

  const sourceModule = await import("../server/index.js");
  return {
    app: sourceModule.default,
    ready: sourceModule.appReady,
  };
}

const { app, ready } = await loadApp();
await ready;

export default serverless(app);
