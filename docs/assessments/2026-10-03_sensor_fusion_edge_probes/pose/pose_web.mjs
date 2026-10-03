// The same Pose.01 folder in the browser runtime the app already loads (tfjs-tflite 0.0.1-alpha.10, functional calls).
import { chromium } from "/home/user/eXeL-AI-Polling/frontend/node_modules/playwright/index.mjs";
import fs from "node:fs"; import path from "node:path";
const NM = process.env.SCRATCH + "/tfjsprobe/node_modules/@tensorflow", HOME = process.env.SCRATCH + "/pose/home", IMG = process.env.SCRATCH + "/bench/img/zidane.jpg";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" }); const p = await b.newPage();
await p.route("**/*", (r) => { const u = new URL(r.request().url()); let f = null;
  if (u.pathname === "/") return r.fulfill({ status: 200, contentType: "text/html", body: '<!doctype html><img id=i src="/z.jpg"><script src="/lib/tfjs-core/dist/tf-core.min.js"></script><script src="/lib/tfjs-backend-cpu/dist/tf-backend-cpu.min.js"></script><script src="/lib/tfjs-tflite/dist/tf-tflite.min.js"></script>' });
  if (u.pathname.startsWith("/lib/")) f = path.join(NM, u.pathname.slice(5)); else if (u.pathname.startsWith("/m/")) f = path.join(HOME, u.pathname.slice(3)); else if (u.pathname === "/z.jpg") f = IMG;
  if (f && fs.existsSync(f)) return r.fulfill({ status: 200, body: fs.readFileSync(f), headers: { "content-type": f.endsWith(".wasm") ? "application/wasm" : f.endsWith(".js") ? "text/javascript" : "application/octet-stream" } });
  return r.fulfill({ status: 404, body: "" }); });
await p.goto("https://sf.local/"); await p.waitForFunction(() => window.tflite && document.getElementById("i").complete);
const r = await p.evaluate(async () => { await tf.setBackend("cpu"); await tf.ready(); tflite.setWasmPath("/lib/tfjs-tflite/wasm/");
  const names = (await (await fetch("/m/Pose.01/Sample_TFLite_model/labelmap.txt")).text()).trim().split("\n");
  const m = await tflite.loadTFLiteModel("/m/Pose.01/Sample_TFLite_model/detect.tflite"); const sh = m.inputs[0].shape;
  const t0 = performance.now(); const x = tf.tidy(() => tf.expandDims(tf.cast(tf.image.resizeBilinear(tf.browser.fromPixels(document.getElementById("i")), [sh[1], sh[2]]), "int32"), 0));
  let out = m.predict(x); x.dispose(); if (!out.shape) out = Object.values(out)[0]; const k = await out.data(); out.dispose();
  const kp = []; for (let i = 0; i < 17; i++) if (k[i * 3 + 2] > 0.3) kp.push([names[i], +k[i * 3 + 1].toFixed(2), +k[i * 3].toFixed(2), +k[i * 3 + 2].toFixed(2)]);
  return { input: sh, outShape: [1, 1, 17, 3], ms: Math.round(performance.now() - t0), keypoints: kp, leaked: tf.memory().numTensors }; });
console.log(JSON.stringify(r)); await b.close();
