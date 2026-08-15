// ======================================================
// CAMPUSCONNECT - STUDY BUDDY JS (COMPLETED)
// ======================================================

const token = localStorage.getItem("campusconnect_token");
const savedUser = localStorage.getItem("campusconnect_user");

// Protect page
if (!token || !savedUser) {
    window.location.replace("/");
}

let user;
try {
    user = JSON.parse(savedUser);
} catch (e) {
    localStorage.removeItem("campusconnect_token");
    localStorage.removeItem("campusconnect_user");
    window.location.replace("/");
}

// Global state
let currentTab = "questions"; // "questions", "resources", "buddies"
let allQuestions = [];
let allResources = [];
let allBuddies = [];

let currentQuestionId = null;
let currentChatPartnerId = null;
let activeChatInterval = null;

// DOM Elements
const navUserName = document.getElementById("navUserName");
const navStudentId = document.getElementById("navStudentId");
const userAvatar = document.getElementById("userAvatar");
const questionsContainer = document.getElementById("questionsContainer");
const questionSearch = document.getElementById("questionSearch");
const subjectFilter = document.getElementById("subjectFilter");

// Hero buttons
const askQuestionButton = document.getElementById("askQuestionButton");
const shareResourceButton = document.getElementById("shareResourceButton");

// Modals
const questionModal = document.getElementById("questionModal");
const closeQuestionModal = document.getElementById("closeQuestionModal");
const questionForm = document.getElementById("questionForm");

const questionDetailModal = document.getElementById("questionDetailModal");
const closeDetailModal = document.getElementById("closeDetailModal");
const answersContainer = document.getElementById("answersContainer");
const answerForm = document.getElementById("answerForm");

// New Modals
const resourceModal = document.getElementById("resourceModal");
const closeResourceModal = document.getElementById("closeResourceModal");
const resourceForm = document.getElementById("resourceForm");

const chatModal = document.getElementById("chatModal");
const closeChatModal = document.getElementById("closeChatModal");
const chatMessagesBody = document.getElementById("chatMessagesBody");
const chatInputForm = document.getElementById("chatInputForm");
const chatMessageInput = document.getElementById("chatMessageInput");

// Initialize User Profile in nav
if (user) {
    const firstName = user.fullName ? user.fullName.split(" ")[0] : "Student";
    navUserName.textContent = user.fullName || "Student";
    navStudentId.textContent = user.studentId || "";
    userAvatar.textContent = firstName.charAt(0).toUpperCase();
}

// Tab Switching
const tabs = document.querySelectorAll(".study-tabs .tab");
tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        currentTab = tab.getAttribute("data-tab");
        onTabChanged();
    });
});

function onTabChanged() {
    // Reset search inputs
    questionSearch.value = "";
    subjectFilter.value = "all";

    // Show/hide action buttons in Hero
    if (currentTab === "questions") {
        askQuestionButton.style.display = "inline-block";
        shareResourceButton.style.display = "none";
        questionSearch.placeholder = "Search questions, subjects or topics...";
        fetchQuestions();
    } else if (currentTab === "resources") {
        askQuestionButton.style.display = "none";
        shareResourceButton.style.display = "inline-block";
        questionSearch.placeholder = "Search study notes, books, links...";
        fetchResources();
    } else if (currentTab === "buddies") {
        askQuestionButton.style.display = "none";
        shareResourceButton.style.display = "none";
        questionSearch.placeholder = "Search buddies by name or skills...";
        fetchBuddies();
    }
}

// Search & Filter event listeners
questionSearch.addEventListener("input", filterAndSearchData);
subjectFilter.addEventListener("change", filterAndSearchData);

function filterAndSearchData() {
    const query = questionSearch.value.toLowerCase().trim();
    const filter = subjectFilter.value;

    if (currentTab === "questions") {
        let filtered = allQuestions;
        if (filter !== "all") {
            filtered = filtered.filter(q => q.subject.toLowerCase() === filter.toLowerCase());
        }
        if (query) {
            filtered = filtered.filter(q => 
                q.title.toLowerCase().includes(query) || 
                q.description.toLowerCase().includes(query)
            );
        }
        renderQuestions(filtered);
    } else if (currentTab === "resources") {
        let filtered = allResources;
        if (filter !== "all") {
            filtered = filtered.filter(r => r.subject.toLowerCase() === filter.toLowerCase());
        }
        if (query) {
            filtered = filtered.filter(r => 
                r.title.toLowerCase().includes(query) || 
                r.description.toLowerCase().includes(query)
            );
        }
        renderResources(filtered);
    } else if (currentTab === "buddies") {
        let filtered = allBuddies;
        if (filter !== "all") {
            filtered = filtered.filter(b => b.branch && b.branch.toLowerCase() === filter.toLowerCase());
        }
        if (query) {
            filtered = filtered.filter(b => 
                b.fullName.toLowerCase().includes(query) || 
                (b.bio && b.bio.toLowerCase().includes(query)) ||
                (b.skills && b.skills.some(s => s.toLowerCase().includes(query)))
            );
        }
        renderBuddies(filtered);
    }
}

