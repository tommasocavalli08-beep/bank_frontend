const API_BASE = "https://bank-backend-hm3q.onrender.com"; // <<=== CAMBIA QUI

let inbox = [];
let history = [];
let lastFetchTime = 0;
let playerProgress = 0; // cambia questo valore quando il giocatore avanza
let openedMailId = null;

// aggiorna badge notifiche
function updateNotificationBadge() {
  const unreadCount = inbox.filter(m => !m.read).length;
  document.getElementById("notifyBadge").innerText = unreadCount;
}

// render inbox
function renderInbox() {
  const container = document.getElementById("inboxList");
  container.innerHTML = "";
  inbox.forEach(mail => {
    const div = document.createElement("div");
    div.className = "mailItem";
    div.innerText = mail.subject + (mail.read ? " (letto)" : "");
    div.onclick = () => openMail(mail.id);
    container.appendChild(div);
  });
}

// render history
function renderHistory() {
  const container = document.getElementById("historyList");
  container.innerHTML = "";
  history.forEach(mail => {
    const div = document.createElement("div");
    div.className = "mailItem";
    div.innerText = mail.subject;
    container.appendChild(div);
  });
}

// fetch inbox
async function fetchInbox() {
  const res = await fetch(`${API_BASE}/mail/inbox`);
  inbox = await res.json();
  renderInbox();
  updateNotificationBadge();
}

// fetch history
async function fetchHistory() {
  const res = await fetch(`${API_BASE}/mail/history`);
  history = await res.json();
  renderHistory();
}

// open mail
async function openMail(id) {
  const res = await fetch(`${API_BASE}/mail/open/${id}`, { method: "POST" });
  const mail = await res.json();

  openedMailId = id;

  document.getElementById("mailView").innerHTML = `
    <h3>${mail.subject}</h3>
    <p>${mail.body}</p>
  `;

  document.getElementById("archiveBtn").style.display = "block";

  inbox = inbox.map(m => m.id === id ? { ...m, read: true } : m);
  updateNotificationBadge();
  renderInbox();
}

// archive mail
async function archiveMail() {
  if (!openedMailId) return;
  await fetch(`${API_BASE}/mail/archive/${openedMailId}`, { method: "POST" });

  inbox = inbox.filter(m => m.id !== openedMailId);
  openedMailId = null;

  document.getElementById("mailView").innerHTML = "Apri una mail per leggerla.";
  document.getElementById("archiveBtn").style.display = "none";

  fetchInbox();
  fetchHistory();
}

// genera mail automaticamente con ritardo proporzionale al progresso
async function checkForNewMail() {
  const res = await fetch(`${API_BASE}/mail/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      progress: playerProgress,
      last_time: lastFetchTime
    })
  });

  const data = await res.json();

  if (data.status === "new") {
    inbox.push(data.mail);
    updateNotificationBadge();
    renderInbox();
    lastFetchTime = Date.now() / 1000;
  }

  setTimeout(checkForNewMail, data.next_interval * 1000);
}

// inizializza
window.onload = () => {
  document.getElementById("archiveBtn").onclick = archiveMail;
  fetchInbox();
  fetchHistory();
  checkForNewMail();
};

