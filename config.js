// ============================================================
//  config.js  –  Nitya Public School ERP
//  All sensitive values come from ONE place. Never hardcode
//  GAS URLs or API keys directly in HTML pages.
// ============================================================

const CONFIG = {
  // 🔴 REPLACE this with your deployed Google Apps Script Web App URL
  GAS_URL: "https://script.google.com/macros/s/AKfycbw-RU3wXgGDCRwJJBsVpKfb4RsPj3eJa_-Wl_UcUT2tqCUqCu90rpf6kgPeuvI-y1uESA/exec",

  // Simple API key shared between frontend and GAS (change this!)
  API_KEY: "NPS_SECRET_2025",

  // Academic session (update each year)
  SESSION_START: "2025-04-01",
  SESSION_LABEL: "2025-26",

  SCHOOL_NAME: "Nitya Public School",
  SCHOOL_ADDRESS: "Salory, Prayagraj",
  DEVELOPER: "Sant Digital Solution",
};

// ============================================================
//  SESSION MANAGEMENT  (role-based, stored in sessionStorage)
// ============================================================
const Session = {
  set(role, name, mobile) {
    sessionStorage.setItem("NPS_role", role);
    sessionStorage.setItem("NPS_name", name);
    sessionStorage.setItem("NPS_mobile", mobile);
    sessionStorage.setItem("NPS_token", btoa(role + "|" + mobile + "|" + CONFIG.API_KEY));
  },
  get() {
    return {
      role:   sessionStorage.getItem("NPS_role"),
      name:   sessionStorage.getItem("NPS_name"),
      mobile: sessionStorage.getItem("NPS_mobile"),
      token:  sessionStorage.getItem("NPS_token"),
    };
  },
  valid() {
    const s = this.get();
    if (!s.role || !s.token) return false;
    return s.token === btoa(s.role + "|" + s.mobile + "|" + CONFIG.API_KEY);
  },
  clear() { sessionStorage.clear(); },
  requireRole(...allowed) {
    if (!this.valid()) { location.href = "index.html"; return false; }
    if (!allowed.includes(this.get().role)) { location.href = "index.html"; return false; }
    return true;
  },
};

// ============================================================
//  VALIDATION HELPERS
// ============================================================
const Validate = {
  mobile: (v) => /^[6-9]\d{9}$/.test(v),
  aadhaar: (v) => /^\d{12}$/.test(v),
  feeAmount: (v) => /^\d+(\.\d{1,2})?$/.test(v) && parseFloat(v) >= 0,
  name: (v) => v.trim().length >= 2,
};

// ============================================================
//  API HELPER  –  all calls to Google Apps Script
// ============================================================
const API = {
  async call(action, payload = {}) {
    const body = { action, apiKey: CONFIG.API_KEY, ...payload };
    try {
      const res = await fetch(CONFIG.GAS_URL, {
        method: "POST",
        body: JSON.stringify(body),
      });
      return await res.json();
    } catch (e) {
      console.error("API error:", e);
      return { success: false, error: e.message };
    }
  },

  // Attendance
  markAttendance: (d) => API.call("markAttendance", d),
  getAttendance:  (d) => API.call("getAttendance", d),

  // Students
  getStudents:   (d) => API.call("getStudents", d),
  addStudent:    (d) => API.call("addStudent", d),
  updateStudent: (d) => API.call("updateStudent", d),
  deleteStudent: (d) => API.call("deleteStudent", d),

  // Fees
  getFees:       (d) => API.call("getFees", d),
  collectFee:    (d) => API.call("collectFee", d),

  // Teachers
  getTeachers:   (d) => API.call("getTeachers", d),
  addTeacher:    (d) => API.call("addTeacher", d),
  updateTeacher: (d) => API.call("updateTeacher", d),

  // Salary
  saveSalary:    (d) => API.call("saveSalary", d),
  approveSalary: (d) => API.call("approveSalary", d),

  // Expenditure
  addExpenditure: (d) => API.call("addExpenditure", d),
  getExpenditure: (d) => API.call("getExpenditure", d),

  // Daily Work Log
  saveWorkLog: (d) => API.call("saveWorkLog", d),

  // Login auth
  login: (d) => API.call("login", d),
};

// ============================================================
//  AADHAAR MASKING  (for non-principal roles)
// ============================================================
function maskAadhaar(num, role) {
  if (!num) return "—";
  const s = String(num);
  return role === "principal" ? s : "XXXXXXXX" + s.slice(-4);
}

// ============================================================
//  DATE UTILS
// ============================================================
const today = () => new Date().toISOString().split("T")[0];
const monthLabel = (d = new Date()) =>
  d.toLocaleString("default", { month: "long", year: "numeric" });
