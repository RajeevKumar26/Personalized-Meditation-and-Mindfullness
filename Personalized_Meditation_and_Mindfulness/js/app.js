// Personalized Meditation and Mindfulness
// Beginner-friendly project using HTML, CSS, JavaScript and LocalStorage.

// ---------- BASIC DATA ----------
const USERS_KEY = "mindfulness_users";
const SESSION_KEY = "mindfulness_sessions";
const PLAN_KEY = "mindfulness_plans";
const CURRENT_USER_KEY = "mindfulness_current_user";

let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
let sessions = JSON.parse(localStorage.getItem(SESSION_KEY)) || [];
let plans = JSON.parse(localStorage.getItem(PLAN_KEY)) || [];
let currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY)) || null;

function saveData() {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
    localStorage.setItem(PLAN_KEY, JSON.stringify(plans));
}

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
}

function todayDate() {
    return new Date().toISOString().slice(0, 10);
}

// Add a sample admin account for demonstrating role-based access.
if (!users.some(user => user.role === "admin")) {
    users.push({
        id: Date.now(),
        name: "Project Admin",
        email: "admin@demo.com",
        password: "Admin123",
        goal: "Support members and manage the platform.",
        role: "admin"
    });
    saveData();
}

// ---------- LOGIN AND REGISTRATION ----------
const authScreen = document.getElementById("authScreen");
const appScreen = document.getElementById("appScreen");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

document.getElementById("showLogin").addEventListener("click", () => {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    document.getElementById("showLogin").classList.add("active");
    document.getElementById("showRegister").classList.remove("active");
});

document.getElementById("showRegister").addEventListener("click", () => {
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    document.getElementById("showRegister").classList.add("active");
    document.getElementById("showLogin").classList.remove("active");
});

registerForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const password = document.getElementById("registerPassword").value;

    if (name.length < 2 || password.length < 6) {
        document.getElementById("registerMessage").textContent = "Enter a valid name and a password of at least 6 characters.";
        return;
    }

    if (users.some(user => user.email === email)) {
        document.getElementById("registerMessage").textContent = "This email is already registered. Please log in.";
        return;
    }

    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: password,
        goal: "",
        role: "user"
    };

    users.push(newUser);
    saveData();
    registerForm.reset();
    document.getElementById("showLogin").click();
    document.getElementById("loginMessage").textContent = "Account created. You can now log in.";
});

loginForm.addEventListener("submit", event => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;
    const foundUser = users.find(user => user.email === email && user.password === password);

    if (!foundUser) {
        document.getElementById("loginMessage").textContent = "Email or password is incorrect.";
        return;
    }

    currentUser = foundUser;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
    openApplication();
});

function openApplication() {
    authScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");
    updateUserHeader();
    showView("dashboard");
}

function updateUserHeader() {
    document.getElementById("topName").textContent = currentUser.name;
    document.getElementById("topRole").textContent = currentUser.role === "admin" ? "Administrator" : "Member";
    document.getElementById("topAvatar").textContent = currentUser.name.charAt(0).toUpperCase();
    document.getElementById("welcomeText").textContent = "Welcome, " + currentUser.name.split(" ")[0] + ".";
    document.getElementById("adminNav").classList.toggle("hidden", currentUser.role !== "admin");
}

document.getElementById("logoutButton").addEventListener("click", () => {
    currentUser = null;
    localStorage.removeItem(CURRENT_USER_KEY);
    appScreen.classList.add("hidden");
    authScreen.classList.remove("hidden");
    loginForm.reset();
});

// ---------- PAGE NAVIGATION ----------
const pageNames = {
    dashboard: "Dashboard",
    sessions: "My sessions",
    plans: "Schedules and plans",
    history: "Progress and history",
    profile: "My profile",
    admin: "Admin panel"
};

