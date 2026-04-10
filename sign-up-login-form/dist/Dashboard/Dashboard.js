const API_BASE_URL = "https://classmanagementproject-sy06.onrender.com";

window.onload = async function () {
    loadHeader();

    const studentId = new URLSearchParams(window.location.search).get("studentId");
    if (!studentId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/get_student_data?studentId=${studentId}`);
        const data = await parseResponse(response);

        if (response.status === 503) {
            alert(data.error || data.message || "Server is temporarily unavailable. Please try again in a minute.");
            renderEmptyState("Server temporarily unavailable");
            return;
        }

        if (!response.ok) {
            throw new Error(data.error || data.message || "Failed to load dashboard data");
        }

        if (data.success) {
            renderChart(data.data || []);
            renderTable(data.data || []);
            renderStats(data.data || []);
        } else {
            alert(data.error || "Failed to load dashboard data");
            renderEmptyState("Failed to load data");
        }
    } catch (err) {
        console.error("Dashboard load error:", err);
        alert("Server not responding. Please try again later.");
        renderEmptyState("Error loading dashboard");
    }
};

function loadHeader() {
    fetch("../Header/Header.html")
        .then(response => response.text())
        .then(data => {
            const header = document.getElementById("header-placeholder");
            if (header) header.innerHTML = data;
        })
        .catch(err => console.error("Header Error:", err));
}

async function parseResponse(response) {
    const text = await response.text();
    try {
        return text ? JSON.parse(text) : {};
    } catch {
        return { message: text || "Unexpected server response" };
    }
}

function renderEmptyState(message) {
    document.getElementById("totalSubjects").textContent = "0";
    document.getElementById("averageScore").textContent = "0%";
    document.getElementById("highestScore").textContent = "0%";

    const container = document.querySelector(".bar-chart");
    const body = document.querySelector(".student-list tbody");

    if (container) {
        container.innerHTML = `<p>${message}</p>`;
    }

    if (body) {
        body.innerHTML = `<tr><td colspan="5">${message}</td></tr>`;
    }
}

function renderStats(marks) {
    const totalSubjects = marks.length;
    const percentages = marks.map(m => ((parseFloat(m.mean || 0) / 25) * 100));
    const avg = percentages.length
        ? (percentages.reduce((a, b) => a + b, 0) / percentages.length).toFixed(2)
        : "0.00";
    const max = percentages.length
        ? Math.max(...percentages).toFixed(2)
        : "0.00";

    document.getElementById("totalSubjects").textContent = totalSubjects;
    document.getElementById("averageScore").textContent = `${avg}%`;
    document.getElementById("highestScore").textContent = `${max}%`;
}

function renderChart(marks) {
    const container = document.querySelector(".bar-chart");
    container.innerHTML = "";

    if (!marks.length) {
        container.innerHTML = "<p>No data available</p>";
        return;
    }

    marks.forEach(m => {
        const percentage = ((parseFloat(m.mean || 0) / 25) * 100).toFixed(2);
        container.innerHTML += `
            <div class="bar" style="height: ${percentage}%;" title="${m.Subject_Name}">
                <span class="bar-label">${m.Subject_Name.substring(0, 3)}</span>
                <span class="bar-value">${percentage}%</span>
            </div>`;
    });
}

function renderTable(marks) {
    const body = document.querySelector(".student-list tbody");
    body.innerHTML = "";

    if (!marks.length) {
        body.innerHTML = `<tr><td colspan="5">No data available</td></tr>`;
        return;
    }

    marks.forEach(m => {
        body.innerHTML += `
            <tr>
                <td>${m.Subject_Name}</td>
                <td>${m.lectures_attended}</td>
                <td>${m.unit_test}</td>
                <td>${m.oral_practical}</td>
                <td>${m.mean}</td>
            </tr>`;
    });
}