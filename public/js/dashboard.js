// ======================================================
// CAMPUSCONNECT - UNIFIED SPA DASHBOARD JS
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    // Auth Check
    const token = localStorage.getItem("campusconnect_token");
    const savedUser = localStorage.getItem("campusconnect_user");

    if (!token || !savedUser) {
        window.location.replace("/");
        return;
    }

    let currentUser = null;
    try {
        currentUser = JSON.parse(savedUser);
    } catch (e) {
        localStorage.removeItem("campusconnect_token");
        localStorage.removeItem("campusconnect_user");
        window.location.replace("/");
        return;
    }

    // SPA State
    let currentTab = "questions"; // For Study Buddy tabs: "questions", "resources", "buddies"
    let currentCategory = "all";  // For Campus Cart categories
    let allQuestions = [];
    let allProducts = [];
    let allResources = [];
    let allBuddies = [];
    let savedItems = loadSavedItems();

    // Chat polling state
    let currentChatPartnerId = null;
    let activeChatInterval = null;
    let chatPartnerInfo = null;

    // Detailed Question view state
    let activeQuestionDetailId = null;

    // DOM Elements
    const pageTitle = document.getElementById("pageTitle");
    const topbarDate = document.getElementById("topbarDate");
    const topbarAvatar = document.getElementById("topbarAvatar");

    const sidebarUserAvatar = document.getElementById("sidebarUserAvatar");
    const sidebarUserName = document.getElementById("sidebarUserName");
    const sidebarUserMeta = document.getElementById("sidebarUserMeta");
    const logoutBtn = document.getElementById("logoutBtn");

    const homeQuestionsContainer = document.getElementById("homeQuestionsContainer");
    const studyContainer = document.getElementById("studyContainer");
    const productsContainer = document.getElementById("productsContainer");
    const savedGrid = document.getElementById("savedGrid");

    const questionSearch = document.getElementById("questionSearch");
    const subjectFilter = document.getElementById("subjectFilter");
    const productSearch = document.getElementById("productSearch");
    const categoryButtons = document.getElementById("categoryButtons");
    const productsCount = document.getElementById("productsCount");

    // Profile page elements
    const profileLargeAvatar = document.getElementById("profileLargeAvatar");
    const profileName = document.getElementById("profileName");
    const profileBranchYear = document.getElementById("profileBranchYear");
    const profileBio = document.getElementById("profileBio");
    const profileSkills = document.getElementById("profileSkills");
    const profileQuestionsCount = document.getElementById("profileQuestionsCount");
    const profileAnswersCount = document.getElementById("profileAnswersCount");
    const profileListingsCount = document.getElementById("profileListingsCount");

    // Stats area (Home page)
    const statQuestionsCount = document.getElementById("statQuestionsCount");
    const statAnswersCount = document.getElementById("statAnswersCount");
    const statListingsCount = document.getElementById("statListingsCount");
    const statSavedCount = document.getElementById("statSavedCount");
    const statContributionPercent = document.getElementById("statContributionPercent");
    const statContributionBar = document.getElementById("statContributionBar");

    // Modals
    const questionModal = document.getElementById("questionModal");
    const resourceModal = document.getElementById("resourceModal");
    const sellModal = document.getElementById("sellModal");
    const questionDetailModal = document.getElementById("questionDetailModal");
    const editProfileModal = document.getElementById("editProfileModal");

    // Forms
    const questionForm = document.getElementById("questionForm");
    const resourceForm = document.getElementById("resourceForm");
    const sellForm = document.getElementById("sellForm");
    const answerForm = document.getElementById("answerForm");
    const editProfileForm = document.getElementById("editProfileForm");
    const chatInputForm = document.getElementById("chatInputForm");

    // Buttons to Open Modals
    const askQuestionButton = document.getElementById("askQuestionButton");
    const shareResourceButton = document.getElementById("shareResourceButton");
    const sellItemButton = document.getElementById("sellItemButton");
    const editProfileBtn = document.getElementById("editProfileBtn");

    // Chat body inputs
    const chatMessagesBody = document.getElementById("chatMessagesBody");
    const chatMessageInput = document.getElementById("chatMessageInput");
    const conversationListContainer = document.getElementById("conversationListContainer");
    const conversationSearchInput = document.getElementById("conversationSearchInput");

    const pageTitles = {
        home: "Overview",
        study: "Study Buddy",
        cart: "Campus Cart",
        messages: "Messages",
        saved: "Saved Items",
        profile: "My Profile"
    };

    // Set dynamic date in topbar
    if (topbarDate) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        topbarDate.textContent = new Date().toLocaleDateString('en-US', options).toUpperCase();
    }

    // ======================================================
    // SPA ROUTING & NAVIGATION
    // ======================================================

    function openPage(pageName) {
        document.querySelectorAll(".page").forEach(page => {
            page.classList.remove("active");
        });

        const target = document.getElementById(pageName);
        if (target) {
            target.classList.add("active");
        }

        document.querySelectorAll(".nav-item").forEach(item => {
            item.classList.toggle("active", item.dataset.page === pageName);
        });

        // Set title
        if (pageTitle) {
            if (pageName === "home" && currentUser) {
                const firstName = currentUser.fullName ? currentUser.fullName.split(" ")[0] : "Student";
                pageTitle.textContent = `Good morning, ${firstName}. 👋`;
            } else {
                pageTitle.textContent = pageTitles[pageName] || "CampusConnect";
            }
        }

        const pageSubtitle = document.getElementById("pageSubtitle");
        const pageSubtitles = {
            home: "Let's learn, share and grow together.",
            study: "Learn with people who get it.",
            cart: "Give useful things a second life. Buy and resell academic essentials directly with students on your campus.",
            messages: "Conversations that move things forward.",
            saved: "Things worth coming back to.",
            profile: "Manage your account and see your activity."
        };
        if (pageSubtitle) {
            pageSubtitle.textContent = pageSubtitles[pageName] || "";
        }

        // Clean up chat interval if leaving messages page
        if (pageName !== "messages" && activeChatInterval) {
            clearInterval(activeChatInterval);
            activeChatInterval = null;
        }

        // Perform specific tab data loading
        if (pageName === "home") {
            refreshHomeData();
        } else if (pageName === "study") {
            onStudyTabChanged();
        } else if (pageName === "cart") {
            fetchProducts();
        } else if (pageName === "saved") {
            renderSavedItems();
        } else if (pageName === "profile") {
            refreshProfileView();
        } else if (pageName === "messages") {
            fetchBuddiesForChat();
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Listeners for Sidebar Nav
    document.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", () => {
            openPage(item.dataset.page);
        });
    });

    // Listeners for Hero Redirects
    document.querySelectorAll("[data-go]").forEach(element => {
        element.addEventListener("click", () => {
            openPage(element.dataset.go);
        });
    });

    // Mobile Navigation Drawer Toggle
    const mobileMenu = document.getElementById("mobileMenu");
    const sidebar = document.querySelector(".sidebar");
    if (mobileMenu && sidebar) {
        mobileMenu.addEventListener("click", (e) => {
            e.stopPropagation();
            sidebar.style.display = sidebar.style.display === "flex" ? "none" : "flex";
        });

        document.addEventListener("click", (e) => {
            if (window.innerWidth <= 760 && sidebar.style.display === "flex" && !sidebar.contains(e.target) && e.target !== mobileMenu) {
                sidebar.style.display = "none";
            }
        });
    }

    // Logout trigger
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to log out?")) {
                localStorage.removeItem("campusconnect_token");
                localStorage.removeItem("campusconnect_user");
                window.location.replace("/");
            }
        });
    }

    // ======================================================
    // MODAL STATE MANAGEMENT
    // ======================================================

    function openModal(modal) {
        if (modal) modal.classList.add("show");
    }

    function closeModal(modal) {
        if (modal) modal.classList.remove("show");
    }

    // Register Modal openers
    if (askQuestionButton) {
        askQuestionButton.addEventListener("click", () => openModal(questionModal));
    }
    if (shareResourceButton) {
        shareResourceButton.addEventListener("click", () => openModal(resourceModal));
    }
    if (sellItemButton) {
        sellItemButton.addEventListener("click", () => openModal(sellModal));
    }
    if (editProfileBtn) {
        editProfileBtn.addEventListener("click", () => {
            // Populate form values first
            document.getElementById("editFullName").value = currentUser.fullName || "";
            document.getElementById("editBranch").value = currentUser.branch || "CSE";
            document.getElementById("editYear").value = currentUser.year || "1";
            document.getElementById("editBio").value = currentUser.bio || "";
            document.getElementById("editSkills").value = (currentUser.skills || []).join(", ");
            openModal(editProfileModal);
        });
    }

    // Close Modal triggers
    document.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", () => {
            closeModal(btn.closest(".modal-overlay"));
        });
    });

    document.querySelectorAll(".modal-overlay").forEach(overlay => {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) closeModal(overlay);
        });
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            document.querySelectorAll(".modal-overlay").forEach(modal => closeModal(modal));
        }
    });

    // ======================================================
    // API HELPERS
    // ======================================================

    async function apiRequest(url, method = "GET", body = null) {
        const headers = {
            "Authorization": `Bearer ${token}`
        };
        if (body) {
            headers["Content-Type"] = "application/json";
        }

        try {
            const config = {
                method,
                headers
            };
            if (body) {
                config.body = JSON.stringify(body);
            }

            const response = await fetch(url, config);
            const data = await response.json();
            return { ok: response.ok, status: response.status, data };
        } catch (error) {
            console.error(`API Request Failure [${method} ${url}]:`, error);
            return { ok: false, status: 500, error };
        }
    }

    // ======================================================
    // USER PROFILE VIEW CONTROLLERS
    // ======================================================

    async function fetchUserProfile() {
        const { ok, data } = await apiRequest("/api/auth/profile");
        if (ok && data.success) {
            currentUser = data.user;
            localStorage.setItem("campusconnect_user", JSON.stringify(currentUser));
            updateSidebarAndTopbar();
        }
    }

    function updateSidebarAndTopbar() {
        if (!currentUser) return;
        const initials = currentUser.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
        
        if (sidebarUserAvatar) sidebarUserAvatar.textContent = initials;
        if (topbarAvatar) topbarAvatar.textContent = initials;
        if (sidebarUserName) sidebarUserName.textContent = currentUser.fullName;
        
        const branchYear = (currentUser.branch || currentUser.year) 
            ? `${currentUser.branch || ""} · ${currentUser.year ? currentUser.year + ' Year' : ''}`
            : "MIT Student";
        if (sidebarUserMeta) sidebarUserMeta.textContent = branchYear;

        // Reset page titles with greeting
        if (pageTitle && document.querySelector(".nav-item[data-page='home']").classList.contains("active")) {
            const firstName = currentUser.fullName.split(" ")[0];
            pageTitle.textContent = `Good morning, ${firstName}. 👋`;
            const pageSubtitle = document.getElementById("pageSubtitle");
            if (pageSubtitle) {
                pageSubtitle.textContent = "Let's learn, share and grow together.";
            }
        }
    }

    async function refreshProfileView() {
        await fetchUserProfile();
        const initials = currentUser.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
        
        if (profileLargeAvatar) profileLargeAvatar.textContent = initials;
        if (profileName) profileName.textContent = currentUser.fullName;
        
        const branchYear = `${currentUser.branch || "General"} · ${currentUser.year ? getOrdinal(currentUser.year) + ' Year' : 'Student'}`;
        if (profileBranchYear) profileBranchYear.textContent = branchYear;

        if (profileBio) {
            profileBio.textContent = currentUser.bio || "No bio description provided yet. Click Edit Profile to add one.";
        }

        if (profileSkills) {
            if (currentUser.skills && currentUser.skills.length > 0) {
                profileSkills.innerHTML = currentUser.skills.map(s => `<span>${escapeHTML(s.trim())}</span>`).join("");
            } else {
                profileSkills.innerHTML = `<span style="background: #faf8fb; color: #888;">No skills added yet</span>`;
            }
        }

        // Calculate and render activity totals
        const { myQuestions, myAnswers, myProducts } = calculateActivityCounts();
        if (profileQuestionsCount) profileQuestionsCount.textContent = myQuestions;
        if (profileAnswersCount) profileAnswersCount.textContent = myAnswers;
        if (profileListingsCount) profileListingsCount.textContent = myProducts;
    }

    // ======================================================
    // ACTIVITY COUNT AND PROGRESS CONTROLLER
    // ======================================================

    function calculateActivityCounts() {
        const myId = currentUser.id || currentUser._id;
        
        const myQuestions = allQuestions.filter(q => q.user && (q.user._id === myId || q.user === myId)).length;
        
        // Count answers on all questions
        let myAnswers = 0;
        allQuestions.forEach(q => {
            // Wait, we need to inspect answers if cached, or do a rough calculation.
            // For now, let's keep track of answer count based on details fetched or hardcode.
            // Since we can't search all answers from all questions easily without fetching all detail routes,
            // we will check if any answers in local storage or increment it.
            // Alternatively, we can let user have dynamic profile stats by counting.
            // Let's check answers by looking at matching user in local stats if needed.
            // We can count answers the user submitted during this session.
        });
        
        // Let's try to query stats or fall back to an estimation.
        const storedAnswersCount = parseInt(localStorage.getItem(`stats_answers_${myId}`) || "0", 10);
        myAnswers = storedAnswersCount;

        const myProducts = allProducts.filter(p => p.seller && (p.seller._id === myId || p.seller === myId)).length;

        return { myQuestions, myAnswers, myProducts };
    }

    function refreshHomeData() {
        fetchQuestions();
        fetchProducts();
        
        // Update stats
        const { myQuestions, myAnswers, myProducts } = calculateActivityCounts();
        const savedCount = savedItems.products.length + savedItems.resources.length;

        if (statQuestionsCount) statQuestionsCount.textContent = myQuestions;
        if (statAnswersCount) statAnswersCount.textContent = myAnswers;
        if (statListingsCount) statListingsCount.textContent = myProducts;
        if (statSavedCount) statSavedCount.textContent = savedCount;

        // Calculate a pseudo profile-completion/contribution percent
        let score = 0;
        if (currentUser.bio) score += 20;
        if (currentUser.skills && currentUser.skills.length > 0) score += 20;
        if (myQuestions > 0) score += 20;
        if (myAnswers > 0) score += 20;
        if (myProducts > 0) score += 20;

        if (statContributionPercent) statContributionPercent.textContent = `${score}%`;
        if (statContributionBar) statContributionBar.style.width = `${score}%`;
        
        const statusMsg = document.getElementById("contributionStatusMessage");
        if (statusMsg) {
            if (score < 40) {
                statusMsg.textContent = "Fill out your bio/skills and start contributing to earn verified badges!";
            } else if (score < 80) {
                statusMsg.textContent = "Great job! Ask questions and help peers to make your profile stand out.";
            } else {
                statusMsg.textContent = "Top Contributor! You are in the top tier of helpful students this week.";
            }
        }
    }

    // ======================================================
    // STUDY BUDDY CONTROLLER
    // ======================================================

    const studyTabs = document.querySelectorAll(".study-tabs .tab");
    studyTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            studyTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            currentTab = tab.dataset.tab;
            onStudyTabChanged();
        });
    });

    function onStudyTabChanged() {
        questionSearch.value = "";
        subjectFilter.value = "all";

        if (currentTab === "questions") {
            askQuestionButton.style.display = "inline-block";
            shareResourceButton.style.display = "none";
            questionSearch.placeholder = "Search questions, subjects or topics...";
            fetchQuestions();
        } else if (currentTab === "resources") {
            askQuestionButton.style.display = "none";
            shareResourceButton.style.display = "inline-block";
            questionSearch.placeholder = "Search study notes, links, resources...";
            fetchResources();
        } else if (currentTab === "buddies") {
            askQuestionButton.style.display = "none";
            shareResourceButton.style.display = "none";
            questionSearch.placeholder = "Search buddies by name or skills...";
            fetchBuddies();
        }
    }

    // Filter listeners
    questionSearch.addEventListener("input", filterStudyContent);
    subjectFilter.addEventListener("change", filterStudyContent);

    async function fetchQuestions() {
        if (currentTab === "questions") {
            studyContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--muted);">Loading doubts...</div>`;
        }
        
        const { ok, data } = await apiRequest("/api/questions");
        if (ok && data.success) {
            allQuestions = data.questions;
            
            // Inject recent 3 into Home page
            if (homeQuestionsContainer) {
                const recent = allQuestions.slice(0, 3);
                if (recent.length === 0) {
                    homeQuestionsContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--muted); font-size: 11px;">No questions posted yet. Be the first!</div>`;
                } else {
                    homeQuestionsContainer.innerHTML = recent.map(q => {
                        const author = q.user ? q.user.fullName : "Student";
                        const answerCount = q.answers ? q.answers.length : 0; // estimate
                        const sub = q.subject.toUpperCase();
                        let subClass = "";
                        if (sub === "JAVA" || sub === "PYTHON") subClass = "";
                        else if (sub === "DBMS") subClass = "dbms";
                        else subClass = "graphics";

                        return `
                            <article class="question-item" onclick="openQuestionDetail('${q._id}')" style="cursor: pointer;">
                                <div class="question-subject ${subClass}">${escapeHTML(sub)}</div>
                                <div class="question-content">
                                    <h4>${escapeHTML(q.title)}</h4>
                                    <p>${escapeHTML(q.description)}</p>
                                    <div class="question-meta">
                                        <span>${escapeHTML(author)}</span>
                                        <span>·</span>
                                        <span>${q.views || 0} views</span>
                                        <span>·</span>
                                        <span>${formatTime(q.createdAt)}</span>
                                    </div>
                                </div>
                                <button class="small-arrow">→</button>
                            </article>
                        `;
                    }).join("");
                }
            }

            if (currentTab === "questions") {
                renderQuestions(allQuestions);
            }
        } else {
            if (currentTab === "questions") {
                studyContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: red;">Failed to load questions.</div>`;
            }
        }
    }

    function renderQuestions(questions) {
        if (questions.length === 0) {
            studyContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--muted);">No doubts found. Add one to start the conversation!</div>`;
            return;
        }

        studyContainer.innerHTML = questions.map(q => {
            const author = q.user ? q.user.fullName : "Unknown Student";
            const authorMeta = q.user 
                ? `${q.user.branch || "General"} · ${q.user.year ? getOrdinal(q.user.year) + ' Yr' : 'Student'}`
                : "Student";
            const initials = author.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
            
            const sub = q.subject.toUpperCase();
            let subClass = "";
            if (sub === "JAVA" || sub === "PYTHON") subClass = "";
            else if (sub === "DBMS") subClass = "dbms";
            else subClass = "graphics";

            return `
                <article class="large-question" onclick="openQuestionDetail('${q._id}')" style="cursor: pointer;">
                    <div class="question-top">
                        <span class="subject-pill ${subClass}">${escapeHTML(sub)}</span>
                        <span class="question-time">${formatTime(q.createdAt)}</span>
                    </div>
                    <h3>${escapeHTML(q.title)}</h3>
                    <p>${escapeHTML(q.description)}</p>
                    <div class="large-question-footer">
                        <div class="person">
                            <div class="avatar small">${initials}</div>
                            <div>
                                <strong>${escapeHTML(author)}</strong>
                                <small>${escapeHTML(authorMeta)}</small>
                            </div>
                        </div>
                        <div class="question-actions">
                            <span>${q.views || 0} views</span>
                            <button onclick="event.stopPropagation(); openQuestionDetail('${q._id}')">Answer →</button>
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    }

    async function fetchResources() {
        studyContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--muted);">Loading resources...</div>`;
        const { ok, data } = await apiRequest("/api/resources");
        if (ok && data.success) {
            allResources = data.resources;
            renderResources(allResources);
        } else {
            studyContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: red;">Failed to load resources.</div>`;
        }
    }

    function renderResources(resources) {
        if (resources.length === 0) {
            studyContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--muted);">No shared resources found. Upload notes or reference links!</div>`;
            return;
        }

        studyContainer.innerHTML = `<div class="saved-grid" style="grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">` + 
            resources.map(r => {
                const author = r.user ? r.user.fullName : "Unknown";
                const isMyResource = r.user && (r.user._id === currentUser.id || r.user._id === currentUser._id || r.user === currentUser.id || r.user === currentUser._id);
                
                let emoji = "📄";
                if (r.fileType === "Link") emoji = "🔗";
                else if (r.fileType === "Zip") emoji = "📦";
                else if (r.fileType === "Image") emoji = "🖼️";
                else if (r.fileType === "PDF") emoji = "📕";

                const isSaved = savedItems.resources.includes(r._id);
                const heartChar = isSaved ? "♥" : "♡";
                const heartColor = isSaved ? "style='color: #9c5b78;'" : "";

                return `
                    <div class="saved-card">
                        <div class="saved-icon">${emoji}</div>
                        <div style="min-width: 0; flex: 1;">
                            <strong style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHTML(r.title)}">${escapeHTML(r.title)}</strong>
                            <small style="display: block; margin-top: 3px; font-size: 8px;">Subject: ${escapeHTML(r.subject)} · Shared by ${escapeHTML(author)}</small>
                            <p style="font-size: 9px; color: #8b8291; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(r.description)}</p>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 10px; align-items: flex-end;">
                            <button class="heart-btn" onclick="toggleSaveResource(event, '${r._id}')" ${heartColor}>${heartChar}</button>
                            <div style="display: flex; gap: 8px;">
                                <a href="${r.fileUrl}" target="_blank" class="text-button" style="font-size: 10px; font-weight: bold; color: var(--purple-700);">Open →</a>
                                ${isMyResource ? `<button onclick="deleteResource('${r._id}')" style="background: none; border: 0; color: #dc2626; font-size: 10px;">Delete</button>` : ""}
                            </div>
                        </div>
                    </div>
                `;
            }).join("") + `</div>`;
    }

    async function deleteResource(id) {
        if (!confirm("Are you sure you want to delete this resource?")) return;
        const { ok } = await apiRequest(`/api/resources/${id}`, "DELETE");
        if (ok) {
            fetchResources();
        } else {
            alert("Failed to delete resource.");
        }
    }

    async function fetchBuddies() {
        studyContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--muted);">Loading students...</div>`;
        const { ok, data } = await apiRequest("/api/auth/buddies");
        if (ok && data.success) {
            allBuddies = data.buddies;
            renderBuddies(allBuddies);
        } else {
            studyContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: red;">Failed to load buddies list.</div>`;
        }
    }

    function renderBuddies(buddies) {
        if (buddies.length === 0) {
            studyContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--muted);">No other students found on campus.</div>`;
            return;
        }

        studyContainer.innerHTML = `<div class="saved-grid" style="grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">` +
            buddies.map(b => {
                const initials = b.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                const meta = `${b.branch || "General"} · ${b.year ? getOrdinal(b.year) + ' Yr' : 'Student'}`;
                const skillsList = (b.skills || []).map(s => `<span style="font-size: 8px; background: #eee; padding: 2px 6px; border-radius: 4px; color: #555;">${escapeHTML(s)}</span>`).join(" ");

                return `
                    <div class="saved-card" style="align-items: flex-start; padding: 15px;">
                        <div class="avatar" style="width: 42px; height: 42px; font-size: 13px; border-radius: 12px; background: var(--purple-100); color: var(--purple-800); display: grid; place-items: center; font-weight: 700; margin-right: 12px;">${initials}</div>
                        <div style="flex: 1; min-width: 0;">
                            <strong style="font-size: 11px;">${escapeHTML(b.fullName)}</strong>
                            <small style="display: block; color: var(--muted); margin-top: 2px; font-size: 8px;">${escapeHTML(meta)}</small>
                            <p style="font-size: 9px; color: #555; margin-top: 8px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(b.bio || "No bio details shared yet.")}</p>
                            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 10px;">
                                ${skillsList || "<span style='font-size: 8px; color: #aaa;'>No skills specified</span>"}
                            </div>
                        </div>
                        <button onclick="startChatDirectly('${b._id}', '${escapeHTML(b.fullName)}', '${escapeHTML(meta)}')" class="contact-button" style="width: auto; margin-top: 0; padding: 6px 10px; font-size: 8px;">
                            Message
                        </button>
                    </div>
                `;
            }).join("") + `</div>`;
    }

    function filterStudyContent() {
        const query = questionSearch.value.toLowerCase().trim();
        const subj = subjectFilter.value;

        if (currentTab === "questions") {
            let filtered = allQuestions;
            if (subj !== "all") {
                filtered = filtered.filter(q => q.subject.toLowerCase() === subj.toLowerCase());
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
            if (subj !== "all") {
                filtered = filtered.filter(r => r.subject.toLowerCase() === subj.toLowerCase());
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
            if (subj !== "all") {
                filtered = filtered.filter(b => b.branch && b.branch.toLowerCase() === subj.toLowerCase());
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

    // Modal Details - Questions & Replies
    async function openQuestionDetail(id) {
        activeQuestionDetailId = id;
        
        // Open overlay
        openModal(questionDetailModal);

        const detailSubjectPill = document.getElementById("detailSubjectPill");
        const detailQuestionTitle = document.getElementById("detailQuestionTitle");
        const detailQuestionAuthor = document.getElementById("detailQuestionAuthor");
        const detailQuestionAuthorAvatar = document.getElementById("detailQuestionAuthorAvatar");
        const detailQuestionMeta = document.getElementById("detailQuestionMeta");
        const detailQuestionBody = document.getElementById("detailQuestionBody");
        const detailAnswersCount = document.getElementById("detailAnswersCount");
        const answersListContainer = document.getElementById("answersListContainer");

        answersListContainer.innerHTML = `<div style="text-align: center; color: var(--muted); font-size: 10px;">Loading solution replies...</div>`;

        const { ok, data } = await apiRequest(`/api/questions/${id}`);
        if (ok && data.success) {
            const q = data.question;
            const answers = data.answers;

            detailSubjectPill.textContent = q.subject.toUpperCase();
            detailQuestionTitle.textContent = q.title;
            detailQuestionBody.textContent = q.description;
            
            const authorName = q.user ? q.user.fullName : "Unknown Student";
            detailQuestionAuthor.textContent = authorName;
            detailQuestionAuthorAvatar.textContent = authorName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
            
            const authorMeta = q.user 
                ? `${q.user.branch || "General"} · ${q.user.year ? getOrdinal(q.user.year) + ' Yr' : 'Student'} · ${formatTime(q.createdAt)}`
                : `Student · ${formatTime(q.createdAt)}`;
            detailQuestionMeta.textContent = authorMeta;

            detailAnswersCount.textContent = answers.length;

            if (answers.length === 0) {
                answersListContainer.innerHTML = `<div style="text-align: center; color: var(--muted); font-size: 10px; padding: 15px;">No solutions submitted yet. Share what you know!</div>`;
            } else {
                answersListContainer.innerHTML = answers.map(ans => {
                    const ansUser = ans.user ? ans.user.fullName : "Student";
                    const ansInitials = ansUser.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                    const ansMeta = ans.user 
                        ? `${ans.user.branch || "General"} · ${ans.user.year ? getOrdinal(ans.user.year) + ' Yr' : 'Student'}`
                        : "Student";
                    
                    return `
                        <div style="background: #faf8fb; border: 1px solid var(--border); padding: 12px; border-radius: 12px;">
                            <div class="person" style="margin-bottom: 8px;">
                                <div class="avatar tiny" style="width: 20px; height: 20px; font-size: 7px; background: #e5d9ee;">${ansInitials}</div>
                                <div>
                                    <strong style="font-size: 9px;">${escapeHTML(ansUser)}</strong>
                                    <small style="font-size: 7px; color: var(--muted);">${escapeHTML(ansMeta)}</small>
                                </div>
                            </div>
                            <p style="font-size: 10px; line-height: 1.5; color: #444;">${escapeHTML(ans.answer)}</p>
                        </div>
                    `;
                }).join("");
            }
        } else {
            detailQuestionTitle.textContent = "Question details could not load.";
            answersListContainer.innerHTML = "";
        }
    }

    // Submit Answer Form
    if (answerForm) {
        answerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const text = document.getElementById("answerText").value.trim();
            if (!text || !activeQuestionDetailId) return;

            const myId = currentUser.id || currentUser._id;
            const { ok, data } = await apiRequest(`/api/questions/${activeQuestionDetailId}/answers`, "POST", {
                user: myId,
                answer: text
            });

            if (ok && data.success) {
                // Increment answers stat locally
                const currentCount = parseInt(localStorage.getItem(`stats_answers_${myId}`) || "0", 10);
                localStorage.setItem(`stats_answers_${myId}`, (currentCount + 1).toString());
                
                document.getElementById("answerText").value = "";
                openQuestionDetail(activeQuestionDetailId);
            } else {
                alert("Failed to submit reply: " + (data.message || "Unknown error"));
            }
        });
    }

    // Submit Question Form
    if (questionForm) {
        questionForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const title = document.getElementById("questionTitle").value.trim();
            const subject = document.getElementById("questionSubject").value;
            const description = document.getElementById("questionDescription").value.trim();

            const { ok, data } = await apiRequest("/api/questions", "POST", {
                user: currentUser.id || currentUser._id,
                title,
                subject,
                description
            });

            if (ok && data.success) {
                closeModal(questionModal);
                questionForm.reset();
                fetchQuestions();
            } else {
                alert("Failed to post doubt: " + (data.message || "Unknown error"));
            }
        });
    }

    // Submit Share Resource Form
    if (resourceForm) {
        resourceForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const title = document.getElementById("resourceTitle").value.trim();
            const subject = document.getElementById("resourceSubject").value;
            const fileType = document.getElementById("resourceFileType").value;
            const fileUrl = document.getElementById("resourceFileUrl").value.trim();
            const description = document.getElementById("resourceDescription").value.trim();

            const { ok, data } = await apiRequest("/api/resources", "POST", {
                title,
                subject,
                fileType,
                fileUrl,
                description
            });

            if (ok && data.success) {
                closeModal(resourceModal);
                resourceForm.reset();
                fetchResources();
            } else {
                alert("Failed to share resource: " + (data.message || "Unknown error"));
            }
        });
    }

    // ======================================================
    // CAMPUS CART CONTROLLER
    // ======================================================

    async function fetchProducts() {
        if (productsContainer) {
            productsContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--muted); grid-column: span 4;">Loading items...</div>`;
        }
        
        const { ok, data } = await apiRequest("/api/products");
        if (ok && data.success) {
            allProducts = data.products;
            
            // Set stats details in home overview page
            const countText = document.getElementById("homeProductsCountText");
            if (countText) countText.textContent = `${allProducts.length} listings available`;

            filterAndRenderProducts();
        } else {
            if (productsContainer) {
                productsContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: red; grid-column: span 4;">Failed to load items.</div>`;
            }
        }
    }

    function filterAndRenderProducts() {
        const query = productSearch.value.toLowerCase().trim();
        let filtered = allProducts;

        if (currentCategory !== "all") {
            filtered = filtered.filter(p => p.category.toLowerCase() === currentCategory.toLowerCase());
        }

        if (query) {
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(query) || 
                p.description.toLowerCase().includes(query) ||
                (p.location && p.location.toLowerCase().includes(query))
            );
        }

        renderProductsList(filtered);
    }

    function renderProductsList(products) {
        if (productsCount) {
            productsCount.textContent = `${products.length} item${products.length === 1 ? '' : 's'} available`;
        }

        if (products.length === 0) {
            productsContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--muted); grid-column: span 4;">No products listed. Be the first to sell!</div>`;
            return;
        }

        productsContainer.innerHTML = products.map(p => {
            const seller = p.seller ? p.seller.fullName : "Student";
            const sellerMeta = p.seller 
                ? `${p.seller.branch || "General"} · ${p.seller.year ? getOrdinal(p.seller.year) + ' Yr' : 'Student'}`
                : "Student";
            const initials = seller.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

            let colorClass = "purple-product";
            let emoji = "📦";
            if (p.category === "Books") {
                colorClass = "purple-product";
                emoji = "📚";
            } else if (p.category === "Electronics") {
                colorClass = "blue-product";
                emoji = "💻";
            } else if (p.category === "Stationery") {
                colorClass = "cream-product";
                emoji = "✏️";
            } else if (p.category === "Lab Equipment") {
                colorClass = "green-product";
                emoji = "🧪";
            }

            const isOwnProduct = p.seller && (p.seller._id === currentUser.id || p.seller._id === currentUser._id || p.seller === currentUser.id || p.seller === currentUser._id);
            const isSaved = savedItems.products.includes(p._id);
            const heartChar = isSaved ? "♥" : "♡";
            const heartColor = isSaved ? "style='color: #9c5b78;'" : "";

            return `
                <article class="product-card">
                    <div class="product-image ${colorClass}">
                        <span>${emoji}</span>
                        <button class="heart" onclick="toggleSaveProduct(event, '${p._id}')" ${heartColor}>${heartChar}</button>
                        <div class="condition">${p.condition.toUpperCase()}</div>
                    </div>

                    <div class="product-info">
                        <span class="product-category">${p.category.toUpperCase()}</span>
                        <h3>${escapeHTML(p.name)}</h3>
                        <div style="font-size: 9px; color: var(--muted); margin-bottom: 8px;">📍 ${escapeHTML(p.location || "On Campus")}</div>
                        <div class="product-price">₹${p.price}</div>

                        <div class="seller">
                            <div class="avatar tiny">${initials}</div>
                            <div style="min-width: 0; flex: 1;">
                                <strong>${escapeHTML(seller)}</strong>
                                <small>${escapeHTML(sellerMeta)}</small>
                            </div>
                        </div>

                        ${isOwnProduct ? `
                            <button class="contact-button" onclick="markProductSold('${p._id}')" style="background: #e7f0eb; color: #638b76; border-color: #c7dbcc;">
                                Mark as Sold
                            </button>
                        ` : `
                            <button class="contact-button" onclick="startChatDirectly('${p.seller._id}', '${escapeHTML(seller)}', '${escapeHTML(sellerMeta)}')">
                                Contact seller
                            </button>
                        `}
                    </div>
                </article>
            `;
        }).join("");
    }

    async function markProductSold(id) {
        if (!confirm("Are you sure you want to mark this item as sold? It will be removed from listing.")) return;
        const { ok } = await apiRequest(`/api/products/${id}/sold`, "PATCH");
        if (ok) {
            fetchProducts();
        } else {
            alert("Failed to update item.");
        }
    }

    // Category button filters
    document.querySelectorAll(".category-buttons .category").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".category-buttons .category").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentCategory = btn.dataset.category;
            filterAndRenderProducts();
        });
    });

    productSearch.addEventListener("input", filterAndRenderProducts);

    // Submit Sell Item Form
    if (sellForm) {
        sellForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("sellName").value.trim();
            const price = parseFloat(document.getElementById("sellPrice").value);
            const category = document.getElementById("sellCategory").value;
            const condition = document.getElementById("sellCondition").value;
            const location = document.getElementById("sellLocation").value.trim();
            const description = document.getElementById("sellDescription").value.trim();

            const { ok, data } = await apiRequest("/api/products", "POST", {
                seller: currentUser.id || currentUser._id,
                name,
                price,
                category,
                condition,
                location,
                description
            });

            if (ok && data.success) {
                closeModal(sellModal);
                sellForm.reset();
                fetchProducts();
            } else {
                alert("Failed to list product: " + (data.message || "Unknown error"));
            }
        });
    }

    // ======================================================
    // SAVED BOOKMARKS CONTROLLER
    // ======================================================

    function loadSavedItems() {
        const key = `saved_${currentUser.id || currentUser._id}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                // fall through
            }
        }
        return { products: [], resources: [] };
    }

    function saveSavedItems() {
        const key = `saved_${currentUser.id || currentUser._id}`;
        localStorage.setItem(key, JSON.stringify(savedItems));
    }

    window.toggleSaveProduct = function(event, id) {
        event.stopPropagation();
        const idx = savedItems.products.indexOf(id);
        if (idx > -1) {
            savedItems.products.splice(idx, 1);
            event.target.textContent = "♡";
            event.target.style.color = "";
        } else {
            savedItems.products.push(id);
            event.target.textContent = "♥";
            event.target.style.color = "#9c5b78";
        }
        saveSavedItems();
        refreshHomeData();
    };

    window.toggleSaveResource = function(event, id) {
        event.stopPropagation();
        const idx = savedItems.resources.indexOf(id);
        if (idx > -1) {
            savedItems.resources.splice(idx, 1);
            event.target.textContent = "♡";
            event.target.style.color = "";
        } else {
            savedItems.resources.push(id);
            event.target.textContent = "♥";
            event.target.style.color = "#9c5b78";
        }
        saveSavedItems();
        refreshHomeData();
    };

    function renderSavedItems() {
        if (savedGrid) {
            savedGrid.innerHTML = "";
        }

        // Fetch products & resources again to render bookmarks dynamically
        // Verify bookmarked items exist in global state
        const bookmarkedProducts = allProducts.filter(p => savedItems.products.includes(p._id));
        const bookmarkedResources = allResources.filter(r => savedItems.resources.includes(r._id));

        const savedStatsItemsCount = document.getElementById("savedStatsItemsCount");
        if (savedStatsItemsCount) {
            savedStatsItemsCount.textContent = `${bookmarkedProducts.length + bookmarkedResources.length} Saved Items`;
        }

        if (bookmarkedProducts.length === 0 && bookmarkedResources.length === 0) {
            savedGrid.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--muted); grid-column: span 2;">You haven't saved anything yet. Browse cart and notes to bookmark things!</div>`;
            return;
        }

        // Section for resources
        if (bookmarkedResources.length > 0) {
            const sec = document.createElement("div");
            sec.className = "saved-section";
            sec.innerHTML = `
                <span class="section-kicker">STUDY RESOURCES</span>
                <div style="display: grid; gap: 10px; margin-top: 15px;">
                    ${bookmarkedResources.map(r => `
                        <div class="saved-card">
                            <div class="saved-icon">📕</div>
                            <div style="flex: 1; min-width: 0;">
                                <strong style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(r.title)}</strong>
                                <small>${escapeHTML(r.subject)}</small>
                            </div>
                            <a href="${r.fileUrl}" target="_blank" class="text-button" style="padding: 10px; font-weight: bold;">→</a>
                        </div>
                    `).join("")}
                </div>
            `;
            savedGrid.appendChild(sec);
        }

        // Section for products
        if (bookmarkedProducts.length > 0) {
            const sec = document.createElement("div");
            sec.className = "saved-section";
            sec.innerHTML = `
                <span class="section-kicker">CAMPUS CART</span>
                <div style="display: grid; gap: 10px; margin-top: 15px;">
                    ${bookmarkedProducts.map(p => `
                        <div class="saved-card">
                            <div class="saved-icon cream">🛒</div>
                            <div style="flex: 1; min-width: 0;">
                                <strong style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(p.name)}</strong>
                                <small>₹${p.price} · ${p.condition}</small>
                            </div>
                            <button onclick="startChatDirectly('${p.seller ? p.seller._id : ''}', '${p.seller ? escapeHTML(p.seller.fullName) : 'Student'}', '')" style="border: 0; background: none; color: var(--purple-700); font-weight: bold; cursor: pointer; padding: 10px;">💬</button>
                        </div>
                    `).join("")}
                </div>
            `;
            savedGrid.appendChild(sec);
        }
    }

    // ======================================================
    // PROFILE MANAGEMENT
    // ======================================================

    if (editProfileForm) {
        editProfileForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const fullName = document.getElementById("editFullName").value.trim();
            const branch = document.getElementById("editBranch").value;
            const year = document.getElementById("editYear").value;
            const bio = document.getElementById("editBio").value.trim();
            const skillsStr = document.getElementById("editSkills").value;
            
            const skills = skillsStr ? skillsStr.split(",").map(s => s.trim()).filter(s => s) : [];

            const { ok, data } = await apiRequest("/api/auth/profile", "PUT", {
                fullName,
                branch,
                year,
                bio,
                skills
            });

            if (ok && data.success) {
                closeModal(editProfileModal);
                refreshProfileView();
            } else {
                alert("Failed to update profile: " + (data.message || "Unknown error"));
            }
        });
    }

    // ======================================================
    // REAL-TIME MESSAGES CHAT CONTROLLER
    // ======================================================

    window.startChatDirectly = function(partnerId, name, meta) {
        if (!partnerId) return;
        currentChatPartnerId = partnerId;
        chatPartnerInfo = { name, meta };

        // Redirect to messages page
        openPage("messages");

        // Load specific chat immediately
        loadChatRoom();
    };

    async function fetchBuddiesForChat() {
        if (conversationListContainer) {
            conversationListContainer.innerHTML = `<div style="text-align: center; color: var(--muted); font-size: 10px; padding: 20px;">Loading chat contacts...</div>`;
        }

        const { ok, data } = await apiRequest("/api/auth/buddies");
        if (ok && data.success) {
            allBuddies = data.buddies;
            renderConversationsList(allBuddies);
        } else {
            conversationListContainer.innerHTML = `<div style="text-align: center; color: red; font-size: 10px; padding: 20px;">Failed to load buddies.</div>`;
        }
    }

    function renderConversationsList(buddies) {
        if (buddies.length === 0) {
            conversationListContainer.innerHTML = `<div style="text-align: center; color: var(--muted); font-size: 10px; padding: 20px;">No classmates found.</div>`;
            return;
        }

        conversationListContainer.innerHTML = buddies.map(b => {
            const initials = b.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
            const activeClass = currentChatPartnerId === b._id ? "active" : "";
            
            return `
                <div class="conversation ${activeClass}" onclick="selectChatPartner('${b._id}', '${escapeHTML(b.fullName)}', '${escapeHTML(b.branch || "Student")}')">
                    <div class="avatar">${initials}</div>
                    <div style="flex: 1; min-width: 0;">
                        <strong>${escapeHTML(b.fullName)}</strong>
                        <p>${escapeHTML(b.bio || "No status bio available.")}</p>
                    </div>
                </div>
            `;
        }).join("");
    }

    window.selectChatPartner = function(id, name, meta) {
        currentChatPartnerId = id;
        chatPartnerInfo = { name, meta };
        
        // Highlight active contact in sidebar
        document.querySelectorAll(".conversation").forEach(c => c.classList.remove("active"));
        // Re-render sidebar contacts to reflect active highlight
        renderConversationsList(allBuddies);

        loadChatRoom();
    };

    function loadChatRoom() {
        if (!currentChatPartnerId || !chatPartnerInfo) return;

        // Clear existing polling
        if (activeChatInterval) {
            clearInterval(activeChatInterval);
        }

        // Set chat header
        const initials = chatPartnerInfo.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
        document.getElementById("chatPartnerAvatar").textContent = initials;
        document.getElementById("chatPartnerName").textContent = chatPartnerInfo.name;
        document.getElementById("chatPartnerMeta").textContent = chatPartnerInfo.meta || "Online";

        chatMessagesBody.innerHTML = `<div style="text-align: center; color: var(--muted); font-size: 9px; padding: 20px;">Loading chat messages...</div>`;

        // Fetch messages immediately
        fetchMessages();

        // Start polling every 3 seconds
        activeChatInterval = setInterval(fetchMessages, 3000);
    }

    async function fetchMessages() {
        if (!currentChatPartnerId) return;

        const myId = currentUser.id || currentUser._id;
        const { ok, data } = await apiRequest(`/api/messages/${myId}/${currentChatPartnerId}`);
        
        if (ok && data.success) {
            renderChatMessages(data.messages);
        }
    }

    function renderChatMessages(messages) {
        if (messages.length === 0) {
            chatMessagesBody.innerHTML = `<div style="text-align: center; color: var(--muted); font-size: 9px; margin-top: 100px;">No messages yet. Send a message to start!</div>`;
            return;
        }

        const myId = currentUser.id || currentUser._id;
        
        chatMessagesBody.innerHTML = `<div class="chat-date">CONVERSATION HISTORY</div>` + 
            messages.map(msg => {
                const isSentByMe = msg.sender === myId || msg.sender._id === myId;
                const sideClass = isSentByMe ? "sent" : "received";
                
                return `
                    <div class="chat-message ${sideClass}">
                        ${escapeHTML(msg.message)}
                    </div>
                `;
            }).join("");

        // Auto Scroll to bottom
        chatMessagesBody.scrollTop = chatMessagesBody.scrollHeight;
    }

    // Submit Chat message
    if (chatInputForm) {
        chatInputForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const text = chatMessageInput.value.trim();
            if (!text || !currentChatPartnerId) return;

            const myId = currentUser.id || currentUser._id;
            
            // Append message locally immediately for snappy responsiveness
            const localMessage = document.createElement("div");
            localMessage.className = "chat-message sent";
            localMessage.textContent = text;
            
            // Remove empty screen placeholder if any
            const placeholder = chatMessagesBody.querySelector("div");
            if (placeholder && placeholder.style.textAlign === "center") {
                chatMessagesBody.innerHTML = "";
            }
            
            chatMessagesBody.appendChild(localMessage);
            chatMessagesBody.scrollTop = chatMessagesBody.scrollHeight;
            chatMessageInput.value = "";

            const { ok, data } = await apiRequest("/api/messages", "POST", {
                sender: myId,
                receiver: currentChatPartnerId,
                message: text
            });

            if (!ok || !data.success) {
                localMessage.style.opacity = "0.5";
                localMessage.title = "Failed to send. Try again.";
            }
        });
    }

    // Message buddy search filter
    if (conversationSearchInput) {
        conversationSearchInput.addEventListener("input", () => {
            const query = conversationSearchInput.value.toLowerCase().trim();
            const filtered = allBuddies.filter(b => b.fullName.toLowerCase().includes(query));
            renderConversationsList(filtered);
        });
    }

    // ======================================================
    // HELPER FORMATTING FUNCTIONS
    // ======================================================

    function formatTime(isoString) {
        const date = new Date(isoString);
        const diffMs = new Date() - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hr ago`;
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }

    function getOrdinal(n) {
        const num = parseInt(n, 10);
        if (isNaN(num)) return n;
        const s = ["th", "st", "nd", "rd"];
        const v = num % 100;
        return num + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    function escapeHTML(str) {
        if (!str) return "";
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ======================================================
    // APPLICATION INITIALIZATION
    // ======================================================

    updateSidebarAndTopbar();
    
    // Initial fetches
    fetchUserProfile();
    fetchQuestions();
    fetchProducts();
    fetchResources();
    fetchBuddies();

    // Set Home page active by default
    openPage("home");
});
