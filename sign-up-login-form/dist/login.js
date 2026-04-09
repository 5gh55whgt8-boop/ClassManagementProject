const API_BASE_URL = "https://classmanagementproject-sy06.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.toggle-eye').forEach(icon => {
        icon.addEventListener('click', function () {
            const input = document.getElementById(this.dataset.target);
            if (!input) return;

            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.classList.toggle('fa-eye-slash');
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

async function loginUser(event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const result = await parseResponse(response);
        console.log("Login response:", result);

        if (response.ok) {
            window.location.href = './sign-up-login-form/dist/HomePage/Home.html';
        } else {
            alert(result.message || "Invalid Login");
        }
    } catch (error) {
        console.error('Login error:', error);
        alert("Server not responding. Please try again later.");
    }

    return false;
}

async function onSignUp(event) {
    event.preventDefault();

    const username = document.getElementById("signup-username").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;

    if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password }),
        });

        const result = await parseResponse(response);
        alert(result.message || "Signup response received");

        if (response.ok) {
            document.getElementById('chk-signup').checked = false;
            document.getElementById("signup-username").value = "";
            document.getElementById("signup-email").value = "";
            document.getElementById("signup-password").value = "";
        }
    } catch (err) {
        console.error("Signup error:", err);
        alert("Signup failed.");
    }

    return false;
}

async function onResetPass(event) {
    event.preventDefault();

    const email = document.getElementById("reset-email").value.trim();
    const pass1 = document.getElementById("pass1").value;
    const pass2 = document.getElementById("pass2").value;

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
            body: JSON.stringify({ email, new_password: pass1 }),
        });

        const result = await parseResponse(response);
        alert(result.message || "Reset response received");

        if (response.ok) {
            document.getElementById('chk-forgot').checked = false;
            document.getElementById("reset-email").value = "";
            document.getElementById("pass1").value = "";
            document.getElementById("pass2").value = "";
        }
    } catch (err) {
        console.error("Reset error:", err);
        alert("Reset failed.");
    }

    return false;
}