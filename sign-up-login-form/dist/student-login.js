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

async function studentLogin(event) {
    event.preventDefault();

    const email = document.getElementById("student-email").value.trim();
    const password = document.getElementById("student-password").value;

    if (!email || !password) {
        alert("Please enter email and password.");
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/student-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const result = await parseResponse(response);

        if (response.ok) {
            window.location.href = `./sign-up-login-form/dist/Dashboard/Dashboard.html?studentId=${result.rollNo}`;
            return false;
        }

        if (response.status === 503) {
            alert(result.message || "Server is temporarily unavailable. Please try again in a minute.");
            return false;
        }

        alert(result.message || "Invalid email or password");
    } catch (error) {
        console.error("Student login error:", error);
        alert("Server not responding. Please try again later.");
    }

    return false;
}