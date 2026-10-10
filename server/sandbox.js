import { Worker } from "node:worker_threads";
export function runSandbox(input) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./worker.js", import.meta.url), {
      workerData: input,
      resourceLimits: {
        maxOldGenerationSizeMb: 96,
        maxYoungGenerationSizeMb: 16,
      },
      env: {},
    });
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error("Transformation exceeded the 5-second limit."));
    }, 5000);
    worker.once("message", (result) => {
      clearTimeout(timer);
      worker.terminate();
      result.error ? reject(new Error(result.error)) : resolve(result.rows);
    });
    worker.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    worker.once("exit", (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error("Transformation worker stopped."));
    });
  });
}