function showView(viewName) {
    if (viewName === "admin" && currentUser.role !== "admin") {
        showToast("Admin access only.");
        return;
    }

    document.querySelectorAll(".view").forEach(view => view.classList.add("hidden"));
    document.getElementById(viewName + "View").classList.remove("hidden");
    document.getElementById("pageTitle").textContent = pageNames[viewName];

    document.querySelectorAll(".nav-link[data-view]").forEach(button => {
        button.classList.toggle("active", button.dataset.view === viewName);
    });

    refreshPageData();
}

document.querySelectorAll(".nav-link[data-view]").forEach(button => {
    button.addEventListener("click", () => showView(button.dataset.view));
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => showView(button.dataset.go));
});

// ---------- SESSION RECORDS: CREATE, READ, UPDATE, DELETE ----------
function mySessions() {
    return sessions.filter(session => session.userId === currentUser.id);
}

function renderSessions() {
    const searchText = document.getElementById("sessionSearch").value.toLowerCase();
    const filterStatus = document.getElementById("sessionFilter").value;
    const list = document.getElementById("sessionList");

    const filtered = mySessions().filter(session => {
        const matchesText = session.name.toLowerCase().includes(searchText)
            || session.category.toLowerCase().includes(searchText);
        const matchesStatus = filterStatus === "all" || session.status === filterStatus;
        return matchesText && matchesStatus;
    });

    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-state">No sessions found. Add your first meditation session.</div>';
        return;
    }

    list.innerHTML = filtered.map(session => `
        <article class="record-card">
            <div class="record-top">
                <div><p class="eyebrow">${session.category}</p><h3>${escapeHTML(session.name)}</h3></div>
                <span class="badge ${session.status === "Completed" ? "completed" : ""}">${session.status}</span>
            </div>
            <p>${session.duration} minutes · ${session.date}</p>
            <p>${escapeHTML(session.notes || "No additional notes.")}</p>
            <div class="record-actions">
                <button class="small-button" onclick="editSession(${session.id})">Edit</button>
                <button class="small-button" onclick="toggleSessionStatus(${session.id})">${session.status === "Completed" ? "Mark pending" : "Mark completed"}</button>
                <button class="small-button delete" onclick="deleteSession(${session.id})">Delete</button>
            </div>
        </article>
    `).join("");
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[character]);
}

function openModal(id) {
    document.getElementById(id).classList.remove("hidden");
}

function closeModal(id) {
    document.getElementById(id).classList.add("hidden");
}

document.getElementById("addSessionButton").addEventListener("click", () => {
    document.getElementById("sessionForm").reset();
    document.getElementById("sessionId").value = "";
    document.getElementById("sessionDate").value = todayDate();
    document.getElementById("sessionModalTitle").textContent = "Add a session";
    openModal("sessionModal");
});

document.getElementById("sessionForm").addEventListener("submit", event => {
    event.preventDefault();

    const id = document.getElementById("sessionId").value;
    const name = document.getElementById("sessionName").value.trim();
    const duration = Number(document.getElementById("sessionDuration").value);
    const date = document.getElementById("sessionDate").value;

    if (!name || duration < 1 || duration > 180 || !date) {
        document.getElementById("sessionMessage").textContent = "Please enter valid session details.";
        return;
    }

    const details = {
        name: name,
        category: document.getElementById("sessionCategory").value,
        duration: duration,
        date: date,
        notes: document.getElementById("sessionNotes").value.trim()
    };

    if (id) {
        const oldSession = sessions.find(session => session.id === Number(id));
        Object.assign(oldSession, details);
        showToast("Session updated successfully.");
    } else {
        sessions.push({
            id: Date.now(),
            userId: currentUser.id,
            ...details,
            status: "Pending",
            completedAt: ""
        });
        showToast("Session added successfully.");
    }

    saveData();
    closeModal("sessionModal");
    refreshPageData();
});

