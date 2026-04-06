// ============================================================
//  attendance.js  –  QR Scanner, Manual & Biometric Attendance
//  Requires: jsQR (CDN), html5-qrcode or native MediaDevices API
// ============================================================

const Attendance = {
  stream: null,       // active camera stream
  scanLoop: null,     // requestAnimationFrame handle
  canvas: null,
  ctx: null,
  video: null,
  onScan: null,       // callback(rollNo)

  // ----------------------------------------------------------
  //  QR SCANNER  – opens camera, reads QR codes in real time
  // ----------------------------------------------------------
  async startScanner(videoEl, canvasEl, onScanCallback) {
    this.video  = videoEl;
    this.canvas = canvasEl;
    this.ctx    = canvasEl.getContext("2d");
    this.onScan = onScanCallback;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      this.video.srcObject = this.stream;
      await this.video.play();
      this._tick();
      return true;
    } catch (e) {
      console.error("Camera error:", e);
      return false;
    }
  },

  _tick() {
    if (!this.video || this.video.readyState !== this.video.HAVE_ENOUGH_DATA) {
      this.scanLoop = requestAnimationFrame(() => this._tick());
      return;
    }
    const { videoWidth: w, videoHeight: h } = this.video;
    this.canvas.width  = w;
    this.canvas.height = h;
    this.ctx.drawImage(this.video, 0, 0, w, h);
    const imgData = this.ctx.getImageData(0, 0, w, h);
    const code = jsQR(imgData.data, w, h, { inversionAttempts: "dontInvert" });
    if (code && code.data) {
      this.onScan(code.data.trim());
    }
    this.scanLoop = requestAnimationFrame(() => this._tick());
  },

  stopScanner() {
    if (this.scanLoop) cancelAnimationFrame(this.scanLoop);
    if (this.stream)   this.stream.getTracks().forEach(t => t.stop());
    this.stream = null;
  },

  // ----------------------------------------------------------
  //  QR CODE GENERATOR  – generates a QR for a student/teacher
  //  Uses QRCode.js CDN
  // ----------------------------------------------------------
  generateQR(containerId, data, size = 128) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = "";
    new QRCode(el, {
      text: data,
      width: size,
      height: size,
      colorDark: "#0f172a",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });
  },

  // QR payload format: "NPS|ROLL|NAME|CLASS"
  buildQRPayload(roll, name, cls) {
    return `NPS|${roll}|${encodeURIComponent(name)}|${cls}`;
  },

  parseQRPayload(raw) {
    if (!raw.startsWith("NPS|")) return null;
    const [, roll, name, cls] = raw.split("|");
    return { roll, name: decodeURIComponent(name), cls };
  },

  // ----------------------------------------------------------
  //  MANUAL ATTENDANCE  – checkbox-based, returns array
  // ----------------------------------------------------------
  collectManual(tableBodyId) {
    const rows = document.querySelectorAll(`#${tableBodyId} tr[data-roll]`);
    return Array.from(rows).map(row => ({
      roll:   row.dataset.roll,
      name:   row.dataset.name,
      status: row.querySelector(".att-toggle")?.checked ? "P" : "A",
    }));
  },

  // ----------------------------------------------------------
  //  BIOMETRIC STUB  – connects to USB/Bluetooth device via
  //  Web Serial API (Chrome only). Falls back gracefully.
  // ----------------------------------------------------------
  async connectBiometric(onMatchCallback) {
    if (!("serial" in navigator)) {
      alert("Web Serial API not supported in this browser.\nUse Chrome/Edge on desktop for biometric device.");
      return false;
    }
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      const reader = port.readable.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      // Read loop – device sends "ROLL:2024001\n" on finger match
      (async () => {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value);
          const lines = buf.split("\n");
          buf = lines.pop();
          for (const line of lines) {
            const m = line.match(/^ROLL:(\S+)/);
            if (m) onMatchCallback(m[1].trim());
          }
        }
      })();
      return true;
    } catch (e) {
      console.error("Biometric error:", e);
      return false;
    }
  },

  // ----------------------------------------------------------
  //  SUBMIT ATTENDANCE BATCH  to Google Sheets via API
  // ----------------------------------------------------------
  async submitBatch(records, date, type = "student") {
    // records = [{roll, name, status, cls?}]
    const payload = { records, date, type, markedBy: Session.get().mobile };
    const res = await API.markAttendance(payload);
    return res;
  },
};

// ----------------------------------------------------------
//  ATTENDANCE UI BUILDER  – renders the attendance table
// ----------------------------------------------------------
function buildAttendanceTable(containerId, students, role = "teacher") {
  const tbody = document.getElementById(containerId);
  if (!tbody) return;
  tbody.innerHTML = students.map(s => `
    <tr data-roll="${s.roll}" data-name="${s.name}" class="border-b border-white/5 hover:bg-white/5 transition-colors">
      <td class="px-4 py-3 text-sm font-mono text-amber-400">${s.roll}</td>
      <td class="px-4 py-3 text-sm text-slate-200">${s.name}</td>
      <td class="px-4 py-3 text-xs text-slate-400">${s.father || "—"}</td>
      <td class="px-4 py-3 text-xs text-slate-400">${maskAadhaar(s.aadhaar, role)}</td>
      <td class="px-4 py-3 text-xs text-slate-300">${s.mobile || "—"}</td>
      <td class="px-4 py-3">
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" class="att-toggle sr-only peer" ${s.status === "P" ? "checked" : ""}>
          <div class="w-10 h-5 bg-red-600/60 peer-checked:bg-green-500 rounded-full transition-all after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
          <span class="ml-2 text-xs peer-checked:text-green-400 text-red-400 peer-checked:before:content-['P'] before:content-['A'] font-bold"></span>
        </label>
      </td>
      <td class="px-4 py-3 text-xs text-center text-slate-300">${s.presentCount || 0}</td>
      <td class="px-4 py-3">
        <span class="text-xs px-2 py-1 rounded-full ${s.feeStatus === "Paid" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}">${s.feeStatus || "Due"}</span>
      </td>
    </tr>
  `).join("");
}
