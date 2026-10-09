// scripts/start.js
// `npm start` is also what PaaS hosts (DigitalOcean App Platform, Heroku) run, with
// NODE_ENV=production. Booting the craco dev server there compiles the whole app in
// memory (CPU/RAM spike, OOM restarts) and ships React Refresh into a production
// bundle (blank page). So in production serve the prebuilt `build/` folder instead;
// everywhere else keep the normal dev server.
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const isProduction = process.env.NODE_ENV === "production";

let args;
if (isProduction) {
  if (!fs.existsSync(path.join(root, "build", "index.html"))) {
    console.error(
      "[start] NODE_ENV=production but build/index.html is missing. " +
        "Run `npm run build` as the build step before `npm start`."
    );
    process.exit(1);
  }
  const port = process.env.PORT || "3000";
  console.log(`[start] Serving production build on port ${port}`);
  args = [require.resolve("serve/build/main.js"), "-s", "build", "-l", port];
} else {
  args = [require.resolve("@craco/craco/dist/bin/craco.js"), "start"];
}

const child = spawn(process.execPath, args, { cwd: root, stdio: "inherit" });

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => child.kill(signal));
});
child.on("exit", (code, signal) => process.exit(signal ? 1 : code));
