const API_BASE_URL = "https://classmanagementproject-sy06.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    loadHeader();
});

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

function addMarks() {
    const studentId = new URLSearchParams(window.location.search).get("studentId");
    const subject = document.getElementById('subject').value;
    const lectures = parseFloat(document.getElementById('lectures-attended').value) || 0;
    const unitTest = parseFloat(document.getElementById('unit-test').value) || 0;
    const oralPractical = parseFloat(document.getElementById('oral-practical').value) || 0;

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

    fetch(`${API_BASE_URL}/add_marks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(marksData)
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                showResult("Marks Added Successfully!", "success");
                setTimeout(() => window.location.reload(), 800);
            } else {
                showResult(data.message || "Failed to save marks", "error");
            }
        })
        .catch(err => {
            console.error("Add marks error:", err);
            showResult("Error saving marks", "error");
        });
}

function viewResults() {
    const studentId = new URLSearchParams(window.location.search).get("studentId");
    if (!studentId) {
        alert("Student ID missing");
        return;
    }
    window.location.href = `../Dashboard/Dashboard.html?studentId=${studentId}`;
}