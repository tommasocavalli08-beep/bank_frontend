const API_URL = "https://bank-backend-hm3q.onrender.com";

const mails = {};
let currentMail = null;
let playerProgress = 0;
let bankFund = 1000000;

// =======================
// FONDO BANCARIO (UI)
// =======================
function updateFundUI() {
    const el = document.getElementById("bankFund");
    if (el) {
        el.textContent = bankFund.toLocaleString() + " €";
    }
}

// =======================
// CHAT
// =======================
document.getElementById("send-btn").onclick = sendChat;

async function sendChat() {
    const input = document.getElementById("chat-input");
    if (!input.value.trim()) return;

    addMsg(input.value, "user");

    const res = await fetch(API_URL + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.value })
    });

    const data = await res.json();
    addMsg(data.reply, "robot");

    input.value = "";
    input.style.height = "auto";
}

function addMsg(text, cls) {
    const div = document.createElement("div");
    div.className = "msg " + cls;
    div.textContent = text;
    const body = document.getElementById("chat-body");
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
}

// ENTER PER INVIARE
const chatInput = document.getElementById("chat-input");
chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendChat();
    }
});

// AUTO-RESIZE
chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = chatInput.scrollHeight + "px";
});

// =======================
// MAIL
// =======================
async function fetchNewMail() {
    const res = await fetch(API_URL + "/new-mail");
    const mail = await res.json();
    addMail(mail);
}

function addMail(mail) {
    const id = Date.now() + Math.random();

    mails[id] = {
        ...mail,
        id,
        read: false
    };

    const li = document.createElement("li");
    li.className = "mail new";
    li.textContent = mail.title;
    li.dataset.id = id;
    li.onclick = () => openMail(id);

    document.getElementById("mailList").appendChild(li);
    updateBadge();
}

function openMail(id) {
    currentMail = id;
    const m = mails[id];

    document.getElementById("docProtocol").textContent = m.title;
    document.getElementById("docBody").innerText = m.body;
    document.querySelector(".actions").classList.add("visible");

    m.read = true;
    document.querySelector(`li[data-id="${id}"]`)?.classList.remove("new");

    updateBadge();
}

// =======================
// AZIONI MAIL
// =======================
async function closeMail(action) {
    const m = mails[currentMail];
    if (!m) return;

    const res = await fetch(API_URL + "/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            type: m.type,
            amount: m.amount,
            action: action
        })
    });

    const data = await res.json();
    bankFund = data.bank_fund;
    updateFundUI();

    // ➜ storico
    const historyItem = document.createElement("li");
    historyItem.textContent = `${m.title} — ${action}`;
    document.getElementById("historyList").appendChild(historyItem);

    // ➜ rimuovi inbox
    document.querySelector(`li[data-id="${currentMail}"]`)?.remove();

    document.querySelector(".actions").classList.remove("visible");
    delete mails[currentMail];
    currentMail = null;

    updateBadge();
}

document.querySelector(".approve").onclick = () => closeMail("APPROVATA");
document.querySelector(".archive").onclick = () => closeMail("ARCHIVIATA");
document.querySelector(".report").onclick = () => closeMail("SEGNALATA");

// =======================
// BADGE
// =======================
function updateBadge() {
    const unread = Object.values(mails).filter(m => !m.read).length;
    const badge = document.getElementById("mailBadge");
    if (badge) badge.textContent = unread ? `(${unread})` : "";
}

// =======================
// LOOP MAIL INFINITO
// =======================
async function startMailLoop() {
    while (true) {
        await fetchNewMail();
        await new Promise(r => setTimeout(r, 30000 + playerProgress * 200));
    }
}

// =======================
// INIT
// =======================
window.onload = async () => {
    const res = await fetch(
