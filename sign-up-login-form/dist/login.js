const API_BASE_URL = "https://classmanagementproject-sy06.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    fetch(`${API_BASE_URL}/health`).catch(() => {});
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

        if (response.ok) {
            sessionStorage.setItem("userRole", "teacher");
            sessionStorage.removeItem("studentId");
            sessionStorage.removeItem("studentName");
            window.location.href = "./sign-up-login-form/dist/HomePage/Home.html";
            return false;
        }

        if (response.status === 503) {
            showServerUnavailableMessage(result.message);
            return false;
        }

        alert(result.message || "Invalid email or password");
    } catch (error) {
        console.error("Teacher login error:", error);
        showNetworkErrorMessage();
    }

    return false;
}