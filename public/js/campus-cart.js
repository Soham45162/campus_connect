// ======================================================
// CAMPUSCONNECT - CAMPUS CART JS
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
let allProducts = [];
let currentCategory = "all";
let activeChatInterval = null;
let currentChatPartnerId = null;

// DOM Elements
const navUserName = document.getElementById("navUserName");
const navStudentId = document.getElementById("navStudentId");
const userAvatar = document.getElementById("userAvatar");

const productsContainer = document.getElementById("productsContainer");
const productSearch = document.getElementById("productSearch");
const categoryButtons = document.getElementById("categoryButtons");
const itemsCount = document.getElementById("itemsCount");

// Modals
const sellModal = document.getElementById("sellModal");
const sellItemButton = document.getElementById("sellItemButton");
const closeSellModal = document.getElementById("closeSellModal");
const sellForm = document.getElementById("sellForm");

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

// Fetch all products
async function fetchProducts() {
    try {
        const response = await fetch("/api/products", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (data.success) {
            allProducts = data.products;
            filterAndRenderProducts();
        } else {
            productsContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: #dc2626; grid-column: span 4;">Failed to load products: ${data.message}</div>`;
        }
    } catch (error) {
        console.error("Fetch products error:", error);
        productsContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: #dc2626; grid-column: span 4;">Server connection failed.</div>`;
    }
}

// Render product cards
function renderProducts(products) {
    itemsCount.textContent = `${products.length} item${products.length === 1 ? '' : 's'} available`;

    if (products.length === 0) {
        productsContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: #8b8291; grid-column: span 4;">No items found. Be the first to list something!</div>`;
        return;
    }

    productsContainer.innerHTML = products.map(p => {
        const sellerName = p.seller ? p.seller.fullName : "Unknown Seller";
        const sellerMeta = p.seller ? `${p.seller.branch || "General"} • ${p.seller.year ? p.seller.year + ' yr' : 'Student'}` : "";
        const sellerInitials = sellerName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
        
        // Color themes based on category
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

        const isOwnListing = p.seller && p.seller._id === user.id;

        return `
            <article class="product-card">
                <div class="product-image ${colorClass}">
                    <span>${emoji}</span>
                    <div class="condition">${p.condition.toUpperCase()}</div>
                </div>

                <div class="product-info">
                    <span class="product-category">${p.category.toUpperCase()}</span>
                    <h3>${escapeHTML(p.name)}</h3>
                    <div style="font-size: 10px; color: #8b8291; margin-bottom: 8px;">📍 ${escapeHTML(p.location)}</div>
                    <div class="product-price">₹${p.price}</div>

                    <div class="seller">
                        <div class="avatar tiny" style="width: 22px; height: 22px; border-radius: 6px; background: #cdb8dc; color: #47236b; display: grid; place-items: center; font-size: 8px; font-weight: 700;">
                            ${sellerInitials}
                        </div>
                        <div>
                            <strong>${escapeHTML(sellerName)}</strong>
                            <small>${escapeHTML(sellerMeta)}</small>
                        </div>
                    </div>

                    ${isOwnListing ? `
                        <button class="contact-button" onclick="markAsSold('${p._id}')" style="background: #e7f0eb; color: #638b76; border-color: #c7dbcc;">
                            Mark as Sold
                        </button>
                    ` : `
                        <button class="contact-button" onclick="openChat('${p.seller._id}', '${escapeHTML(sellerName)}', '${escapeHTML(sellerMeta)}')">
                            Contact Seller
                        </button>
                    `}
                </div>
            </article>
        `;
    }).join("");
}

// Mark product as sold
async function markAsSold(id) {
    if (!confirm("Are you sure you want to mark this item as sold? It will be removed from the marketplace.")) return;

    try {
        const response = await fetch(`/api/products/${id}/sold`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (data.success) {
            fetchProducts();
        } else {
            alert("Failed to update listing: " + data.message);
        }
    } catch (error) {
        console.error("Mark sold error:", error);
        alert("Server connection failed.");
    }
}

// Open chat modal with seller
async function openChat(sellerId, sellerName, sellerMeta) {
    currentChatPartnerId = sellerId;
    document.getElementById("chatSellerName").textContent = sellerName;
    document.getElementById("chatSellerMeta").textContent = sellerMeta;
    document.getElementById("chatSellerAvatar").textContent = sellerName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    chatMessagesBody.innerHTML = `<div style="text-align: center; font-size: 10px; color: #8b8291; padding: 20px;">Loading chat history...</div>`;
    chatModal.classList.add("show");

    // Fetch messages immediately
    await fetchChatMessages();

    // Start polling every 3 seconds
    activeChatInterval = setInterval(fetchChatMessages, 3000);
}

// Fetch messages between logged-in user and seller
async function fetchChatMessages() {
    if (!currentChatPartnerId) return;

    try {
        const response = await fetch(`/api/messages/${user.id}/${currentChatPartnerId}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (data.success) {
            renderChatMessages(data.messages);
        }
    } catch (error) {
        console.error("Fetch chat messages error:", error);
    }
}

// Render messages inside chat window
function renderChatMessages(messages) {
    if (messages.length === 0) {
        chatMessagesBody.innerHTML = `<div style="text-align: center; font-size: 10px; color: #8b8291; padding: 20px;">No messages yet. Say hello to start the conversation!</div>`;
        return;
    }

    const isScrolledToBottom = chatMessagesBody.scrollHeight - chatMessagesBody.clientHeight <= chatMessagesBody.scrollTop + 30;

    chatMessagesBody.innerHTML = messages.map(msg => {
        const isSentByMe = msg.sender === user.id;
        const msgClass = isSentByMe ? "sent" : "received";
        const timeStr = new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="chat-message ${msgClass}">
                <div style="font-size: 11px;">${escapeHTML(msg.message)}</div>
                <div style="font-size: 8px; text-align: right; margin-top: 4px; opacity: 0.7;">${timeStr}</div>
            </div>
        `;
    }).join("");

    // Auto scroll to bottom on new message or if already scrolled to bottom
    if (isScrolledToBottom) {
        chatMessagesBody.scrollTop = chatMessagesBody.scrollHeight;
    }
}

// Chat message input submission
chatInputForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msgText = chatMessageInput.value.trim();
    if (!msgText || !currentChatPartnerId) return;

    try {
        const response = await fetch("/api/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                sender: user.id,
                receiver: currentChatPartnerId,
                message: msgText
            })
        });

        const data = await response.json();
        if (data.success) {
            chatMessageInput.value = "";
            await fetchChatMessages();
            // Scroll to bottom
            chatMessagesBody.scrollTop = chatMessagesBody.scrollHeight;
        } else {
            alert("Failed to send message: " + data.message);
        }
    } catch (error) {
        console.error("Message send error:", error);
        alert("Server connection failed.");
    }
});

