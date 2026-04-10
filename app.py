from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import bcrypt
import os
import time

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

DB_HOST = os.environ.get("DB_HOST")
DB_USER = os.environ.get("DB_USER")
DB_PASSWORD = os.environ.get("DB_PASSWORD")
DB_NAME = os.environ.get("DB_NAME")

try:
    DB_PORT = int(os.environ.get("DB_PORT", 3306))
except:
    DB_PORT = 3306


def get_db_connection(retries=2, delay=1):
    if not all([DB_HOST, DB_USER, DB_PASSWORD, DB_NAME]):
        return None, "Database configuration is incomplete"

    last_error = None

    for attempt in range(retries + 1):
        try:
            db = mysql.connector.connect(
                host=DB_HOST,
                user=DB_USER,
                password=DB_PASSWORD,
                port=DB_PORT,
                database=DB_NAME,
                connection_timeout=10
            )
            return db, None
        except Error as err:
            last_error = str(err)
            print(f"DB Error (attempt {attempt + 1}): {err}")
            if attempt < retries:
                time.sleep(delay)

    return None, last_error or "Unknown database error"


def db_unavailable_response():
    return jsonify({
        "status": "error",
        "message": "Server is temporarily unavailable. Please try again in a minute."
    }), 503


@app.route("/")
def home():
    return jsonify({"status": "success", "message": "Backend is live"}), 200


@app.route("/health")
def health():
    db, err = get_db_connection(retries=0)
    if db:
        db.close()
        return jsonify({
            "status": "ok",
            "backend": "up",
            "database": "connected"
        }), 200

    return jsonify({
        "status": "warning",
        "backend": "up",
        "database": "disconnected",
        "message": "Database is unavailable"
    }), 200


# ---------------- TEACHER LOGIN ----------------
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "status": "error",
            "message": "Email and password are required"
        }), 400

    db, db_error = get_db_connection()
    if not db:
        print("Teacher login DB connection failed:", db_error)
        return db_unavailable_response()

    cursor = db.cursor()
    try:
        cursor.execute(
            "SELECT id, username, password FROM teachers WHERE email=%s AND is_active=1",
            (email,)
        )
        user = cursor.fetchone()

        if not user:
            return jsonify({
                "status": "error",
                "message": "Invalid email or password"
            }), 401

        teacher_id, username, db_password = user

        if db_password and isinstance(db_password, str) and db_password.startswith("$2"):
            if bcrypt.checkpw(password.encode("utf-8"), db_password.encode("utf-8")):
                return jsonify({
                    "status": "success",
                    "message": "Login successful",
                    "teacherId": teacher_id,
                    "user": username
                }), 200

        return jsonify({
            "status": "error",
            "message": "Invalid email or password"
        }), 401

    except Exception as e:
        print("Teacher login error:", e)
        return jsonify({
            "status": "error",
            "message": "Server error during login"
        }), 500
    finally:
        cursor.close()
        db.close()


# ---------------- STUDENT LOGIN ----------------
@app.route("/student-login", methods=["POST"])
def student_login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "status": "error",
            "message": "Email and password are required"
        }), 400

    db, db_error = get_db_connection()
    if not db:
        print("Student login DB connection failed:", db_error)
        return db_unavailable_response()

    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT Student_Name, email, password, RollNo
            FROM students
            WHERE email=%s AND IsActive=1
        """, (email,))
        student = cursor.fetchone()

        if not student:
            return jsonify({
                "status": "error",
                "message": "Invalid email or password"
            }), 401

        db_password = student["password"]

        if db_password and isinstance(db_password, str) and db_password.startswith("$2"):
            if bcrypt.checkpw(password.encode("utf-8"), db_password.encode("utf-8")):
                return jsonify({
                    "status": "success",
                    "message": "Login successful",
                    "studentName": student["Student_Name"],
                    "rollNo": student["RollNo"]
                }), 200

        return jsonify({
            "status": "error",
            "message": "Invalid email or password"
        }), 401

    except Exception as e:
        print("Student login error:", e)
        return jsonify({
            "status": "error",
            "message": "Server error during student login"
        }), 500
    finally:
        cursor.close()
        db.close()


# ---------------- ADD STUDENT ----------------
@app.route("/add-student", methods=["POST"])
def add_student():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    rollnumber = data.get("rollnumber", "").strip()
    password = data.get("password", "").strip()

    if not name or not email or not rollnumber or not password:
        return jsonify({
            "status": "error",
            "message": "All fields are required"
        }), 400

    db, db_error = get_db_connection()
    if not db:
        print("Add student DB connection failed:", db_error)
        return db_unavailable_response()

    cursor = db.cursor()
    try:
        cursor.execute(
            "SELECT * FROM students WHERE (email=%s OR RollNo=%s) AND IsActive=1",
            (email, rollnumber)
        )
        if cursor.fetchone():
            return jsonify({
                "status": "error",
                "message": "Student already exists"
            }), 409

        hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        cursor.execute("""
            INSERT INTO students (Student_Name, email, password, RollNo, IsActive)
            VALUES (%s, %s, %s, %s, 1)
        """, (name, email, hashed_password, rollnumber))
        db.commit()

        return jsonify({
            "status": "success",
            "message": "Student added successfully"
        }), 200

    except Exception as e:
        print("Add student error:", e)
        return jsonify({
            "status": "error",
            "message": "Failed to add student"
        }), 500
    finally:
        cursor.close()
        db.close()


# ---------------- UPDATE STUDENT ----------------
@app.route("/update-student", methods=["POST"])
def update_student():
    data = request.get_json(silent=True) or {}
    rollnumber = data.get("rollnumber", "").strip()
    name = data.get("name", "").strip()
    email = data.get("email", "").strip()

    if not rollnumber or not name or not email:
        return jsonify({
            "status": "error",
            "message": "All fields are required"
        }), 400

    db, db_error = get_db_connection()
    if not db:
        print("Update student DB connection failed:", db_error)
        return db_unavailable_response()

    cursor = db.cursor()
    try:
        cursor.execute("""
            UPDATE students
            SET Student_Name=%s, email=%s
            WHERE RollNo=%s AND IsActive=1
        """, (name, email, rollnumber))
        db.commit()

        return jsonify({
            "status": "success",
            "message": "Student updated successfully"
        }), 200

    except Exception as e:
        print("Update student error:", e)
        return jsonify({
            "status": "error",
            "message": "Failed to update student"
        }), 500
    finally:
        cursor.close()
        db.close()


# ---------------- RESET STUDENT PASSWORD ----------------
@app.route("/reset-student-password", methods=["POST"])
def reset_student_password():
    data = request.get_json(silent=True) or {}
    rollnumber = data.get("rollnumber", "").strip()
    new_password = data.get("new_password", "").strip()

    if not rollnumber or not new_password:
        return jsonify({
            "status": "error",
            "message": "Roll number and new password are required"
        }), 400

    db, db_error = get_db_connection()
    if not db:
        print("Reset student password DB connection failed:", db_error)
        return db_unavailable_response()

    cursor = db.cursor()
    try:
        hashed_password = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        cursor.execute("""
            UPDATE students
            SET password=%s
            WHERE RollNo=%s AND IsActive=1
        """, (hashed_password, rollnumber))
        db.commit()

        return jsonify({
            "status": "success",
            "message": "Student password reset successfully"
        }), 200

    except Exception as e:
        print("Reset student password error:", e)
        return jsonify({
            "status": "error",
            "message": "Failed to reset student password"
        }), 500
    finally:
        cursor.close()
        db.close()


# ---------------- GET STUDENTS ----------------
@app.route("/students", methods=["GET"])
def get_students():
    db, db_error = get_db_connection()
    if not db:
        print("Get students DB connection failed:", db_error)
        return db_unavailable_response()

    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT Student_Name, email, RollNo
            FROM students
            WHERE IsActive=1
            ORDER BY RollNo
        """)
        students_list = cursor.fetchall()

        return jsonify({
            "status": "success",
            "students": students_list
        }), 200

    except Exception as e:
        print("Get students error:", e)
        return jsonify({
            "status": "error",
            "message": "Failed to fetch students"
        }), 500
    finally:
        cursor.close()
        db.close()