function editSession(id) {
    const session = sessions.find(item => item.id === id && item.userId === currentUser.id);
    if (!session) return;

    document.getElementById("sessionId").value = session.id;
    document.getElementById("sessionName").value = session.name;
    document.getElementById("sessionCategory").value = session.category;
    document.getElementById("sessionDuration").value = session.duration;
    document.getElementById("sessionDate").value = session.date;
    document.getElementById("sessionNotes").value = session.notes;
    document.getElementById("sessionModalTitle").textContent = "Edit session";
    openModal("sessionModal");
}

function toggleSessionStatus(id) {
    const session = sessions.find(item => item.id === id && item.userId === currentUser.id);
    if (!session) return;

    session.status = session.status === "Completed" ? "Pending" : "Completed";
    session.completedAt = session.status === "Completed" ? todayDate() : "";
    saveData();
    refreshPageData();
    showToast("Session status updated.");
}

function deleteSession(id) {
    if (!confirm("Do you want to delete this session?")) return;
    sessions = sessions.filter(item => !(item.id === id && item.userId === currentUser.id));
    saveData();
    refreshPageData();
    showToast("Session deleted.");
}

document.getElementById("sessionSearch").addEventListener("input", renderSessions);
document.getElementById("sessionFilter").addEventListener("change", renderSessions);

// ---------- SCHEDULES AND PLANS ----------
function myPlans() {
    return plans.filter(plan => plan.userId === currentUser.id);
}

function renderPlans() {
    const list = document.getElementById("planList");

    if (myPlans().length === 0) {
        list.innerHTML = '<div class="empty-state">No plans yet. Create a simple schedule for your practice.</div>';
        return;
    }

    list.innerHTML = myPlans().map(plan => `
        <article class="record-card">
            <div class="record-top"><h3>${escapeHTML(plan.name)}</h3><span class="badge completed">${plan.frequency}</span></div>
            <p>From ${plan.startDate} to ${plan.endDate}</p>
            <div class="record-actions">
                <button class="small-button" onclick="editPlan(${plan.id})">Edit</button>
                <button class="small-button delete" onclick="deletePlan(${plan.id})">Delete</button>
            </div>
        </article>
    `).join("");
}

document.getElementById("addPlanButton").addEventListener("click", () => {
    document.getElementById("planForm").reset();
    document.getElementById("planId").value = "";
    document.getElementById("planStart").value = todayDate();
    document.getElementById("planEnd").value = todayDate();
    document.getElementById("planModalTitle").textContent = "Create a plan";
    openModal("planModal");
});

document.getElementById("planForm").addEventListener("submit", event => {
    event.preventDefault();

    const id = document.getElementById("planId").value;
    const startDate = document.getElementById("planStart").value;
    const endDate = document.getElementById("planEnd").value;

    if (endDate < startDate) {
        document.getElementById("planMessage").textContent = "End date cannot be before start date.";
        return;
    }

    const details = {
        name: document.getElementById("planName").value.trim(),
        frequency: document.getElementById("planFrequency").value,
        startDate: startDate,
        endDate: endDate
    };

    if (!details.name) {
        document.getElementById("planMessage").textContent = "Please enter a plan name.";
        return;
    }

    if (id) {
        const oldPlan = plans.find(plan => plan.id === Number(id));
        Object.assign(oldPlan, details);
        showToast("Plan updated successfully.");
    } else {
        plans.push({ id: Date.now(), userId: currentUser.id, ...details });
        showToast("Plan created successfully.");
    }

    saveData();
    closeModal("planModal");
    refreshPageData();
});

function editPlan(id) {
    const plan = plans.find(item => item.id === id && item.userId === currentUser.id);
    if (!plan) return;

    document.getElementById("planId").value = plan.id;
    document.getElementById("planName").value = plan.name;
    document.getElementById("planFrequency").value = plan.frequency;
    document.getElementById("planStart").value = plan.startDate;
    document.getElementById("planEnd").value = plan.endDate;
    document.getElementById("planModalTitle").textContent = "Edit plan";
    openModal("planModal");
}

