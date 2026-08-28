from fastapi.testclient import TestClient
from app.main import app
from app.services.users_service import users_service
from app.services.auth_service import auth_service
import random

client = TestClient(app)

def run_tests():
    print("=" * 70)
    print("CAMPUSFIX-AI STUDENT AUTHENTICATION VERIFICATION SUITE")
    print("=" * 70)

    rand_num = random.randint(100000, 999999)
    test_roll = f"211FA{rand_num}"
    test_name = "Karthik Student"
    test_password = "SecurePassword123!"

    # ----------------------------------------------------
    # TEST 1: Create a new student account -> Saved in backend/database
    # ----------------------------------------------------
    print("\n[TEST 1] Create New Student Account:")
    signup_payload = {
        "name": test_name,
        "roll_number": test_roll,
        "password": test_password,
        "confirm_password": test_password
    }
    res_signup = client.post("/api/auth/student/signup", json=signup_payload)
    print(f"  Status Code: {res_signup.status_code}")
    assert res_signup.status_code == 201, f"Expected 201, got {res_signup.status_code}: {res_signup.text}"
    signup_data = res_signup.json()
    assert signup_data.get("authenticated") is True
    assert "token" in signup_data
    assert signup_data.get("user", {}).get("role") == "student"
    assert signup_data.get("user", {}).get("roll_number") == test_roll
    student_token = signup_data["token"]

    # Verify user exists in backend storage and password is not plain text
    stored_user = users_service.find_user_by_username_or_id(test_roll)
    assert stored_user is not None, "Student user was not found in storage!"
    assert stored_user.password_hash is not None, "Password hash was not generated!"
    assert stored_user.password_hash != test_password, "Plain-text password detected in storage!"
    assert stored_user.role == "student", f"Expected role 'student', got '{stored_user.role}'"
    print("  --> PASS: Student account created, securely hashed, and stored in backend.")

    # ----------------------------------------------------
    # TEST 2: Sign in with that account -> Must succeed
    # ----------------------------------------------------
    print("\n[TEST 2] Student Sign In with Valid Credentials:")
    login_payload = {
        "roll_number": test_roll,
        "password": test_password
    }
    res_login = client.post("/api/auth/student/login", json=login_payload)
    print(f"  Status Code: {res_login.status_code}")
    assert res_login.status_code == 200, f"Expected 200, got {res_login.status_code}: {res_login.text}"
    login_data = res_login.json()
    assert login_data.get("authenticated") is True
    assert "token" in login_data
    assert login_data.get("user", {}).get("role") == "student"
    assert login_data.get("user", {}).get("roll_number") == test_roll
    print("  --> PASS: Student successfully logged in with Roll Number and Password.")

    # ----------------------------------------------------
    # TEST 3: Wrong Password -> Must fail (401)
    # ----------------------------------------------------
    print("\n[TEST 3] Wrong Password:")
    res_wrong_pwd = client.post("/api/auth/student/login", json={
        "roll_number": test_roll,
        "password": "IncorrectPassword999!"
    })
    print(f"  Status Code: {res_wrong_pwd.status_code}")
    assert res_wrong_pwd.status_code == 401, f"Expected 401, got {res_wrong_pwd.status_code}"
    assert "token" not in res_wrong_pwd.json()
    assert res_wrong_pwd.json().get("detail") == "Invalid roll number or password."
    print("  --> PASS: Wrong password rejected with 401 and 'Invalid roll number or password.'")

    # ----------------------------------------------------
    # TEST 4: Random / Unknown Roll Number -> Must fail (401)
    # ----------------------------------------------------
    print("\n[TEST 4] Random / Unknown Roll Number:")
    res_unknown = client.post("/api/auth/student/login", json={
        "roll_number": "UNKNOWN_ROLL_99999",
        "password": "AnyPassword123!"
    })
    print(f"  Status Code: {res_unknown.status_code}")
    assert res_unknown.status_code == 401, f"Expected 401, got {res_unknown.status_code}"
    assert "token" not in res_unknown.json()
    assert res_unknown.json().get("detail") == "Invalid roll number or password."
    print("  --> PASS: Unknown roll number rejected with 401.")

    # ----------------------------------------------------
    # TEST 5: Duplicate Roll Number -> Must fail (400)
    # ----------------------------------------------------
    print("\n[TEST 5] Duplicate Roll Number Registration:")
    res_dup = client.post("/api/auth/student/signup", json={
        "name": "Another Name",
        "roll_number": test_roll,
        "password": "AnotherPassword123!",
        "confirm_password": "AnotherPassword123!"
    })
    print(f"  Status Code: {res_dup.status_code}")
    assert res_dup.status_code == 400, f"Expected 400, got {res_dup.status_code}"
    assert "already registered" in res_dup.json().get("detail", "").lower()
    print("  --> PASS: Duplicate roll number registration rejected with HTTP 400.")

    # ----------------------------------------------------
    # TEST 6: Direct Access to Protected Endpoints Without Token Blocked
    # ----------------------------------------------------
    print("\n[TEST 6] Protected Route Access Guard:")
    res_no_auth = client.get("/api/auth/me")
    assert res_no_auth.status_code == 401
    res_fake_token = client.get("/api/auth/me", headers={"Authorization": "Bearer fake.jwt.token"})
    assert res_fake_token.status_code == 401
    print("  --> PASS: Unauthenticated/fake token requests blocked with HTTP 401.")

    # ----------------------------------------------------
    # TEST 7: Student Role Escalation / Privilege Escalation Prevention
    # ----------------------------------------------------
    print("\n[TEST 7] Student Privilege Escalation Prevention:")
    # Student attempting to access Host executive reports
    res_host_reports = client.get("/api/reports", headers={"Authorization": f"Bearer {student_token}"})
    assert res_host_reports.status_code == 403, f"Expected 403, got {res_host_reports.status_code}"
    # Student attempting to update technician availability
    res_tech_status = client.patch("/api/users/user-tech-anand/status?status_val=offline", headers={"Authorization": f"Bearer {student_token}"})
    assert res_tech_status.status_code == 403, f"Expected 403, got {res_tech_status.status_code}"
    print("  --> PASS: Student token strictly forbidden from Host and Technician privileged APIs (403 Forbidden).")

    # ----------------------------------------------------
    # TEST 8: Existing Staff Login Still Works Unchanged
    # ----------------------------------------------------
    print("\n[TEST 8] Existing Staff Login Integrity:")
    res_staff = client.post("/api/auth/login", json={
        "username": "anand",
        "password": "anand@123",
        "role": "technician"
    })
    assert res_staff.status_code == 200, f"Staff login failed: {res_staff.text}"
    assert res_staff.json().get("user", {}).get("role") == "technician"
    print("  --> PASS: Staff / Technician login intact and functional.")

    # ----------------------------------------------------
    # TEST 9: Existing Host Login Still Works Unchanged
    # ----------------------------------------------------
    print("\n[TEST 9] Existing Host Login Integrity:")
    res_host = client.post("/api/auth/login", json={
        "username": "vamsi",
        "password": "vamsi@123",
        "role": "host"
    })
    assert res_host.status_code == 200, f"Host login failed: {res_host.text}"
    assert res_host.json().get("user", {}).get("role") == "host"
    print("  --> PASS: Host / Administrator login intact and functional.")

    # ----------------------------------------------------
    # TEST 10: Authenticated Ticket Association
    # ----------------------------------------------------
    print("\n[TEST 10] Student Issue Report User ID Association:")
    ticket_payload = {
        "title": "Wi-Fi drop in Hall 3",
        "category": "Eduroam Wi-Fi",
        "priority": "Medium",
        "description": "Connection dropped during test",
        "netid": "spoofed.netid",
        "email": "spoofed@email.com"
    }
    res_ticket = client.post("/api/tickets", json=ticket_payload, headers={"Authorization": f"Bearer {student_token}"})
    assert res_ticket.status_code == 201, f"Ticket creation failed: {res_ticket.text}"
    created_ticket = res_ticket.json()
    # Ensure netid and email were bound to the authenticated student's real user identity, not spoofed frontend value
    assert created_ticket.get("netid") == test_roll.lower()
    print("  --> PASS: Ticket creation automatically bound to authenticated student's real identity.")

    print("\n" + "=" * 70)
    print("ALL 10 VERIFICATION TESTS PASSED 100% SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
