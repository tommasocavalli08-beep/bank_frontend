const API_URL = "https://bank-backend-hm3q.onrender.com";

const mails = {};
let currentMail = null;
let playerProgress = 0; // 0-100 (più cresce, più lento arriva la posta)
let mailTimer = null;

// =======================
// CHAT
// =======================
document.getElementById("send-btn").onclick = async () => {
    const input = document.getElementById("chat-input");
    if (!input.value) return;

    addMsg(input.value, "user");
    const res = await fetch(API_URL + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.value })
    });

    const data = await res.json();
    addMsg(data.reply, "robot");
    input.value = "";
};

function addMsg(text, cls) {
    const div = document.createElement("div");
    div.className = "msg " + cls;
    div.textContent = text;
    document.getElementById("chat-body").appendChild(div);
    document.getElementById("chat-body").scrollTop = document.getElementById("chat-body").scrollHeight;
}

// =======================
// INIZIALIZZA MAIL INIZIALI
// =======================
function initInitialMails() {
    const initial = [
        {
            title: "BN-88421 — Esterno",
            body: "Operatore,\n\nquesta comunicazione non segue i canali ufficiali.\nLa sua decisione influenzerà valutazioni future.\n\nCollaborare potrebbe risultare vantaggioso.",
            isNew: false
        },
        {
            title: "Mutuo — Rossi",
            body: "Richiesta mutuo cliente Rossi.\n\nControllare documentazione e procedere con valutazione rischio.",
            isNew: false
        },
        {
            title: "Audit interno",
            body: "Audit interno in corso.\n\nVerificare conformità procedure e report anomalie entro fine giornata.",
            isNew: false
        },
        {
            title: "Messaggio riservato",
            body: "Messaggio riservato.\n\nAccesso limitato.\n\nProcedere con massima cautela.",
            isNew: true
        }
    ];

    initial.forEach(mail => addMailToInbox(mail.title, mail.body, mail.isNew));
}

// =======================
// MAIL DINAMICHE
// =======================
async function fetchNewMail() {
    const res = await fetch(API_URL + "/new-mail");
    const mail = await res.json();
    addMailToInbox(mail.title, mail.body, true);
}

function addMailToInbox(title, body, isNew) {
    const id = Date.now() + Math.random();
    mails[id] = {
        id,
        title,
        body,
        status: "inbox",
        read: !isNew
    };

    const li = document.createElement("li");
    li.className = "mail" + (isNew ? " new" : "");
    li.textContent = title;
    li.dataset.id = id;
    li.onclick = () => openMail(id);

    document.getElementById("mailList").appendChild(li);

    updateBadge();
}

// =======================
// APERTURA MAIL
// =======================
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

// =======================
// AZIONI
// =======================
document.querySelector(".approve").onclick = () => closeMail("APPROVATA");
document.querySelector(".archive").onclick = () => closeMail("ARCHIVIATA");
document.querySelector(".report").onclick = () => closeMail("SEGNALATA");

function closeMail(action) {
    const mail = mails[currentMail];
    if (!mail) return;

    mail.status = "archived";

    const liHistory = document.createElement("li");
    liHistory.textContent = `${mail.title} — ${action}`;
    document.getElementById("historyList").appendChild(liHistory);

    const liInbox = document.querySelector(`li[data-id="${currentMail}"]`);
    if (liInbox) liInbox.remove();

    document.querySelector(".actions").classList.remove("visible");
    currentMail = null;

    updateBadge();
}

// =======================
// NOTIFICA
// =======================
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

// =======================
// ARRIVO MAIL PROGRESSIVO
// =======================
function getMailDelay() {
    return 30000 * (1 + playerProgress / 100);
}

function scheduleNextMail() {
    if (mailTimer) clearTimeout(mailTimer);
    mailTimer = setTimeout(async () => {
        await fetchNewMail();
        scheduleNextMail();
    }, getMailDelay());
}

// =======================
// INIZIALIZZAZIONE
// =======================
window.onload = () => {
    initInitialMails();
    scheduleNextMail();
};