function deletePlan(id) {
    if (!confirm("Do you want to delete this plan?")) return;
    plans = plans.filter(item => !(item.id === id && item.userId === currentUser.id));
    saveData();
    refreshPageData();
    showToast("Plan deleted.");
}

// ---------- PROGRESS, HISTORY AND DASHBOARD ----------
function renderDashboard() {
    const mine = mySessions();
    const completed = mine.filter(session => session.status === "Completed");
    const minutes = completed.reduce((total, session) => total + session.duration, 0);

    document.getElementById("totalSessions").textContent = mine.length;
    document.getElementById("completedSessions").textContent = completed.length;
    document.getElementById("activePlans").textContent = myPlans().length;
    document.getElementById("totalMinutes").textContent = minutes;
    document.getElementById("historyCompleted").textContent = completed.length;
    document.getElementById("historyMinutes").textContent = minutes + " min";
}

function renderHistory() {
    const completed = mySessions().filter(session => session.status === "Completed");
    const list = document.getElementById("historyList");

    if (completed.length === 0) {
        list.innerHTML = '<div class="empty-state">Completed sessions will appear here.</div>';
        return;
    }

    list.innerHTML = completed.sort((a, b) => b.date.localeCompare(a.date)).map(session => `
        <div class="history-row">
            <div><strong>${escapeHTML(session.name)}</strong><small>${session.category} · ${session.duration} minutes</small></div>
            <span class="badge completed">${session.completedAt || session.date}</span>
        </div>
    `).join("");
}

// ---------- PROFILE MANAGEMENT ----------
function loadProfile() {
    document.getElementById("profileName").value = currentUser.name;
    document.getElementById("profileEmail").value = currentUser.email;
    document.getElementById("profileGoal").value = currentUser.goal || "";
}

document.getElementById("profileForm").addEventListener("submit", event => {
    event.preventDefault();

    const updatedName = document.getElementById("profileName").value.trim();
    if (updatedName.length < 2) {
        document.getElementById("profileMessage").textContent = "Name must contain at least 2 characters.";
        return;
    }

    currentUser.name = updatedName;
    currentUser.goal = document.getElementById("profileGoal").value.trim();

    const userIndex = users.findIndex(user => user.id === currentUser.id);
    users[userIndex] = currentUser;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
    saveData();
    updateUserHeader();
    document.getElementById("profileMessage").textContent = "Profile saved successfully.";
});

// ---------- ADMIN ROLE AND DASHBOARD ----------
function renderAdmin() {
    document.getElementById("adminUsers").textContent = users.filter(user => user.role === "user").length;
    document.getElementById("adminSessions").textContent = sessions.length;
    document.getElementById("adminPlans").textContent = plans.length;

    const members = users.filter(user => user.role === "user");
    const list = document.getElementById("adminUserList");

    if (members.length === 0) {
        list.innerHTML = '<div class="empty-state">No registered members yet.</div>';
        return;
    }

    list.innerHTML = members.map(user => `
        <div class="history-row">
            <div><strong>${escapeHTML(user.name)}</strong><small>${escapeHTML(user.email)}</small></div>
            <span class="badge">Member</span>
        </div>
    `).join("");
}

// ---------- REFRESH AND MODAL CONTROLS ----------
function refreshPageData() {
    renderDashboard();
    renderSessions();
    renderPlans();
    renderHistory();
    loadProfile();

    if (currentUser.role === "admin") {
        renderAdmin();
    }
}

document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => closeModal(button.dataset.close));
});

document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", event => {
        if (event.target === modal) closeModal(modal.id);
    });
});

// Open the app automatically if a user was already logged in.
if (currentUser) {
    const savedUser = users.find(user => user.id === currentUser.id);
    if (savedUser) {
        currentUser = savedUser;
        openApplication();
    } else {
        localStorage.removeItem(CURRENT_USER_KEY);
        currentUser = null;
    }
}
