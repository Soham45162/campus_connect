// ======================================================
// CAMPUSCONNECT - STUDY BUDDY JS
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
let allQuestions = [];
let currentQuestionId = null;

// DOM Elements
const navUserName = document.getElementById("navUserName");
const navStudentId = document.getElementById("navStudentId");
const userAvatar = document.getElementById("userAvatar");

const questionsContainer = document.getElementById("questionsContainer");
const questionSearch = document.getElementById("questionSearch");
const subjectFilter = document.getElementById("subjectFilter");

// Modals
const questionModal = document.getElementById("questionModal");
const askQuestionButton = document.getElementById("askQuestionButton");
const closeQuestionModal = document.getElementById("closeQuestionModal");
const questionForm = document.getElementById("questionForm");

const questionDetailModal = document.getElementById("questionDetailModal");
const closeDetailModal = document.getElementById("closeDetailModal");
const answersContainer = document.getElementById("answersContainer");
const answerForm = document.getElementById("answerForm");

// Initialize User Profile in nav
if (user) {
    const firstName = user.fullName ? user.fullName.split(" ")[0] : "Student";
    navUserName.textContent = user.fullName || "Student";
    navStudentId.textContent = user.studentId || "";
    userAvatar.textContent = firstName.charAt(0).toUpperCase();
}

// Fetch all questions
async function fetchQuestions() {
    try {
        const response = await fetch("/api/questions", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (data.success) {
            allQuestions = data.questions;
            renderQuestions(allQuestions);
        } else {
            questionsContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: #dc2626;">Failed to load questions: ${data.message}</div>`;
        }
    } catch (error) {
        console.error("Fetch questions error:", error);
        questionsContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: #dc2626;">Server connection failed.</div>`;
    }
}

// Render questions list
function renderQuestions(questions) {
    if (questions.length === 0) {
        questionsContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: #8b8291;">No questions found. Be the first to ask!</div>`;
        return;
    }

    questionsContainer.innerHTML = questions.map(q => {
        const authorName = q.user ? q.user.fullName : "Unknown Student";
        const authorMeta = q.user ? `${q.user.branch || "General"} • ${q.user.year ? q.user.year + ' yr' : 'Student'}` : "";
        const authorInitials = authorName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
        
        // Subject pill classes
        let subjectClass = "";
        if (q.subject === "CSE" || q.subject === "IT") subjectClass = "cse";
        else if (q.subject === "ECE") subjectClass = "graphics"; // mapped to existing gold theme
        else if (q.subject === "Mechanical") subjectClass = "dbms"; // mapped to existing green theme

        // Format date
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

// Fetch and display single question details + answers
async function viewQuestionDetails(id) {
    currentQuestionId = id;
    try {
        const response = await fetch(`/api/questions/${id}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
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

            // Render answers
            renderAnswers(answers);

            // Show Modal
            questionDetailModal.classList.add("show");
        } else {
            alert("Failed to load question details: " + data.message);
        }
    } catch (error) {
        console.error("View question detail error:", error);
        alert("Server connection failed.");
    }
}

// Render answers list
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

// Add Answer form submission
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
                user: user.id,
                answer: answerText
            })
        });

        const data = await response.json();
        if (data.success) {
            document.getElementById("newAnswerText").value = "";
            // Reload details to show the new answer
            viewQuestionDetails(currentQuestionId);
            // Refresh main questions page list to update answer count
            fetchQuestions();
        } else {
            alert("Failed to submit answer: " + data.message);
        }
    } catch (error) {
        console.error("Answer submission error:", error);
        alert("Server connection failed.");
    }
});

// Post question form submission
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
                user: user.id,
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

// Open & Close Question Modal
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

// Close modals when clicking outside
window.addEventListener("click", (e) => {
    if (e.target === questionModal) {
        questionModal.classList.remove("show");
    }
    if (e.target === questionDetailModal) {
        questionDetailModal.classList.remove("show");
        currentQuestionId = null;
    }
});

// Search & Filter event listeners
questionSearch.addEventListener("input", filterAndSearchQuestions);
subjectFilter.addEventListener("change", filterAndSearchQuestions);

function filterAndSearchQuestions() {
    const query = questionSearch.value.toLowerCase().trim();
    const sub = subjectFilter.value;

    let filtered = allQuestions;

    if (sub !== "all") {
        filtered = filtered.filter(q => q.subject.toLowerCase() === sub.toLowerCase());
    }

    if (query) {
        filtered = filtered.filter(q => 
            q.title.toLowerCase().includes(query) || 
            q.description.toLowerCase().includes(query)
        );
    }

    renderQuestions(filtered);
}

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
