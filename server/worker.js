import { parentPort, workerData } from "node:worker_threads";
import { transform } from "./engine.js";
// Only a closed declarative plan is interpreted. No eval, generated JS, shell, or dynamic imports.
try {
  parentPort.postMessage({ rows: transform(workerData) });
} catch (error) {
  parentPort.postMessage({ error: error.message });
}
