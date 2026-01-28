const API_URL = "https://bank-backend-hm3q.onrender.com";

const mails = {};
let currentMail = null;
let playerProgress = 0;
let bankFund = 0;

// =======================
// FONDO BANCARIO
// =======================
function updateFundUI() {
    const el = document.getElementById("bankFunds");
    if (el) {
        el.textContent = "€ " + bankFund.toLocaleString();
    }
}

// =======================
// CHAT
// =======================
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const chatBody = document.getElementById("chat-body");

sendBtn.onclick = sendChat;

function sendChat() {
    const text = chatInput.value.trim();
    if (!text) return;

    addMsg(text, "user");

    fetch(API_URL + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
    })
        .then(r => r.json())
        .then(data => addMsg(data.reply, "robot"));

    chatInput.value = "";
    chatInput.style.height = "auto";
}

function addMsg(text, cls) {
    const div = document.createElement("div");
    div.className = "msg " + cls;
    div.textContent = text;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
}

// ENTER per inviare / SHIFT+ENTER per andare a capo
chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendChat();
    }
});

// auto-resize textarea
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
            action
        })
    });

    const data = await res.json();
    bankFund = data.bank_fund;
    updateFundUI();

    // storico
    const hist = document.createElement("li");
    hist.textContent = `${m.title} — ${action}`;
    document.getElementById("historyList").appendChild(hist);

    // rimuovi inbox
    document.querySelector(`li[data-id="${currentMail}"]`)?.remove();

    delete mails[currentMail];
    currentMail = null;

    document.querySelector(".actions").classList.remove("visible");
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
    let badge = document.getElementById("mailBadge");

    if (!badge) {
        badge = document.createElement("span");
        badge.id = "mailBadge";
        badge.style.color = "var(--accent)";
        badge.style.marginLeft = "8px";
        document.querySelector(".mailbox h2").appendChild(badge);
    }

    badge.textContent = unread ? `(${unread})` : "";
}

// =======================
// LOOP MAIL INFINITO
// =======================
async function startMailLoop() {
    while (true) {
        await fetchNewMail();
        await new Promise(r => setTimeout(r, 30000 + playerProgress * 300));
    }
}

// =======================
// INIT
// =======================
window.onload = async () => {
    const res = await fetch(API_URL + "/status");
    const data = await res.json();
    bankFund = data.bank_fund;
    updateFundUI();
    startMailLoop();
};
