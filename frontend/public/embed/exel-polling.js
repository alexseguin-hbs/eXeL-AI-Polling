/**
 * eXeL AI Polling — Full-Embed Web Component (SDK).
 *
 * Drop-in, framework-free. A consumer includes this script and writes:
 *
 *   <script src="https://exel-ai-polling.../embed/exel-polling.js"></script>
 *   <exel-polling code="DEMO2026" host="https://exel-ai-polling.explore-096.workers.dev"></exel-polling>
 *
 * It renders the polling session in a sandboxed iframe and bridges the iframe's
 * postMessage events up to the host page as CustomEvents (`exel:ready`,
 * `exel:response`, `exel:themes-ready`, `exel:ranking-complete`, `exel:resize`).
 * The host can push commands down via `element.send(type, payload)`.
 *
 * Security: messages are accepted ONLY from the configured host origin, and only a
 * whitelisted set of event types is re-dispatched — an embedding page can never be
 * fed arbitrary events from a spoofed frame.
 */
(function () {
  "use strict";

  // ── Pure, testable core (exported for tests; no DOM needed) ──────────────
  var INBOUND_EVENTS = [
    "ready", "response", "themes-ready", "ranking-complete", "resize", "error",
  ];

  function normalizeOrigin(host) {
    // Accept a full URL or bare origin; return the origin (scheme://host[:port]) or "".
    if (!host || typeof host !== "string") return "";
    try {
      return new URL(host).origin;
    } catch (e) {
      return "";
    }
  }

  function buildSrc(host, code, opts) {
    var origin = normalizeOrigin(host);
    if (!origin || !code) return "";
    var q = "code=" + encodeURIComponent(code) + "&embed=1";
    if (opts && opts.theme) q += "&theme=" + encodeURIComponent(opts.theme);
    if (opts && opts.lang) q += "&lang=" + encodeURIComponent(opts.lang);
    return origin + "/session?" + q;
  }

  function isTrustedMessage(evt, expectedOrigin) {
    // Reject anything not from the exact configured origin (anti-spoofing).
    if (!expectedOrigin || evt.origin !== expectedOrigin) return false;
    var d = evt.data;
    if (!d || typeof d !== "object") return false;
    if (d.source !== "exel-polling") return false;               // our envelope marker
    return INBOUND_EVENTS.indexOf(d.type) !== -1;                 // whitelisted type only
  }

  var core = { INBOUND_EVENTS: INBOUND_EVENTS, normalizeOrigin: normalizeOrigin, buildSrc: buildSrc, isTrustedMessage: isTrustedMessage };

  // Node/test: export the pure core and stop (no customElements there).
  if (typeof module !== "undefined" && module.exports) {
    module.exports = core;
    return;
  }
  if (typeof window === "undefined" || typeof window.customElements === "undefined") return;

  // ── Browser: the custom element ──────────────────────────────────────────
  var ExelPolling = /*@__PURE__*/ (function () {
    function El() {
      var self = Reflect.construct(HTMLElement, [], El);
      self._onMsg = null;
      return self;
    }
    El.prototype = Object.create(HTMLElement.prototype);
    El.prototype.constructor = El;
    El.observedAttributes = ["code", "host", "theme", "lang"];

    El.prototype.connectedCallback = function () {
      if (this._iframe) return;
      var shadow = this.attachShadow ? this.attachShadow({ mode: "open" }) : this;
      var frame = document.createElement("iframe");
      frame.setAttribute("title", "eXeL AI Polling");
      frame.setAttribute("allow", "microphone");
      // Sandbox: allow the app to run + same-origin API calls, but not top-level nav.
      frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups");
      frame.style.cssText = "width:100%;height:100%;min-height:520px;border:0;display:block";
      this._iframe = frame;
      this._origin = normalizeOrigin(this.getAttribute("host"));
      shadow.appendChild(frame);
      this._render();

      var self = this;
      this._onMsg = function (evt) {
        if (!isTrustedMessage(evt, self._origin)) return;
        var d = evt.data;
        if (d.type === "resize" && d.height && self._iframe) {
          self._iframe.style.height = Math.max(320, d.height | 0) + "px";
        }
        self.dispatchEvent(new CustomEvent("exel:" + d.type, { detail: d.payload, bubbles: true, composed: true }));
      };
      window.addEventListener("message", this._onMsg);
    };

    El.prototype.disconnectedCallback = function () {
      if (this._onMsg) window.removeEventListener("message", this._onMsg);
      this._onMsg = null;
    };

    El.prototype.attributeChangedCallback = function () {
      if (this._iframe) this._render();
    };

    El.prototype._render = function () {
      this._origin = normalizeOrigin(this.getAttribute("host"));
      var src = buildSrc(this.getAttribute("host"), this.getAttribute("code"), {
        theme: this.getAttribute("theme"), lang: this.getAttribute("lang"),
      });
      if (src && this._iframe.src !== src) this._iframe.src = src;
    };

    // Host → iframe command channel (targeted to the configured origin only).
    El.prototype.send = function (type, payload) {
      if (!this._iframe || !this._iframe.contentWindow || !this._origin) return false;
      this._iframe.contentWindow.postMessage({ source: "exel-host", type: type, payload: payload }, this._origin);
      return true;
    };

    return El;
  })();

  if (!window.customElements.get("exel-polling")) {
    window.customElements.define("exel-polling", ExelPolling);
  }
})();
