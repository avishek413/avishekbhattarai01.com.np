import { copyFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
await copyFile(
  resolve(projectRoot, "dist", "index.html"),
  resolve(projectRoot, "index.html")
);
