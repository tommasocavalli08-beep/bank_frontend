const API_URL = "https://bank-backend-hm3q.onrender.com";

const mails = {};
let currentMail = null;
let bankFund = 2450000; // iniziale
let decisions = 0;
let approvedLoans = 0;
let reports = 0;
let balanceDelta = 0;

// ==================== CHAT ====================
const chatInput = document.getElementById("chat-input");
const chatBody = document.getElementById("chat-body");
document.getElementById("send-btn").onclick = sendChat;

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
    .then(d => addMsg(d.reply, "robot"));
    chatInput.value = "";
    chatInput.style.height = "auto";
}

function addMsg(text, cls) {
    const d = document.createElement("div");
    d.className = "msg " + cls;
    d.textContent = text;
    chatBody.appendChild(d);
    chatBody.scrollTop = chatBody.scrollHeight;
}

chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendChat();
    }
});

chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = chatInput.scrollHeight + "px";
});

// ==================== MAIL ====================
async function fetchNewMail() {
    const r = await fetch(API_URL + "/new-mail");
    addMail(await r.json());
}

function addMail(mail) {
    const id = Date.now() + Math.random();
    mails[id] = { ...mail, id, read: false };

    const li = document.createElement("li");
    li.className = "mail new";
    li.textContent = mail.title;
    li.dataset.id = id;
    li.onclick = () => openMail(id);

    document.getElementById("mailList").appendChild(li);
}

function openMail(id) {
    currentMail = id;
    const m = mails[id];
    document.getElementById("docProtocol").textContent = m.title;
    document.getElementById("docBody").innerText = m.body;
    document.querySelector(".actions").classList.add("visible");
    m.read = true;
    document.querySelector(`li[data-id="${id}"]`)?.classList.remove("new");
}

// ==================== DECISIONI ====================
async function closeMail(action) {
    const m = mails[currentMail];
    if (!m) return;

    decisions++;
    let delta = 0;
    if (m.type === "loan" && action === "APPROVATA") {
        approvedLoans++;
        delta = -m.amount;
    }
    if (m.type === "fraud" && action === "SEGNALATA") {
        reports++;
        delta = 20000;
    }

    balanceDelta += delta;
    bankFund += delta;
    updateFundUI();

    const li = document.createElement("li");
    li.textContent =
        `${m.title} — ${action} | ${delta >=0 ? "+" : ""}${delta.toLocaleString()} € | Fondo: ${bankFund.toLocaleString()} €`;
    document.getElementById("historyList").appendChild(li);

    document.querySelector(`li[data-id="${currentMail}"]`)?.remove();
    delete mails[currentMail];
    currentMail = null;
    document.querySelector(".actions").classList.remove("visible");
}

function updateFundUI() {
    document.getElementById("bankFunds").textContent = "€ " + bankFund.toLocaleString();
}

document.querySelector(".approve").onclick = () => closeMail("APPROVATA");
document.querySelector(".archive").onclick = () => closeMail("ARCHIVIATA");
document.querySelector(".report").onclick = () => closeMail("SEGNALATA");

// ==================== FINE GIOCO ====================
document.getElementById("endGameBtn").onclick = () => {
    const modal = document.getElementById("endGameModal");
    modal.style.display = "flex";
    document.getElementById("endStats").innerHTML = `
        Decisioni prese: <strong>${decisions}</strong><br>
        Prestiti approvati: <strong>${approvedLoans}</strong><br>
        Segnalazioni: <strong>${reports}</strong><br>
        Bilancio finale: <strong>${balanceDelta >=0 ? "+" : ""}${balanceDelta.toLocaleString()} €</strong><br>
        Fondo finale: <strong>${bankFund.toLocaleString()} €</strong>
    `;
    // Termina attività backend
    fetch(API_URL + "/end-session", { method: "POST" });
};

// Esci forzato dal sito
document.getElementById("exitBtn").onclick = () => window.location.href = "about:blank";

// ==================== INIT ====================
window.onload = async () => {
    updateFundUI();
    setInterval(fetchNewMail, 30000);
};
