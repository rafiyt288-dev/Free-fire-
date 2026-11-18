const $ = (id) => document.getElementById(id);
const loginView = $("loginView");
const dashboardView = $("dashboardView");

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "অনুরোধ সম্পন্ন হয়নি।");
  return data;
}
function showDashboard(show) {
  loginView.hidden = show;
  dashboardView.hidden = !show;
}
function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}
async function loadStatus() {
  const data = await request("/api/status");
  $("serverStatus").textContent = "ONLINE";
  $("uptime").textContent = formatUptime(data.uptimeSeconds);
  $("monitorState").textContent = data.monitoringEnabled ? "চালু" : "বন্ধ";
  $("playerLabel").value = data.account.playerLabel;
  $("playerUid").value = data.account.playerUid;
  $("bio").value = data.account.bio;
  $("monitoringEnabled").checked = data.monitoringEnabled;
}
$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("loginError").textContent = "";
  try {
    await request("/api/login", { method: "POST", body: JSON.stringify({ password: $("password").value }) });
    $("password").value = "";
    showDashboard(true);
    await loadStatus();
  } catch (error) {
    $("loginError").textContent = error.message;
  }
});
$("settingsForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("saveMessage").textContent = "";
  try {
    await request("/api/settings", {
      method: "PUT",
      body: JSON.stringify({
        playerLabel: $("playerLabel").value,
        playerUid: $("playerUid").value,
        bio: $("bio").value,
        monitoringEnabled: $("monitoringEnabled").checked
      })
    });
    $("saveMessage").textContent = "সেটিংস সংরক্ষিত হয়েছে (বর্তমান সার্ভার রান পর্যন্ত)।";
    await loadStatus();
  } catch (error) {
    $("saveMessage").textContent = error.message;
  }
});
$("logoutBtn").addEventListener("click", async () => {
  await request("/api/logout", { method: "POST" });
  showDashboard(false);
});
(async function init() {
  try {
    const me = await request("/api/me");
    if (me.authenticated) {
      showDashboard(true);
      await loadStatus();
    } else {
      showDashboard(false);
    }
  } catch (_) {
    showDashboard(false);
  }
})();
