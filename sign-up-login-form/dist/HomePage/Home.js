const API_BASE_URL = "https://classmanagementproject-sy06.onrender.com";

document.addEventListener("DOMContentLoaded", function () {
    loadStudents();
    loadHeader();
    setupModal();
});

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

function loadStudents() {
    fetch(`${API_BASE_URL}/students?type=homepage`)
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById("studentList");
            list.innerHTML = "";

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
        })
        .catch(err => {
            console.error("Load students error:", err);
            document.getElementById("studentList").innerHTML = `<tr><td colspan="7">Failed to load students</td></tr>`;
        });
}

function saveStudent() {
    const name = document.getElementById("studentName").value.trim();
    const email = document.getElementById("studentEmail").value.trim();
    const rollnumber = document.getElementById("rollnumber").value.trim();

    if (!name || !email || !rollnumber) {
        alert("Please fill all fields");
        return;
    }

    fetch(`${API_BASE_URL}/add-student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, rollnumber })
    })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Failed to add student");
            }
            alert(data.message || "Student added successfully");
            document.getElementById("studentModal").style.display = "none";
            clearModalFields();
            loadStudents();
        })
        .catch(err => {
            console.error("Save student error:", err);
            alert(err.message || "Failed to add student");
        });
}

function enterMarks(rollNo) {
    window.location.href = `../TermWork/TermWork.html?studentId=${rollNo}`;
}

function viewAnalysis(rollNo) {
    window.location.href = `../Dashboard/Dashboard.html?studentId=${rollNo}`;
}

function deleteStudent(roll) {
    if (!confirm("Are you sure?")) return;

    fetch(`${API_BASE_URL}/delete-student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollnumber: roll })
    })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Delete failed");
            loadStudents();
        })
        .catch(err => {
            console.error("Delete student error:", err);
            alert(err.message || "Failed to delete student");
        });
}