# ---------------- DELETE STUDENT ----------------
@app.route("/delete-student", methods=["POST"])
def delete_student():
    data = request.get_json(silent=True) or {}
    rollnumber = data.get("rollnumber", "").strip()

    if not rollnumber:
        return jsonify({
            "status": "error",
            "message": "Roll number is required"
        }), 400

    db, db_error = get_db_connection()
    if not db:
        print("Delete student DB connection failed:", db_error)
        return db_unavailable_response()

    cursor = db.cursor()
    try:
        cursor.execute("UPDATE students SET IsActive=0 WHERE RollNo=%s", (rollnumber,))
        db.commit()

        return jsonify({
            "status": "success",
            "message": "Student marked inactive"
        }), 200

    except Exception as e:
        print("Delete student error:", e)
        return jsonify({
            "status": "error",
            "message": "Failed to delete student"
        }), 500
    finally:
        cursor.close()
        db.close()


# ---------------- ADD MARKS ----------------
@app.route("/add_marks", methods=["POST"])
def add_marks():
    data = request.get_json(silent=True) or {}
    subject = data.get("subject")
    lectures = float(data.get("lectures", 0))
    unit_test = float(data.get("unitTest", 0))
    oral_practical = float(data.get("oralPractical", 0))
    roll_no = data.get("roll_no")
    mean = round(float(data.get("mean", 0)), 2)

    if not roll_no or not subject:
        return jsonify({
            "status": "error",
            "message": "Missing required fields"
        }), 400

    db, db_error = get_db_connection()
    if not db:
        print("Add marks DB connection failed:", db_error)
        return db_unavailable_response()

    cursor = db.cursor()
    try:
        cursor.execute("""
            INSERT INTO StudentReport
            (Subject_Name, roll_no, lectures_attended, unit_test, oral_practical, mean)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (subject, roll_no, lectures, unit_test, oral_practical, mean))
        db.commit()

        return jsonify({
            "status": "success",
            "message": "Marks added successfully"
        }), 200

    except Exception as e:
        print("Add marks error:", e)
        return jsonify({
            "status": "error",
            "message": "Failed to add marks"
        }), 500
    finally:
        cursor.close()
        db.close()


# ---------------- GET STUDENT DATA ----------------
@app.route("/get_student_data", methods=["GET"])
def get_student_data():
    student_id = request.args.get("studentId")
    if not student_id:
        return jsonify({
            "success": False,
            "error": "Invalid request"
        }), 400

    db, db_error = get_db_connection()
    if not db:
        print("Get student data DB connection failed:", db_error)
        return jsonify({
            "success": False,
            "error": "Server is temporarily unavailable. Please try again in a minute."
        }), 503

    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT Subject_Name, roll_no, lectures_attended, unit_test, oral_practical, mean
            FROM StudentReport
            WHERE roll_no = %s
        """, (student_id,))
        rows = cursor.fetchall()

        return jsonify({
            "success": True,
            "data": rows if rows else []
        }), 200

    except Exception as e:
        print("Get student data error:", e)
        return jsonify({
            "success": False,
            "error": "Failed to fetch student data"
        }), 500
    finally:
        cursor.close()
        db.close()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)