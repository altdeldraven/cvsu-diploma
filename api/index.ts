import serverless from "serverless-http";
import app, { appReady } from "../server/index";

await appReady;

export default serverless(app);
