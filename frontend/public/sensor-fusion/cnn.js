/* Same detection path as Demo90/TFLite_detection_webcam.py, on a phone or a PC.
   Coral's edgetpu.tflite cannot run in a browser. This file runs detect.tflite. */
(function () {
  var CORE = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@4.22.0/dist/tf-core.min.js";
  var CPU = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-cpu@4.22.0/dist/tf-backend-cpu.min.js";
  var TFLITE = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.10/dist/tf-tflite.min.js";
  var WASM = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.10/dist/";
  var BASE = "https://raw.githubusercontent.com/De-Risking-Strategies/SensorFusion/master/";
  var FOLDERS = {
    demo90: "Demo90/Sample_TFLite_model/",
    deer: "PreLoadedModels/Model01.Deer/Sample_TFLite_model/",
    head: "PreLoadedModels/Model02.Head/Sample_TFLite_model/",
    eyes: "PreLoadedModels/Model03.Eyes/Sample_TFLite_model/",
    tree: "PreLoadedModels/Model04.Tree/Sample_TFLite_model/",
    custom01: "PreLoadedModels/Custom.01/Sample_TFLite_model/",
    custom02: "PreLoadedModels/Custom.02/Sample_TFLite_model/",
    custom03: "PreLoadedModels/Custom.03/Sample_TFLite_model/",
    custom04: "PreLoadedModels/Custom.04/Sample_TFLite_model/",
    checkid: "checkid/Sample_TFLite_model/",
    thermal01: "thermal01/Sample_TFLite_model/"
  };
  var readyPromise = null;

  function script(src) {
    return new Promise(function (resolve, reject) {
      var found = document.querySelector('script[src="' + src + '"]');
      if (found) {
        resolve();
        return;
      }
      var tag = document.createElement("script");
      tag.src = src;
      tag.async = true;
      tag.onload = function () { resolve(); };
      tag.onerror = function () { reject(new Error("Could not load the model runner.")); };
      document.head.appendChild(tag);
    });
  }

  function ready() {
    if (!readyPromise) {
      readyPromise = script(CORE).then(function () { return script(CPU); }).then(function () { return script(TFLITE); }).then(function () {
        return window.tf.setBackend("cpu").then(function () { return window.tf.ready(); });
      }).then(function () {
        if (window.tflite && window.tflite.setWasmPath) window.tflite.setWasmPath(WASM);
      });
    }
    return readyPromise;
  }

  function asList(output, model) {
    if (!output) return [];
    if (output.shape) return [output];
    var names = (model.outputs || []).map(function (item) { return item.name; });
    var fromNames = names.map(function (name) { return output[name]; }).filter(Boolean);
    if (fromNames.length) return fromNames;
    return Object.keys(output).map(function (key) { return output[key]; });
  }

  async function load(id) {
    var folder = FOLDERS[id];
    if (!folder) throw new Error("That model is not in the list.");
    await ready();
    var labelText = await (await fetch(BASE + folder + "labelmap.txt")).text();
    var labels = labelText.replace(/\r/g, "").split("\n").map(function (line) { return line.trim(); });
    if (labels.length && labels[labels.length - 1] === "") labels.pop();
    var model = await window.tflite.loadTFLiteModel(BASE + folder + "detect.tflite");
    var shape = model.inputs[0].shape;
    return {
      model: model,
      labels: labels,
      height: shape[1],
      width: shape[2],
      dtype: String(model.inputs[0].dtype || "")
    };
  }

  async function detect(session, video) {
    var tf = window.tf;
    var started = performance.now();
    var pixels = tf.browser.fromPixels(video);
    var resized = tf.image.resizeBilinear(pixels, [session.height, session.width]);
    var input = session.dtype.indexOf("float") >= 0
      ? resized.sub(127.5).div(127.5).expandDims(0)
      : resized.round().clipByValue(0, 255).cast("int32").expandDims(0);
    var output = session.model.predict(input);
    pixels.dispose();
    resized.dispose();
    input.dispose();
    var tensors = asList(output, session.model);
    var boxes = await tensors[0].data();
    var classes = await tensors[1].data();
    var scores = await tensors[2].data();
    tensors.forEach(function (tensor) { if (tensor && tensor.dispose) tensor.dispose(); });
    var hits = [];
    var count = scores.length;
    for (var i = 0; i < count; i += 1) {
      var score = scores[i];
      if (score > 0.5 && score <= 1) {
        var classId = Math.round(classes[i]);
        hits.push({
          ymin: boxes[i * 4],
          xmin: boxes[i * 4 + 1],
          ymax: boxes[i * 4 + 2],
          xmax: boxes[i * 4 + 3],
          score: score,
          name: session.labels[classId] || "???"
        });
      }
    }
    return { hits: hits, fps: 1000 / Math.max(performance.now() - started, 1) };
  }

  function draw(canvas, video, result, showScores, showLabels, showFps) {
    var width = video.videoWidth || canvas.clientWidth || 640;
    var height = video.videoHeight || canvas.clientHeight || 480;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    var pen = canvas.getContext("2d");
    if (!pen) return;
    pen.clearRect(0, 0, width, height);
    pen.lineWidth = 3;
    pen.font = "24px sans-serif";
    result.hits.forEach(function (hit) {
      var x = Math.max(1, hit.xmin * width);
      var y = Math.max(1, hit.ymin * height);
      var w = Math.max(1, (hit.xmax - hit.xmin) * width);
      var h = Math.max(1, (hit.ymax - hit.ymin) * height);
      pen.strokeStyle = "#0cff00";
      pen.strokeRect(x, y, w, h);
      var text = (showLabels ? hit.name : "") + (showScores ? (showLabels && hit.name ? " " : "") + Math.round(hit.score * 100) + "%" : "");
      if (text) {
        pen.fillStyle = "#ffffff";
        var pad = pen.measureText(text).width + 8;
        pen.fillRect(x, Math.max(0, y - 28), pad, 28);
        pen.fillStyle = "#000000";
        pen.fillText(text, x + 4, Math.max(20, y - 6));
      }
    });
    if (showFps) {
      pen.fillStyle = "#ffe600";
      pen.fillText("FPS: " + result.fps.toFixed(2), 30, 50);
    }
  }

  window.SFCnn = { load: load, detect: detect, draw: draw };
})();