// Close chat modal
closeChatModal.addEventListener("click", () => {
    chatModal.classList.remove("show");
    clearInterval(activeChatInterval);
    activeChatInterval = null;
    currentChatPartnerId = null;
});

// Sell listing submission
sellForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("newProductName").value.trim();
    const price = parseFloat(document.getElementById("newProductPrice").value);
    const category = document.getElementById("newProductCategory").value;
    const condition = document.getElementById("newProductCondition").value;
    const locationStr = document.getElementById("newProductLocation").value.trim();
    const description = document.getElementById("newProductDesc").value.trim();

    if (!name || isNaN(price) || !category || !condition || !locationStr || !description) return;

    try {
        const response = await fetch("/api/products", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                seller: user.id,
                name,
                price,
                category,
                condition,
                location: locationStr,
                description
            })
        });

        const data = await response.json();
        if (data.success) {
            sellForm.reset();
            sellModal.classList.remove("show");
            fetchProducts();
        } else {
            alert("Failed to publish listing: " + data.message);
        }
    } catch (error) {
        console.error("Item publish error:", error);
        alert("Server connection failed.");
    }
});

// Modal Toggles
sellItemButton.addEventListener("click", () => {
    sellModal.classList.add("show");
});

closeSellModal.addEventListener("click", () => {
    sellModal.classList.remove("show");
});

// Close modals when clicking outside
window.addEventListener("click", (e) => {
    if (e.target === sellModal) {
        sellModal.classList.remove("show");
    }
    if (e.target === chatModal) {
        chatModal.classList.remove("show");
        clearInterval(activeChatInterval);
        activeChatInterval = null;
        currentChatPartnerId = null;
    }
});

// Category filtering click handlers
categoryButtons.addEventListener("click", (e) => {
    if (e.target.classList.contains("category")) {
        // Toggle active class
        Array.from(categoryButtons.children).forEach(btn => btn.classList.remove("active"));
        e.target.classList.add("active");

        currentCategory = e.target.getAttribute("data-category");
        filterAndRenderProducts();
    }
});

// Search input handler
productSearch.addEventListener("input", filterAndRenderProducts);

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
            p.category.toLowerCase().includes(query)
        );
    }

    renderProducts(filtered);
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

// Initial fetch
fetchProducts();
