const API_BASE_URL = "https://classmanagementproject-sy06.onrender.com";

document.addEventListener("DOMContentLoaded", function () {
    guardTeacherPage();
    loadStudents();
    loadHeader();
    setupAddStudentModal();
    setupEditStudentModal();
    setupResetPasswordModal();
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

function setupAddStudentModal() {
    const modal = document.getElementById("studentModal");
    const addBtn = document.getElementById("addStudentBtn");
    const closeBtn = document.getElementById("closeModalBtn");
    const saveBtn = document.getElementById("saveStudentBtn");

    addBtn.addEventListener("click", () => {
        modal.style.display = "flex";
    });

    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
        clearAddStudentFields();
    });

    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
            clearAddStudentFields();
        }
    });

    saveBtn.addEventListener("click", saveStudent);
}

function setupEditStudentModal() {
    const modal = document.getElementById("editStudentModal");
    const closeBtn = document.getElementById("closeEditModalBtn");
    const updateBtn = document.getElementById("updateStudentBtn");

    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
        clearEditStudentFields();
    });

    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
            clearEditStudentFields();
        }
    });

    updateBtn.addEventListener("click", updateStudent);
}

function setupResetPasswordModal() {
    const modal = document.getElementById("resetPasswordModal");
    const closeBtn = document.getElementById("closeResetModalBtn");
    const resetBtn = document.getElementById("confirmResetPasswordBtn");

    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
        clearResetPasswordFields();
    });

    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
            clearResetPasswordFields();
        }
    });

    resetBtn.addEventListener("click", resetStudentPassword);
}

function clearAddStudentFields() {
    document.getElementById("studentName").value = "";
    document.getElementById("studentEmail").value = "";
    document.getElementById("rollnumber").value = "";
    document.getElementById("studentPassword").value = "";
}

function clearEditStudentFields() {
    document.getElementById("editStudentName").value = "";
    document.getElementById("editStudentEmail").value = "";
    document.getElementById("editStudentRoll").value = "";
}

function clearResetPasswordFields() {
    document.getElementById("resetStudentRoll").value = "";
    document.getElementById("resetStudentPassword").value = "";
}

async function loadStudents() {
    try {
        const response = await fetch(`${API_BASE_URL}/students`);
        const data = await parseResponse(response);

        const list = document.getElementById("studentList");
        list.innerHTML = "";

        if (response.status === 503) {
            list.innerHTML = `<tr><td colspan="9">Server temporarily unavailable</td></tr>`;
            showServerUnavailableMessage(data.message);
            return;
        }

        if (!response.ok) {
            throw new Error(data.message || "Failed to load students");
        }

        if (!data.students || !data.students.length) {
            list.innerHTML = `<tr><td colspan="9">No students found</td></tr>`;
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
                    <td><button onclick="openEditStudentModal('${student.RollNo}', '${escapeQuotes(student.Student_Name)}', '${escapeQuotes(student.email)}')">Edit</button></td>
                    <td><button onclick="openResetPasswordModal('${student.RollNo}')">Reset Password</button></td>
                    <td><button class="delete-btn" onclick="deleteStudent('${student.RollNo}')">Delete</button></td>
                </tr>`;
        });
    } catch (err) {
        console.error("Load students error:", err);
        document.getElementById("studentList").innerHTML = `<tr><td colspan="9">Failed to load students</td></tr>`;
    }
}

function escapeQuotes(value) {
    return String(value).replace(/'/g, "\\'");
}

async function saveStudent() {
    const name = document.getElementById("studentName").value.trim();
    const email = document.getElementById("studentEmail").value.trim();
    const rollnumber = document.getElementById("rollnumber").value.trim();
    const password = document.getElementById("studentPassword").value.trim();

    if (!name || !email || !rollnumber || !password) {
        alert("Please fill all fields");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/add-student`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, rollnumber, password })
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
        clearAddStudentFields();
        loadStudents();
    } catch (err) {
        console.error("Save student error:", err);
        alert(err.message || "Failed to add student");
    }
}

function openEditStudentModal(rollNo, name, email) {
    document.getElementById("editStudentRoll").value = rollNo;
    document.getElementById("editStudentName").value = name;
    document.getElementById("editStudentEmail").value = email;
    document.getElementById("editStudentModal").style.display = "flex";
}

async function updateStudent() {
    const rollnumber = document.getElementById("editStudentRoll").value.trim();
    const name = document.getElementById("editStudentName").value.trim();
    const email = document.getElementById("editStudentEmail").value.trim();

    if (!rollnumber || !name || !email) {
        alert("Please fill all fields");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/update-student`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rollnumber, name, email })
        });

        const data = await parseResponse(response);

        if (response.status === 503) {
            showServerUnavailableMessage(data.message);
            return;
        }

        if (!response.ok) {
            throw new Error(data.message || "Failed to update student");
        }

        alert(data.message || "Student updated successfully");
        document.getElementById("editStudentModal").style.display = "none";
        clearEditStudentFields();
        loadStudents();
    } catch (err) {
        console.error("Update student error:", err);
        alert(err.message || "Failed to update student");
    }
}

function openResetPasswordModal(rollNo) {
    document.getElementById("resetStudentRoll").value = rollNo;
    document.getElementById("resetStudentPassword").value = "";
    document.getElementById("resetPasswordModal").style.display = "flex";
}

async function resetStudentPassword() {
    const rollnumber = document.getElementById("resetStudentRoll").value.trim();
    const new_password = document.getElementById("resetStudentPassword").value.trim();

    if (!rollnumber || !new_password) {
        alert("Please fill all fields");
        return;
    }

    if (new_password.length < 6) {
        alert("Password must be at least 6 characters");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/reset-student-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rollnumber, new_password })
        });

        const data = await parseResponse(response);

        if (response.status === 503) {
            showServerUnavailableMessage(data.message);
            return;
        }

        if (!response.ok) {
            throw new Error(data.message || "Failed to reset password");
        }

        alert(data.message || "Password reset successfully");
        document.getElementById("resetPasswordModal").style.display = "none";
        clearResetPasswordFields();
    } catch (err) {
        console.error("Reset student password error:", err);
        alert(err.message || "Failed to reset password");
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
        alert(err.message || "Failed to delete student");
    }
}