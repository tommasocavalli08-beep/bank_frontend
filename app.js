const API_URL = "https://bank-backend-hm3q.onrender.com";

const mails = {};
let currentMail = null;
let playerProgress = 0;
let bankFunds = 2450000;
let decisionsMade = 0;

// =======================
// CHAT
// =======================
document.getElementById("send-btn").onclick = async () => {
    const input = document.getElementById("chat-input");
    if (!input.value.trim()) return;

    addMsg(input.value.trim(), "user");

    const res = await fetch(API_URL + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.value.trim() })
    });

    const data = await res.json();
    addMsg(data.reply, "robot");

    input.value = "";
    input.style.height = "auto";
};

function addMsg(text, cls) {
    const div = document.createElement("div");
    div.className = "msg " + cls;
    div.textContent = text;
    document.getElementById("chat-body").appendChild(div);
    const chatBody = document.getElementById("chat-body");
    chatBody.scrollTop = chatBody.scrollHeight;
}

// auto-resize textarea
const chatInput = document.getElementById("chat-input");
chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = chatInput.scrollHeight + "px";
});

// Enter invio messaggio
chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        document.getElementById("send-btn").click();
    }
});

// =======================
// MAIL
// =======================
function initInitialMails() {
    const initial = [
        { title: "BN-88421 — Esterno", body: "Operatore,\n\nComunicazione non ufficiale.", isNew: false },
        { title: "Mutuo — Rossi", body: "Richiesta mutuo cliente Rossi.", isNew: false },
        { title: "Audit interno", body: "Audit interno in corso.", isNew: false },
        { title: "Messaggio riservato", body: "Messaggio riservato.\nAccesso limitato.", isNew: true }
    ];
    initial.forEach(mail => addMailToInbox(mail.title, mail.body, mail.isNew));
}

async function fetchNewMail() {
    const res = await fetch(API_URL + "/new-mail");
    const mail = await res.json();
    addMailToInbox(mail.title, mail.body, true);
}

function addMailToInbox(title, body, isNew) {
    const id = Date.now() + Math.random();
    mails[id] = { id, title, body, status: "inbox", read: !isNew };
    const li = document.createElement("li");
    li.className = "mail" + (isNew ? " new" : "");
    li.textContent = title;
    li.dataset.id = id;
    li.onclick = () => openMail(id);
    document.getElementById("mailList").appendChild(li);
    updateBadge();
}

function openMail(id) {
    currentMail = id;
    const mail = mails[id];
    document.getElementById("docProtocol").textContent = mail.title;
    document.getElementById("docBody").innerHTML = mail.body;
    document.querySelector(".actions").classList.add("visible");
    mail.read = true;
    const li = document.querySelector(`li[data-id="${id}"]`);
    if (li) li.classList.remove("new");
    updateBadge();
}

document.querySelector(".approve").onclick = () => closeMail("APPROVATA");
document.querySelector(".archive").onclick = () => closeMail("ARCHIVIATA");
document.querySelector(".report").onclick = () => closeMail("SEGNALATA");

function closeMail(action) {
    const mail = mails[currentMail];
    if (!mail) return;

    mail.status = "archived";
    decisionsMade++;
    if (mail.title.toLowerCase().includes("mutuo")) {
        bankFunds -= 50000; // esempio mutuo
    }

    const liHistory = document.createElement("li");
    liHistory.textContent = `${mail.title} — ${action} — Bilancio: €${bankFunds.toLocaleString()}`;
    document.getElementById("historyList").appendChild(liHistory);

    const liInbox = document.querySelector(`li[data-id="${currentMail}"]`);
    if (liInbox) liInbox.remove();

    document.querySelector(".actions").classList.remove("visible");
    currentMail = null;
    updateBadge();
    document.getElementById("bankFunds").textContent = `€ ${bankFunds.toLocaleString()}`;
}

function updateBadge() {
    let badge = document.getElementById("mailBadge");
    if (!badge) {
        const title = document.querySelector(".mailbox h2");
        badge = document.createElement("span");
        badge.id = "mailBadge";
        badge.style.marginLeft = "10px";
        badge.style.color = "var(--accent)";
        title.appendChild(badge);
    }
    const unread = Object.values(mails).filter(m => m.status === "inbox" && !m.read).length;
    badge.textContent = unread > 0 ? `(${unread})` : "";
}

// Arrivo mail infinito
function getMailDelay() { return 30000 * (1 + playerProgress / 100); }
async function startMailLoop() {
    while (true) {
        await fetchNewMail();
        await new Promise(r => setTimeout(r, getMailDelay()));
    }
}

// =======================
// PULSANTE FINE
// =======================
document.getElementById("end-btn").onclick = () => {
    const modal = document.getElementById("end-modal");
    const summary = document.getElementById("end-summary");
    summary.innerHTML = `
        Decisioni prese: ${decisionsMade}<br>
        Fondi banca: €${bankFunds.toLocaleString()}<br>
        Progressi giocatore: ${playerProgress}%
    `;
    modal.style.display = "flex";
};

// =======================
// INIT
// =======================
window.onload = () => {
    initInitialMails();
    startMailLoop();
};
