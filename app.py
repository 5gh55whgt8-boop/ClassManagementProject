from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
import bcrypt
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

def get_db_connection():
    try:
        return mysql.connector.connect(
            host="mysql-115bf410-letsmailvivek100-e992.d.aivencloud.com",
            user="avnadmin",
            password="AVNS_sZAY7yk09QUdKGPlYDy",
            port=17451,
            database="defaultdb"
        )
    except mysql.connector.Error as err:
        print(f"DB Error: {err}")
        return None

@app.route('/')
def home():
    return jsonify({"status": "success", "message": "Backend is live"}), 200

@app.route('/health')
def health():
    return jsonify({"status": "ok"}), 200

@app.route('/sign-up-login-form/dist/<path:path>')
def serve_static_file(path):
    return send_from_directory('sign-up-login-form/dist', path)

@app.route('/sign-up-login-form')
def serve_login():
    return send_from_directory('sign-up-login-form/dist', 'index.html')

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({"status": "error", "message": "Email and password are required"}), 400

    db = get_db_connection()
    if not db:
        return jsonify({"status": "error", "message": "Database connection failed"}), 500

    cursor = db.cursor()
    try:
        cursor.execute("SELECT username, password FROM teachers WHERE email=%s", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"status": "error", "message": "Invalid email or password"}), 401

        username, db_password = user

        # bcrypt hashed password support
        try:
            if db_password and db_password.startswith("$2"):
                if bcrypt.checkpw(password.encode('utf-8'), db_password.encode('utf-8')):
                    return jsonify({
                        "status": "success",
                        "message": "Login successful",
                        "user": username
                    }), 200
                return jsonify({"status": "error", "message": "Invalid email or password"}), 401
        except Exception as e:
            print("bcrypt login error:", e)

        # fallback for old plain text passwords already stored in DB
        if password == db_password:
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            update_cursor = db.cursor()
            update_cursor.execute("UPDATE teachers SET password=%s WHERE email=%s", (hashed_password, email))
            db.commit()
            update_cursor.close()

            return jsonify({
                "status": "success",
                "message": "Login successful",
                "user": username
            }), 200

        return jsonify({"status": "error", "message": "Invalid email or password"}), 401

    except Exception as e:
        print("Login route error:", e)
        return jsonify({"status": "error", "message": "Server error during login"}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json(silent=True) or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not username or not email or not password:
        return jsonify({"status": "error", "message": "All fields are required"}), 400

    if len(password) < 6:
        return jsonify({"status": "error", "message": "Password must be at least 6 characters"}), 400

    db = get_db_connection()
    if not db:
        return jsonify({"status": "error", "message": "Database connection failed"}), 500

    cursor = db.cursor()
    try:
        cursor.execute("SELECT * FROM teachers WHERE email=%s", (email,))
        if cursor.fetchone():
            return jsonify({"status": "error", "message": "Email already exists"}), 409

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        cursor.execute(
            "INSERT INTO teachers (username, email, password) VALUES (%s, %s, %s)",
            (username, email, hashed_password)
        )
        db.commit()

        return jsonify({"status": "success", "message": "Signup successful"}), 200

    except Exception as e:
        print("Signup route error:", e)
        return jsonify({"status": "error", "message": "Signup failed"}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip()
    new_password = data.get('new_password', '')

    if not email or not new_password:
        return jsonify({"status": "error", "message": "Email and new password are required"}), 400

    if len(new_password) < 6:
        return jsonify({"status": "error", "message": "Password must be at least 6 characters"}), 400

    db = get_db_connection()
    if not db:
        return jsonify({"status": "error", "message": "Database connection failed"}), 500

    cursor = db.cursor()
    try:
        cursor.execute("SELECT * FROM teachers WHERE email=%s", (email,))
        if not cursor.fetchone():
            return jsonify({"status": "error", "message": "Email not found"}), 404

        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute(
            "UPDATE teachers SET password=%s WHERE email=%s",
            (hashed_password, email)
        )
        db.commit()

        return jsonify({"status": "success", "message": "Password updated successfully"}), 200

    except Exception as e:
        print("Reset password error:", e)
        return jsonify({"status": "error", "message": "Password reset failed"}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/add_marks', methods=['POST'])
def add_marks():
    db = None
    cursor = None
    try:
        data = request.get_json(silent=True) or {}

        subject = data.get('subject')
        lectures = float(data.get('lectures', 0))
        unit_test = float(data.get('unitTest', 0))
        oral_practical = float(data.get('oralPractical', 0))
        roll_no = data.get('roll_no')
        mean = round(float(data.get('mean', 0)), 2)

        if not roll_no or not subject:
            return jsonify({"status": "error", "message": "Missing required fields"}), 400

        db = get_db_connection()
        if not db:
            return jsonify({"status": "error", "message": "Database connection failed"}), 500

        cursor = db.cursor()
        query = """
            INSERT INTO StudentReport 
            (Subject_Name, roll_no, lectures_attended, unit_test, oral_practical, mean)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (subject, roll_no, lectures, unit_test, oral_practical, mean))
        db.commit()

        return jsonify({"status": "success", "message": "Marks added successfully"}), 200

    except Exception as e:
        print("Add marks error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()

@app.route('/students', methods=['GET'])
def get_students():
    db = get_db_connection()
    if not db:
        return jsonify({"status": "error", "message": "Database connection failed"}), 500

    cursor = db.cursor(dictionary=True)
    try:
        student_id = request.args.get("studentId")
        req_type = request.args.get("type")

        if req_type == 'homepage':
            cursor.execute("SELECT Student_Name, email, RollNo FROM students WHERE IsActive=1")
            students_list = cursor.fetchall()
        elif req_type == 'termwork' and student_id:
            cursor.execute(
                "SELECT Student_Name, email, RollNo FROM students WHERE RollNo=%s AND IsActive=1",
                (student_id,)
            )
            students_list = cursor.fetchone()
        else:
            return jsonify({"status": "error", "message": "Invalid request"}), 400

        return jsonify({"status": "success", "students": students_list}), 200
    except Exception as e:
        print("Get students error:", e)
        return jsonify({"status": "error", "message": "Failed to fetch students"}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/add-student', methods=['POST'])
def add_student():
    data = request.get_json(silent=True) or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    rollnumber = data.get('rollnumber', '').strip()

    if not name or not email or not rollnumber:
        return jsonify({"status": "error", "message": "All fields are required"}), 400

    db = get_db_connection()
    if not db:
        return jsonify({"status": "error", "message": "Database connection failed"}), 500

    cursor = db.cursor()
    try:
        cursor.execute(
            "SELECT * FROM students WHERE (email=%s OR RollNo=%s) AND IsActive=1",
            (email, rollnumber)
        )
        if cursor.fetchone():
            return jsonify({"status": "error", "message": "Student already exists"}), 409

        cursor.execute(
            "INSERT INTO students (Student_Name, email, RollNo, IsActive) VALUES (%s, %s, %s, 1)",
            (name, email, rollnumber)
        )
        db.commit()

        return jsonify({"status": "success", "message": "Student added successfully"}), 200
    except Exception as e:
        print("Add student error:", e)
        return jsonify({"status": "error", "message": "Failed to add student"}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/delete-student', methods=['POST'])
def delete_student():
    data = request.get_json(silent=True) or {}
    rollnumber = data.get('rollnumber')

    if not rollnumber:
        return jsonify({"status": "error", "message": "Roll number is required"}), 400

    db = get_db_connection()
    if not db:
        return jsonify({"status": "error", "message": "Database connection failed"}), 500

    cursor = db.cursor()
    try:
        cursor.execute("UPDATE students SET IsActive = 0 WHERE RollNo = %s", (rollnumber,))
        db.commit()
        return jsonify({"status": "success", "message": "Student marked as inactive"}), 200
    except Exception as e:
        print("Delete student error:", e)
        return jsonify({"status": "error", "message": "Failed to delete student"}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/get_student_data', methods=['GET'])
def get_student_data():
    student_id = request.args.get('studentId')
    if not student_id:
        return jsonify({"success": False, "error": "Invalid request"}), 400

    db = get_db_connection()
    if not db:
        return jsonify({"success": False, "error": "Database connection failed"}), 500

    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT Subject_Name, roll_no, lectures_attended, 
                   unit_test, oral_practical, mean 
            FROM StudentReport 
            WHERE roll_no = %s
        """, (student_id,))
        rows = cursor.fetchall()

        return jsonify({"success": True, "data": rows if rows else []}), 200
    except Exception as e:
        print("Get student data error:", e)
        return jsonify({"success": False, "error": "Failed to fetch student data"}), 500
    finally:
        cursor.close()
        db.close()

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)