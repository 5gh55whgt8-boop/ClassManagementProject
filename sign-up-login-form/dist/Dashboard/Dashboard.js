const API_BASE_URL = "https://classmanagementproject-sy06.onrender.com";

window.onload = async function () {
    loadHeaderBasedOnRole();

    const role = sessionStorage.getItem("userRole");
    const sessionStudentId = sessionStorage.getItem("studentId");
    const queryStudentId = new URLSearchParams(window.location.search).get("studentId");

    if (role === "student" && sessionStudentId && queryStudentId !== sessionStudentId) {
        window.location.href = `../Dashboard/Dashboard.html?studentId=${sessionStudentId}`;
        return;
    }

    const studentId = queryStudentId || sessionStudentId;
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
            renderEmptyState("Failed to load data");
        }
    } catch (err) {
        console.error("Dashboard load error:", err);
        renderEmptyState("Error loading dashboard");
    }
};

function loadHeaderBasedOnRole() {
    const role = sessionStorage.getItem("userRole");
    const headerFile = role === "student"
        ? "../Header/StudentHeader.html"
        : "../Header/Header.html";

    fetch(headerFile)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Header file not found: ${headerFile}`);
            }
            return response.text();
        })
        .then(data => {
            const header = document.getElementById("header-placeholder");
            if (header) {
                header.innerHTML = data;
            }

            if (role === "student") {
                const studentId = sessionStorage.getItem("studentId") || new URLSearchParams(window.location.search).get("studentId");
                const dashboardLink = document.getElementById("studentDashboardLink");
                if (dashboardLink && studentId) {
                    dashboardLink.href = `../Dashboard/Dashboard.html?studentId=${studentId}`;
                }
            }
        })
        .catch(err => {
            console.error("Header Error:", err);
            const header = document.getElementById("header-placeholder");
            if (header) header.innerHTML = "";
        });
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
        const barHeight = Math.max((parseFloat(percentage) / 100) * 220, 24);

        container.innerHTML += `
            <div class="bar-wrapper">
                <div class="bar-value">${percentage}%</div>
                <div class="bar" style="height: ${barHeight}px;" title="${m.Subject_Name}"></div>
                <div class="bar-label">${m.Subject_Name}</div>
            </div>
        `;
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
            </tr>
        `;
    });
}