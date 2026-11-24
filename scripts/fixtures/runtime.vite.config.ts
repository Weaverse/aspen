import { fileURLToPath } from "node:url";
import { createAspenViteConfig } from "../../vite.config";
export default createAspenViteConfig({
  entry: fileURLToPath(new URL("./runtime-worker.ts", import.meta.url)),
});
