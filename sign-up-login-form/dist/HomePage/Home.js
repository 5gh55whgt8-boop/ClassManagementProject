const API_BASE_URL = "https://classmanagementproject-sy06.onrender.com";

document.addEventListener("DOMContentLoaded", function () {
    loadStudents();
    loadHeader();
    setupModal();
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

function loadHeader() {
    fetch("../Header/Header.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("header-placeholder").innerHTML = data;
        })
        .catch(err => console.error("Header Error:", err));
}

function setupModal() {
    const modal = document.getElementById("studentModal");
    const addBtn = document.getElementById("addStudentBtn");
    const closeBtn = document.getElementById("closeModalBtn");
    const saveBtn = document.getElementById("saveStudentBtn");

    addBtn.addEventListener("click", () => {
        modal.style.display = "flex";
    });

    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
        clearModalFields();
    });

    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
            clearModalFields();
        }
    });

    saveBtn.addEventListener("click", saveStudent);
}

function clearModalFields() {
    document.getElementById("studentName").value = "";
    document.getElementById("studentEmail").value = "";
    document.getElementById("rollnumber").value = "";
}

async function loadStudents() {
    try {
        const response = await fetch(`${API_BASE_URL}/students?type=homepage`);
        const data = await parseResponse(response);

        const list = document.getElementById("studentList");
        list.innerHTML = "";

        if (response.status === 503) {
            list.innerHTML = `<tr><td colspan="7">Server temporarily unavailable</td></tr>`;
            showServerUnavailableMessage(data.message);
            return;
        }

        if (!response.ok) {
            throw new Error(data.message || "Failed to load students");
        }

        if (!data.students || !data.students.length) {
            list.innerHTML = `<tr><td colspan="7">No students found</td></tr>`;
            return;
        }

        data.students.forEach((student, index) => {
            list.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${student.RollNo}</td>
                    <td>${student.Student_Name}</td>
                    <td>${student.email}</td>
                    <td><button onclick="enterMarks('${student.RollNo}')">Enter Marks</button></td>
                    <td><button onclick="viewAnalysis('${student.RollNo}')">View Analysis</button></td>
                    <td><button class="delete-btn" onclick="deleteStudent('${student.RollNo}')">Delete</button></td>
                </tr>`;
        });
    } catch (err) {
        console.error("Load students error:", err);
        document.getElementById("studentList").innerHTML = `<tr><td colspan="7">Failed to load students</td></tr>`;
    }
}

async function saveStudent() {
    const name = document.getElementById("studentName").value.trim();
    const email = document.getElementById("studentEmail").value.trim();
    const rollnumber = document.getElementById("rollnumber").value.trim();

    if (!name || !email || !rollnumber) {
        alert("Please fill all fields");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/add-student`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, rollnumber })
        });

        const data = await parseResponse(response);

        if (response.status === 503) {
            showServerUnavailableMessage(data.message);
            return;
        }

        if (!response.ok) {
            throw new Error(data.message || "Failed to add student");
        }

        alert(data.message || "Student added successfully");
        document.getElementById("studentModal").style.display = "none";
        clearModalFields();
        loadStudents();
    } catch (err) {
        console.error("Save student error:", err);
        if (err.message === "Failed to fetch") {
            showNetworkErrorMessage();
            return;
        }
        alert(err.message || "Failed to add student");
    }
}

function enterMarks(rollNo) {
    window.location.href = `../TermWork/TermWork.html?studentId=${rollNo}`;
}

function viewAnalysis(rollNo) {
    window.location.href = `../Dashboard/Dashboard.html?studentId=${rollNo}`;
}

async function deleteStudent(roll) {
    if (!confirm("Are you sure?")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/delete-student`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rollnumber: roll })
        });

        const data = await parseResponse(response);

        if (response.status === 503) {
            showServerUnavailableMessage(data.message);
            return;
        }

        if (!response.ok) {
            throw new Error(data.message || "Delete failed");
        }

        alert(data.message || "Student deleted successfully");
        loadStudents();
    } catch (err) {
        console.error("Delete student error:", err);
        if (err.message === "Failed to fetch") {
            showNetworkErrorMessage();
            return;
        }
        alert(err.message || "Failed to delete student");
    }
}