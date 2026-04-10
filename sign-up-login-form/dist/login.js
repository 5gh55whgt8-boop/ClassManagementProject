const API_BASE_URL = "https://classmanagementproject-sy06.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".toggle-eye").forEach(icon => {
        icon.addEventListener("click", function () {
            const input = document.getElementById(this.dataset.target);
            if (!input) return;

            const isPassword = input.getAttribute("type") === "password";
            input.setAttribute("type", isPassword ? "text" : "password");
            this.classList.toggle("fa-eye-slash");
        });
    });
});

async function parseResponse(response) {
    const text = await response.text();

    try {
        return text ? JSON.parse(text) : {};
    } catch {
        return { message: text || "Unexpected server response" };
    }
}

function showServerUnavailableMessage(message) {
    alert(message || "Server is temporarily unavailable. Please try again in a minute.");
}

function showNetworkErrorMessage() {
    alert("Server not responding. Please try again later.");
}

async function loginUser(event) {
    event.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
        alert("Please enter email and password.");
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const result = await parseResponse(response);
        console.log("Login response:", result);

        if (response.ok) {
            alert(result.message || "Login successful");
            window.location.href = "./sign-up-login-form/dist/HomePage/Home.html";
            return false;
        }

        if (response.status === 503) {
            showServerUnavailableMessage(result.message);
            return false;
        }

        alert(result.message || "Invalid email or password");
    } catch (error) {
        console.error("Login error:", error);
        showNetworkErrorMessage();
    }

    return false;
}

async function onSignUp(event) {
    event.preventDefault();

    const username = document.getElementById("signup-username").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;

    if (!username || !email || !password) {
        alert("Please fill all fields.");
        return false;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        const result = await parseResponse(response);
        console.log("Signup response:", result);

        if (response.ok) {
            alert(result.message || "Signup successful");

            document.getElementById("signup-username").value = "";
            document.getElementById("signup-email").value = "";
            document.getElementById("signup-password").value = "";
            document.getElementById("chk-signup").checked = false;

            return false;
        }

        if (response.status === 503) {
            showServerUnavailableMessage(result.message);
            return false;
        }

        alert(result.message || "Signup failed");
    } catch (error) {
        console.error("Signup error:", error);
        showNetworkErrorMessage();
    }

    return false;
}

async function onResetPass(event) {
    event.preventDefault();

    const email = document.getElementById("reset-email").value.trim();
    const pass1 = document.getElementById("pass1").value;
    const pass2 = document.getElementById("pass2").value;

    if (!email || !pass1 || !pass2) {
        alert("Please fill all fields.");
        return false;
    }

    if (pass1 !== pass2) {
        alert("Passwords do not match!");
        return false;
    }

    if (pass1.length < 6) {
        alert("Password must be at least 6 characters.");
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, new_password: pass1 })
        });

        const result = await parseResponse(response);
        console.log("Reset password response:", result);

        if (response.ok) {
            alert(result.message || "Password updated successfully");

            document.getElementById("reset-email").value = "";
            document.getElementById("pass1").value = "";
            document.getElementById("pass2").value = "";
            document.getElementById("chk-forgot").checked = false;

            return false;
        }

        if (response.status === 503) {
            showServerUnavailableMessage(result.message);
            return false;
        }

        alert(result.message || "Password reset failed");
    } catch (error) {
        console.error("Reset password error:", error);
        showNetworkErrorMessage();
    }

    return false;
}