// ======================================================
// CAMPUSCONNECT FRONTEND
// ======================================================


// ======================================================
// LOGIN
// ======================================================

const loginForm =
    document.getElementById(
        "loginForm"
    );


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const email =
                document
                    .getElementById(
                        "loginEmail"
                    )
                    .value
                    .trim();


            const password =
                document
                    .getElementById(
                        "loginPassword"
                    )
                    .value;


            const message =
                document.getElementById(
                    "loginMessage"
                );


            if (!email || !password) {

                message.textContent =
                    "Please enter email and password.";

                message.style.color =
                    "#dc2626";

                return;

            }


            message.textContent =
                "Logging in...";

            message.style.color =
                "#7c3aed";


            try {

                const response =
                    await fetch(
                        "/api/auth/login",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    email,
                                    password

                                })

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    message.textContent =
                        data.message ||
                        "Login failed.";

                    message.style.color =
                        "#dc2626";

                    return;

                }


                // ==================================================
                // SAVE LOGIN TOKEN
                // ==================================================

                localStorage.setItem(
                    "campusconnect_token",
                    data.token
                );


                // ==================================================
                // SAVE USER
                // ==================================================

                localStorage.setItem(

                    "campusconnect_user",

                    JSON.stringify(
                        data.user
                    )

                );


                message.textContent =
                    "Login successful!";

                message.style.color =
                    "#16a34a";


                // ==================================================
                // GO TO DASHBOARD
                // ==================================================

                setTimeout(
                    () => {

                        window.location.href =
                            "/dashboard.html";

                    },
                    500
                );

            }

            catch (error) {

                console.error(
                    "LOGIN ERROR:",
                    error
                );

                message.textContent =
                    "Cannot connect to server.";

                message.style.color =
                    "#dc2626";

            }

        }
    );

}


// ======================================================
// REGISTER TOGGLE & SUBMISSION
// ======================================================

const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");
const loginSection = document.getElementById("loginSection");
const registerSection = document.getElementById("registerSection");

if (showRegister && showLogin && loginSection && registerSection) {
    showRegister.addEventListener("click", () => {
        loginSection.classList.add("hidden");
        registerSection.classList.remove("hidden");
    });

    showLogin.addEventListener("click", () => {
        registerSection.classList.add("hidden");
        loginSection.classList.remove("hidden");
    });
}

const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const fullName = document.getElementById("fullName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const studentId = document.getElementById("studentId").value.trim();
        const branch = document.getElementById("branch").value;
        const year = document.getElementById("year").value;
        const password = document.getElementById("registerPassword").value;
        const message = document.getElementById("registerMessage");

        if (!fullName || !email || !studentId || !password) {
            message.textContent = "Please fill in all required fields.";
            message.style.color = "#dc2626";
            return;
        }

        message.textContent = "Creating account...";
        message.style.color = "#7c3aed";

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    studentId,
                    branch,
                    year,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                message.textContent = data.message || "Registration failed.";
                message.style.color = "#dc2626";
                return;
            }

            message.textContent = "Registration successful! You can now log in.";
            message.style.color = "#16a34a";
            registerForm.reset();

            setTimeout(() => {
                registerSection.classList.add("hidden");
                loginSection.classList.remove("hidden");
                document.getElementById("loginEmail").value = email;
                message.textContent = "";
            }, 1500);

        } catch (error) {
            console.error("REGISTER ERROR:", error);
            message.textContent = "Cannot connect to server.";
            message.style.color = "#dc2626";
        }
    });
}


// ======================================================
// LOGOUT
// ======================================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "campusconnect_token"
            );


            localStorage.removeItem(
                "campusconnect_user"
            );


            window.location.href =
                "/";

        }
    );

}