// ======================================================
// QUESTIONS TAB LOGIC
// ======================================================

async function fetchQuestions() {
    questionsContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: #8b8291;">Loading doubts...</div>`;
    try {
        const response = await fetch("/api/questions", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            allQuestions = data.questions;
            if (currentTab === "questions") renderQuestions(allQuestions);
        } else {
            questionsContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: #dc2626;">Failed to load questions: ${data.message}</div>`;
        }
    } catch (error) {
        console.error("Fetch questions error:", error);
        questionsContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: #dc2626;">Server connection failed.</div>`;
    }
}

function renderQuestions(questions) {
    if (questions.length === 0) {
        questionsContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: #8b8291;">No doubts found. Be the first to ask!</div>`;
        return;
    }

    questionsContainer.innerHTML = questions.map(q => {
        const authorName = q.user ? q.user.fullName : "Unknown Student";
        const authorMeta = q.user ? `${q.user.branch || "General"} • ${q.user.year ? q.user.year + ' yr' : 'Student'}` : "";
        const authorInitials = authorName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
        
        let subjectClass = "";
        if (q.subject === "CSE" || q.subject === "IT") subjectClass = "cse";
        else if (q.subject === "ECE") subjectClass = "graphics";
        else if (q.subject === "Mechanical") subjectClass = "dbms";

        const timeStr = new Date(q.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        return `
            <article class="large-question" onclick="viewQuestionDetails('${q._id}')" style="cursor: pointer;">
                <div class="question-top">
                    <span class="subject-pill ${subjectClass}">${q.subject.toUpperCase()}</span>
                    <span class="question-time">${timeStr}</span>
                </div>
                <h3>${escapeHTML(q.title)}</h3>
                <p>${escapeHTML(q.description.slice(0, 180))}${q.description.length > 180 ? '...' : ''}</p>
                
                <div class="large-question-footer" onclick="event.stopPropagation()">
                    <div class="person">
                        <div class="avatar small" style="width: 28px; height: 28px; border-radius: 8px; background: #7c4aa8; color: white; display: grid; place-items: center; font-size: 10px; font-weight: 700;">
                            ${authorInitials}
                        </div>
                        <div>
                            <strong>${escapeHTML(authorName)}</strong>
                            <small>${escapeHTML(authorMeta)}</small>
                        </div>
                    </div>
                    <div class="question-actions">
                        <button onclick="viewQuestionDetails('${q._id}')">Answer →</button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

async function viewQuestionDetails(id) {
    currentQuestionId = id;
    try {
        const response = await fetch(`/api/questions/${id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            const q = data.question;
            const answers = data.answers;

            document.getElementById("detailSubject").textContent = q.subject.toUpperCase();
            document.getElementById("detailTitle").textContent = q.title;
            document.getElementById("detailDesc").textContent = q.description;
            
            const authorName = q.user ? q.user.fullName : "Unknown Student";
            const authorMeta = q.user ? `${q.user.branch || "General"} • Year ${q.user.year || ""}` : "";
            document.getElementById("detailAuthor").textContent = authorName;
            document.getElementById("detailMeta").textContent = authorMeta;
            document.getElementById("detailAvatar").textContent = authorName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

            renderAnswers(answers);
            questionDetailModal.classList.add("show");
        } else {
            alert("Failed to load question details: " + data.message);
        }
    } catch (error) {
        console.error("View question detail error:", error);
        alert("Server connection failed.");
    }
}

function renderAnswers(answers) {
    if (answers.length === 0) {
        answersContainer.innerHTML = `<div style="text-align: center; padding: 20px; color: #8b8291; font-size: 11px;">No answers yet. Share your knowledge!</div>`;
        return;
    }

    answersContainer.innerHTML = answers.map(ans => {
        const ansAuthor = ans.user ? ans.user.fullName : "Student";
        const ansMeta = ans.user ? `${ans.user.branch} • Year ${ans.user.year}` : "";
        const ansInitials = ansAuthor.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
        
        return `
            <div style="background: #faf8fb; padding: 12px; border-radius: 12px; border: 1px solid #f0ebf2;">
                <p style="font-size: 11px; line-height: 1.5; color: #322641; margin-bottom: 8px; white-space: pre-line;">${escapeHTML(ans.answer)}</p>
                <div class="person">
                    <div style="width: 20px; height: 20px; border-radius: 6px; background: #e5d9ee; color: #47236b; display: grid; place-items: center; font-size: 8px; font-weight: 700;">
                        ${ansInitials}
                    </div>
                    <div>
                        <strong style="font-size: 8px;">${escapeHTML(ansAuthor)}</strong>
                        <small style="font-size: 7px; color: #a49aa9;">${escapeHTML(ansMeta)}</small>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

answerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const answerText = document.getElementById("newAnswerText").value.trim();
    if (!answerText || !currentQuestionId) return;

    try {
        const response = await fetch(`/api/questions/${currentQuestionId}/answers`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                user: user.id || user._id,
                answer: answerText
            })
        });

        const data = await response.json();
        if (data.success) {
            document.getElementById("newAnswerText").value = "";
            viewQuestionDetails(currentQuestionId);
            fetchQuestions();
        } else {
            alert("Failed to submit answer: " + data.message);
        }
    } catch (error) {
        console.error("Answer submission error:", error);
        alert("Server connection failed.");
    }
});

questionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("newQuestionTitle").value.trim();
    const subject = document.getElementById("newQuestionSubject").value;
    const description = document.getElementById("newQuestionDesc").value.trim();

    if (!title || !subject || !description) return;

    try {
        const response = await fetch("/api/questions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                user: user.id || user._id,
                title,
                subject,
                description
            })
        });

        const data = await response.json();
        if (data.success) {
            questionForm.reset();
            questionModal.classList.remove("show");
            fetchQuestions();
        } else {
            alert("Failed to list question: " + data.message);
        }
    } catch (error) {
        console.error("Question posting error:", error);
        alert("Server connection failed.");
    }
});

// ======================================================
// STUDY RESOURCES TAB LOGIC
// ======================================================

async function fetchResources() {
    questionsContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: #8b8291;">Loading study resources...</div>`;
    try {
        const response = await fetch("/api/resources", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            allResources = data.resources;
            if (currentTab === "resources") renderResources(allResources);
        } else {
            questionsContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: #dc2626;">Failed to load resources: ${data.message}</div>`;
        }
    } catch (error) {
        console.error("Fetch resources error:", error);
        questionsContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: #dc2626;">Server connection failed.</div>`;
    }
}

function renderResources(resources) {
    if (resources.length === 0) {
        questionsContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: #8b8291;">No study materials found. Be the first to share!</div>`;
        return;
    }

    questionsContainer.innerHTML = resources.map(r => {
        const authorName = r.user ? r.user.fullName : "Unknown Student";
        const authorMeta = r.user ? `${r.user.branch || "General"} • ${r.user.year ? r.user.year + ' yr' : 'Student'}` : "";
        const authorInitials = authorName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

        let subjectClass = "";
        if (r.subject === "CSE" || r.subject === "IT") subjectClass = "cse";
        else if (r.subject === "ECE") subjectClass = "graphics";
        else if (r.subject === "Mechanical") subjectClass = "dbms";

        const currentUserId = user.id || user._id;
        const isOwnResource = r.user && (r.user._id === currentUserId || r.user === currentUserId);

        return `
            <article class="large-question" style="position: relative;">
                <div class="question-top">
                    <span class="subject-pill ${subjectClass}">${r.subject.toUpperCase()}</span>
                    <span class="question-time" style="background: var(--purple-100); color: var(--purple-800); border-radius: 4px; padding: 2px 6px; font-weight: 700; font-size: 8px;">${r.fileType}</span>
                </div>
                <h3>${escapeHTML(r.title)}</h3>
                <p>${escapeHTML(r.description)}</p>
                
                <div class="large-question-footer" onclick="event.stopPropagation()">
                    <div class="person">
                        <div class="avatar small" style="width: 28px; height: 28px; border-radius: 8px; background: #6d28d9; color: white; display: grid; place-items: center; font-size: 10px; font-weight: 700;">
                            ${authorInitials}
                        </div>
                        <div>
                            <strong>${escapeHTML(authorName)}</strong>
                            <small>${escapeHTML(authorMeta)}</small>
                        </div>
                    </div>
                    <div class="question-actions" style="display: flex; gap: 8px;">
                        <a href="${r.fileUrl}" target="_blank" class="button button-dark" style="padding: 6px 12px; font-size: 10px; border-radius: 6px; color: white; display: inline-block; text-align: center;">View Material ↗</a>
                        ${isOwnResource ? `
                            <button onclick="deleteResource('${r._id}')" style="background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; padding: 6px 12px; font-size: 10px; border-radius: 6px; cursor: pointer;">Delete</button>
                        ` : ''}
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

resourceForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("newResourceTitle").value.trim();
    const subject = document.getElementById("newResourceSubject").value;
    const fileType = document.getElementById("newResourceType").value;
    const fileUrl = document.getElementById("newResourceUrl").value.trim();
    const description = document.getElementById("newResourceDesc").value.trim();

    if (!title || !subject || !fileUrl || !description) return;

    try {
        const response = await fetch("/api/resources", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ title, subject, fileType, fileUrl, description })
        });

        const data = await response.json();
        if (data.success) {
            resourceForm.reset();
            resourceModal.classList.remove("show");
            fetchResources();
        } else {
            alert("Failed to share resource: " + data.message);
        }
    } catch (error) {
        console.error("Resource share error:", error);
        alert("Server connection failed.");
    }
});

async function deleteResource(id) {
    if (!confirm("Are you sure you want to delete this resource listing?")) return;
    try {
        const response = await fetch(`/api/resources/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            fetchResources();
        } else {
            alert("Failed to delete resource: " + data.message);
        }
    } catch (error) {
        console.error("Delete resource error:", error);
        alert("Server connection failed.");
    }
}

// ======================================================
// FIND STUDY BUDDIES TAB LOGIC
// ======================================================

async function fetchBuddies() {
    questionsContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: #8b8291;">Loading campus buddies...</div>`;
    try {
        const response = await fetch("/api/auth/buddies", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            allBuddies = data.buddies;
            if (currentTab === "buddies") renderBuddies(allBuddies);
        } else {
            questionsContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: #dc2626;">Failed to load buddies: ${data.message}</div>`;
        }
    } catch (error) {
        console.error("Fetch buddies error:", error);
        questionsContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: #dc2626;">Server connection failed.</div>`;
    }
}

function renderBuddies(buddies) {
    if (buddies.length === 0) {
        questionsContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: #8b8291;">No potential study buddies found on campus yet.</div>`;
        return;
    }

    questionsContainer.innerHTML = buddies.map(b => {
        const buddyInitials = b.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
        const branchDisplay = b.branch || "General";
        const yearDisplay = b.year ? `${b.year} Year` : "Student";

        return `
            <article class="large-question" style="background: white; border: 1px solid var(--border); border-radius: var(--radius); padding: 25px;">
                <div class="question-top" style="margin-bottom: 12px;">
                    <span class="subject-pill cse">${escapeHTML(branchDisplay)}</span>
                    <span class="question-time" style="font-weight: 700; color: var(--purple-700); font-size: 8px;">${escapeHTML(yearDisplay)}</span>
                </div>
                <h3>${escapeHTML(b.fullName)}</h3>
                <p style="font-style: italic; color: #473a51; margin-bottom: 15px;">${escapeHTML(b.bio || "No bio description added yet.")}</p>
                
                <div class="skills" style="margin-bottom: 20px;">
                    ${b.skills && b.skills.length > 0 
                        ? b.skills.map(s => `<span>${escapeHTML(s.trim())}</span>`).join("") 
                        : '<span>No skills listed yet</span>'
                    }
                </div>
                
                <div class="large-question-footer" onclick="event.stopPropagation()">
                    <div style="font-size: 9px; color: var(--muted);">📧 ${escapeHTML(b.email)}</div>
                    <div class="question-actions">
                        <button class="button button-dark" onclick="openBuddyChat('${b._id}', '${escapeHTML(b.fullName)}', '${escapeHTML(branchDisplay)} • ${escapeHTML(yearDisplay)}')" style="padding: 6px 15px; font-size: 10px; border-radius: 6px;">Message Buddy →</button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

// Buddy Chat Modal logic
async function openBuddyChat(buddyId, buddyName, buddyMeta) {
    currentChatPartnerId = buddyId;
    document.getElementById("chatBuddyName").textContent = buddyName;
    document.getElementById("chatBuddyMeta").textContent = buddyMeta;
    document.getElementById("chatBuddyAvatar").textContent = buddyName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    chatMessagesBody.innerHTML = `<div style="text-align: center; font-size: 10px; color: #8b8291; padding: 20px;">Loading chat history...</div>`;
    chatModal.classList.add("show");

    await fetchChatMessages();

    // Poll message list every 3 seconds
    activeChatInterval = setInterval(fetchChatMessages, 3000);
}

async function fetchChatMessages() {
    if (!currentChatPartnerId) return;

    try {
        const currentUserId = user.id || user._id;
        const response = await fetch(`/api/messages/${currentUserId}/${currentChatPartnerId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            renderChatMessages(data.messages);
        }
    } catch (error) {
        console.error("Fetch chat messages error:", error);
    }
}

function renderChatMessages(messages) {
    if (messages.length === 0) {
        chatMessagesBody.innerHTML = `<div style="text-align: center; font-size: 10px; color: #8b8291; padding: 20px;">No messages yet. Say hello to start learning together!</div>`;
        return;
    }

    const currentUserId = user.id || user._id;
    const isScrolledToBottom = chatMessagesBody.scrollHeight - chatMessagesBody.clientHeight <= chatMessagesBody.scrollTop + 30;

    chatMessagesBody.innerHTML = messages.map(msg => {
        const isSentByMe = msg.sender === currentUserId;
        const msgClass = isSentByMe ? "sent" : "received";
        const timeStr = new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="chat-message ${msgClass}">
                <div style="font-size: 11px;">${escapeHTML(msg.message)}</div>
                <div style="font-size: 8px; text-align: right; margin-top: 4px; opacity: 0.7;">${timeStr}</div>
            </div>
        `;
    }).join("");

    if (isScrolledToBottom) {
        chatMessagesBody.scrollTop = chatMessagesBody.scrollHeight;
    }
}

chatInputForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msgText = chatMessageInput.value.trim();
    const currentUserId = user.id || user._id;
    if (!msgText || !currentChatPartnerId || !currentUserId) return;

    try {
        const response = await fetch("/api/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                sender: currentUserId,
                receiver: currentChatPartnerId,
                message: msgText
            })
        });

        const data = await response.json();
        if (data.success) {
            chatMessageInput.value = "";
            await fetchChatMessages();
            chatMessagesBody.scrollTop = chatMessagesBody.scrollHeight;
        } else {
            alert("Failed to send message: " + data.message);
        }
    } catch (error) {
        console.error("Message send error:", error);
        alert("Server connection failed.");
    }
});

// ======================================================
// MODAL CLICKS AND HELPERS
// ======================================================

// Open Question Modal
askQuestionButton.addEventListener("click", () => {
    questionModal.classList.add("show");
});

closeQuestionModal.addEventListener("click", () => {
    questionModal.classList.remove("show");
});

// Close Detail Modal
closeDetailModal.addEventListener("click", () => {
    questionDetailModal.classList.remove("show");
    currentQuestionId = null;
});

// Open Resource Modal
shareResourceButton.addEventListener("click", () => {
    resourceModal.classList.add("show");
});

closeResourceModal.addEventListener("click", () => {
    resourceModal.classList.remove("show");
});

// Close Chat Modal
closeChatModal.addEventListener("click", () => {
    chatModal.classList.remove("show");
    clearInterval(activeChatInterval);
    activeChatInterval = null;
    currentChatPartnerId = null;
});

// Close modals when clicking outside
window.addEventListener("click", (e) => {
    if (e.target === questionModal) {
        questionModal.classList.remove("show");
    }
    if (e.target === questionDetailModal) {
        questionDetailModal.classList.remove("show");
        currentQuestionId = null;
    }
    if (e.target === resourceModal) {
        resourceModal.classList.remove("show");
    }
    if (e.target === chatModal) {
        chatModal.classList.remove("show");
        clearInterval(activeChatInterval);
        activeChatInterval = null;
        currentChatPartnerId = null;
    }
});

// Helpers
function escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function logout() {
    localStorage.removeItem("campusconnect_token");
    localStorage.removeItem("campusconnect_user");
    window.location.replace("/");
}

// Initial load
fetchQuestions();
