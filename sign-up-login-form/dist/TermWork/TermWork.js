const API_BASE_URL = "https://classmanagementproject-sy06.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    guardTeacherPage();
    loadHeader();
    attachLiveCalculation();
});

function guardTeacherPage() {
    const role = sessionStorage.getItem("userRole");
    if (role !== "teacher") {
        alert("Access denied. Teacher login required.");
        window.location.href = "../../../index.html";
    }
}

async function parseResponse(response) {
    const text = await response.text();
    try {
        return text ? JSON.parse(text) : {};
    } catch {
        return { message: text || "Unexpected server response" };
    }
}

function loadHeader() {
    fetch("../Header/Header.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("header-placeholder").innerHTML = data;
        })
        .catch(err => console.error("Header Error:", err));
}

function showResult(message, type) {
    const result = document.getElementById("result");
    result.className = `result-message ${type}`;
    result.textContent = message;
}

function showServerUnavailableMessage(message) {
    showResult(message || "Server is temporarily unavailable. Please try again in a minute.", "error");
}

function showNetworkErrorMessage() {
    showResult("Server not responding. Please try again later.", "error");
}

function attachLiveCalculation() {
    const fields = [
        document.getElementById("lectures-attended"),
        document.getElementById("unit-test"),
        document.getElementById("oral-practical")
    ];

    fields.forEach(field => {
        field.addEventListener("input", updateSummary);
    });

    updateSummary();
}

function updateSummary() {
    const lectures = parseFloat(document.getElementById("lectures-attended").value) || 0;
    const unitTest = parseFloat(document.getElementById("unit-test").value) || 0;
    const oralPractical = parseFloat(document.getElementById("oral-practical").value) || 0;

    const total = lectures + unitTest + oralPractical;
    const scaledMean = ((total / 45) * 25).toFixed(2);

    document.getElementById("total-obtained").textContent = `${total.toFixed(2)} / 45`;
    document.getElementById("scaled-mean").textContent = `${scaledMean} / 25`;
}

async function addMarks() {
    const studentId = new URLSearchParams(window.location.search).get("studentId");
    const subject = document.getElementById("subject").value;
    const lectures = parseFloat(document.getElementById("lectures-attended").value) || 0;
    const unitTest = parseFloat(document.getElementById("unit-test").value) || 0;
    const oralPractical = parseFloat(document.getElementById("oral-practical").value) || 0;

    if (!studentId) {
        showResult("Student ID missing", "error");
        return;
    }

    if (lectures < 0 || lectures > 5) {
        showResult("Lectures attended must be between 0 and 5", "error");
        return;
    }

    if (unitTest < 0 || unitTest > 30) {
        showResult("Unit test marks must be between 0 and 30", "error");
        return;
    }

    if (oralPractical < 0 || oralPractical > 10) {
        showResult("Oral practical marks must be between 0 and 10", "error");
        return;
    }

    const total = lectures + unitTest + oralPractical;
    const scaledMean = ((total / 45) * 25).toFixed(2);

    const marksData = {
        subject,
        lectures,
        unitTest,
        oralPractical,
        mean: scaledMean,
        roll_no: studentId
    };

    try {
        const response = await fetch(`${API_BASE_URL}/add_marks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(marksData)
        });

        const data = await parseResponse(response);

        if (response.status === 503) {
            showServerUnavailableMessage(data.message);
            return;
        }

        if (!response.ok) {
            showResult(data.message || "Failed to save marks", "error");
            return;
        }

        showResult(data.message || "Marks Added Successfully!", "success");

        setTimeout(() => {
            document.getElementById("lectures-attended").value = "";
            document.getElementById("unit-test").value = "";
            document.getElementById("oral-practical").value = "";
            updateSummary();
        }, 500);
    } catch (err) {
        console.error("Add marks error:", err);
        showNetworkErrorMessage();
    }
}

function viewResults() {
    const studentId = new URLSearchParams(window.location.search).get("studentId");
    if (!studentId) {
        alert("Student ID missing");
        return;
    }
    window.location.href = `../Dashboard/Dashboard.html?studentId=${studentId}`;
}