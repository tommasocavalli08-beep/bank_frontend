const API_URL = "https://bank-backend-hm3q.onrender.com";

const mails = {};
let currentMail = null;
let playerProgress = 0;
let bankFund = 1000000;

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
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({message: input.value})
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

// AUTO RESIZE
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
    mails[id] = {...mail, id, read: false};

    const li = document.createElement("li");
    li.textContent = mail.title;
    li.className = "mail new";
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
    updateBadge();
}

async function closeMail(action) {
    const m = mails[currentMail];
    if (!m) return;

    await fetch(API_URL + "/decision", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            type: m.type,
            amount: m.amount,
            action: action
        })
    });

    document.querySelector(`.mail`).remove();
    document.querySelector(".actions").classList.remove("visible");
    currentMail = null;
}

document.querySelector(".approve").onclick = () => closeMail("APPROVATA");
document.querySelector(".archive").onclick = () => closeMail("ARCHIVIATA");
document.querySelector(".report").onclick = () => closeMail("SEGNALATA");

// =======================
// BADGE
// =======================
function updateBadge() {
    const unread = Object.values(mails).filter(m => !m.read).length;
    document.getElementById("mailBadge").textContent = unread ? `(${unread})` : "";
}

// =======================
// LOOP INFINITO
// =======================
async function startMailLoop() {
    while (true) {
        await fetchNewMail();
        await new Promise(r => setTimeout(r, 30000 + playerProgress * 200));
    }
}

window.onload = startMailLoop;
