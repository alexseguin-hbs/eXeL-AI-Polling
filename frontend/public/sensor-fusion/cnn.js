/* Same detection path as Demo90/TFLite_detection_webcam.py, on a phone or a PC.
   Coral's edgetpu.tflite cannot run in a browser. This file runs detect.tflite. */
(function () {
  var CORE = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@4.22.0/dist/tf-core.min.js";
  var CPU = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-cpu@4.22.0/dist/tf-backend-cpu.min.js";
  var TFLITE = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.10/dist/tf-tflite.min.js";
  var WASM = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.10/wasm/";
  var BASE = "https://raw.githubusercontent.com/De-Risking-Strategies/SensorFusion/master/";
  var catalogPromise = null;
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

  function catalog() {
    if (!catalogPromise) {
      if (window.SF_CATALOG && window.SF_CATALOG.models) {
        catalogPromise = Promise.resolve(window.SF_CATALOG);
      } else {
        catalogPromise = fetch("/sensor-fusion/models.json").then(function (res) {
          if (!res.ok) throw new Error("The model list did not open.");
          return res.json();
        });
      }
    }
    return catalogPromise;
  }

  /* One label rule for every reader: a first line of ??? is dropped before the class number is looked up,
     as TFLite_detection_webcam.py does (del labels[0]). Class 0 is then person on Demo.90.
     A label map with no ??? first line is used as it is. */
  function labelList(text) {
    var labels = String(text || "").replace(/\r/g, "").split("\n").map(function (line) { return line.trim(); });
    if (labels.length && labels[labels.length - 1] === "") labels.pop();
    if (labels.length && labels[0] === "???") labels.shift();
    return labels;
  }

  async function load(id) {
    var data = await catalog();
    var row = (data.models || []).filter(function (item) { return item.id === id; })[0];
    if (!row || !row.remote) throw new Error("That model is not in the list.");
    var folder = row.remote;
    await ready();
    var labels = labelList(await (await fetch(BASE + folder + "labelmap.txt")).text());
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
      ? tf.tidy(function () { return tf.expandDims(tf.div(tf.sub(resized, 127.5), 127.5), 0); })
      : tf.tidy(function () { return tf.expandDims(tf.cast(tf.clipByValue(tf.round(resized), 0, 255), "int32"), 0); });
    var output = session.model.predict(input);
    pixels.dispose();
    resized.dispose();
    input.dispose();
    var tensors = asList(output, session.model);
    var boxes = await tensors[0].data();
    var classes = await tensors[1].data();
    var scores = await tensors[2].data();
    var count = scores.length;
    if (tensors[3]) {
      var counted = await tensors[3].data();
      var found = Math.round(counted[0]);
      if (found > 0 && found < count) count = found;
    }
    tensors.forEach(function (tensor) { if (tensor && tensor.dispose) tensor.dispose(); });
    var hits = [];
    for (var i = 0; i < count; i += 1) {
      var score = scores[i];
      if (score > 0.5 && score <= 1) {
        var classId = Math.round(classes[i]);
        var name = session.labels[classId] || "";
        if (!name || name === "???") continue;
        hits.push({
          ymin: boxes[i * 4],
          xmin: boxes[i * 4 + 1],
          ymax: boxes[i * 4 + 2],
          xmax: boxes[i * 4 + 3],
          score: score,
          name: name
        });
      }
    }
    return { hits: hits, fps: 1000 / Math.max(performance.now() - started, 1) };
  }

  function draw(canvas, video, result, showScores, showLabels, showFps) {
    var frameW = video.videoWidth || 640;
    var frameH = video.videoHeight || 480;
    var cssW = video.clientWidth || canvas.clientWidth || frameW;
    var cssH = video.clientHeight || canvas.clientHeight || frameH;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = Math.max(1, Math.round(cssW * dpr));
    var height = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    var pen = canvas.getContext("2d");
    if (!pen) return;
    pen.setTransform(1, 0, 0, 1, 0, 0);
    pen.clearRect(0, 0, width, height);
    var scale = Math.max(width / frameW, height / frameH);
    var originX = (width - frameW * scale) / 2;
    var originY = (height - frameH * scale) / 2;
    var fontPx = Math.round(15 * dpr);
    pen.lineWidth = Math.max(1, 2 * dpr);
    pen.font = "600 " + fontPx + "px sans-serif";
    var labelH = Math.round(fontPx * 1.25);
    result.hits.forEach(function (hit) {
      var x = originX + hit.xmin * frameW * scale;
      var y = originY + hit.ymin * frameH * scale;
      var w = Math.max(1, (hit.xmax - hit.xmin) * frameW * scale);
      var h = Math.max(1, (hit.ymax - hit.ymin) * frameH * scale);
      pen.strokeStyle = (getComputedStyle(document.documentElement).getPropertyValue("--sf-primary") || "#0cff00").trim() || "#0cff00";
      pen.strokeRect(x, y, w, h);
      var text = (showLabels ? hit.name : "") + (showScores ? (showLabels && hit.name ? " " : "") + Math.round(hit.score * 100) + "%" : "");
      if (text) {
        pen.fillStyle = "#ffffff";
        var pad = pen.measureText(text).width + Math.round(fontPx * 0.6);
        var top = Math.max(0, y - labelH);
        pen.fillRect(x, top, pad, labelH);
        pen.fillStyle = "#000000";
        pen.fillText(text, x + Math.round(fontPx * 0.3), top + Math.round(fontPx * 0.95));
      }
    });
    if (showFps) {
      pen.fillStyle = "#ffe600";
      pen.font = "600 " + fontPx + "px sans-serif";
      pen.fillText("FPS: " + result.fps.toFixed(2), fontPx, fontPx * 2);
    }
  }

  window.SFCnn = { load: load, detect: detect, draw: draw, labelList: labelList };
})();
