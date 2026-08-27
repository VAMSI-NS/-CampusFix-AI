from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print('=====================================================')
print('   CAMPUSFIX-AI CRITICAL AUTHENTICATION AUDIT TESTS  ')
print('=====================================================')

# TEST 1: Unknown Student
r1 = client.post('/api/auth/student/login', json={
    'name': 'Random Person',
    'roll_number': 'UNKNOWN123',
    'password': 'WrongPassword123'
})
print(f'TEST 1 [Unknown Student]: Status={r1.status_code}, Detail={r1.json().get("detail")}')
assert r1.status_code == 401
assert 'token' not in r1.json()

# TEST 2: Known Student + wrong password
r2 = client.post('/api/auth/student/login', json={
    'name': 'Student User',
    'roll_number': 'STUDENT',
    'password': 'WrongPassword999'
})
print(f'TEST 2 [Known Student + Wrong Pwd]: Status={r2.status_code}, Detail={r2.json().get("detail")}')
assert r2.status_code == 401
assert 'token' not in r2.json()

# TEST 3: Known Student + correct password
r3 = client.post('/api/auth/student/login', json={
    'name': 'Student User',
    'roll_number': 'STUDENT',
    'password': 'student@123'
})
print(f'TEST 3 [Known Student + Correct Pwd]: Status={r3.status_code}, Authenticated={r3.json().get("authenticated")}, User={r3.json().get("user", {}).get("name")}')
assert r3.status_code == 200
student_token = r3.json()['token']
assert r3.json()['user']['role'] == 'student'

# TEST 4: Unknown Staff + random password
r4 = client.post('/api/auth/login', json={
    'username': 'random_staff_user',
    'password': 'RandomPassword123',
    'role': 'technician'
})
print(f'TEST 4 [Unknown Staff]: Status={r4.status_code}, Detail={r4.json().get("detail")}')
assert r4.status_code == 401
assert 'token' not in r4.json()

# TEST 5: Known Staff + wrong password
r5 = client.post('/api/auth/login', json={
    'username': 'anand',
    'password': 'wrongpassword',
    'role': 'technician'
})
print(f'TEST 5 [Known Staff + Wrong Pwd]: Status={r5.status_code}, Detail={r5.json().get("detail")}')
assert r5.status_code == 401
assert 'token' not in r5.json()

# TEST 6: Known Staff + correct password
r6 = client.post('/api/auth/login', json={
    'username': 'anand',
    'password': 'anand@123',
    'role': 'technician',
    'specialization': 'Network'
})
print(f'TEST 6 [Known Staff + Correct Pwd]: Status={r6.status_code}, Authenticated={r6.json().get("authenticated")}, User={r6.json().get("user", {}).get("name")}')
assert r6.status_code == 200
staff_token = r6.json()['token']
assert r6.json()['user']['role'] == 'technician'

# TEST 7: Unknown Host + random password
r7 = client.post('/api/auth/login', json={
    'username': 'fake_host_user',
    'password': 'RandomPassword123',
    'role': 'host'
})
print(f'TEST 7 [Unknown Host]: Status={r7.status_code}, Detail={r7.json().get("detail")}')
assert r7.status_code == 401
assert 'token' not in r7.json()

# TEST 8: Known Host + correct password
r8 = client.post('/api/auth/login', json={
    'username': 'vamsi',
    'password': 'vamsi@123',
    'role': 'host'
})
print(f'TEST 8 [Known Host + Correct Pwd]: Status={r8.status_code}, Authenticated={r8.json().get("authenticated")}, User={r8.json().get("user", {}).get("name")}')
assert r8.status_code == 200
host_token = r8.json()['token']
assert r8.json()['user']['role'] == 'host'

# TEST 9: Logout & Protected API Rejection Without Token
r9_logout = client.post('/api/auth/logout', headers={'Authorization': f'Bearer {student_token}'})
assert r9_logout.status_code == 200
r9_unauth = client.get('/api/technicians')
print(f'TEST 9 [Unauthenticated Protected API]: Status={r9_unauth.status_code}, Detail={r9_unauth.json().get("detail")}')
assert r9_unauth.status_code == 401

# TEST 10: Role Cross-Access Violation (Student trying to call Host / Staff APIs, Staff trying to call Host APIs)
# 10a: Student tries to access Host Reports
r10a = client.get('/api/reports', headers={'Authorization': f'Bearer {student_token}'})
print(f'TEST 10a [Student -> Host Reports]: Status={r10a.status_code}, Detail={r10a.json().get("detail")}')
assert r10a.status_code == 403

# 10b: Student tries to access Technician Roster
r10b = client.get('/api/technicians', headers={'Authorization': f'Bearer {student_token}'})
print(f'TEST 10b [Student -> Technician List]: Status={r10b.status_code}, Detail={r10b.json().get("detail")}')
assert r10b.status_code == 403

# 10c: Staff tries to access Host Reports
r10c = client.get('/api/reports', headers={'Authorization': f'Bearer {staff_token}'})
print(f'TEST 10c [Staff -> Host Reports]: Status={r10c.status_code}, Detail={r10c.json().get("detail")}')
assert r10c.status_code == 403

# 10d: Host accesses Host Reports successfully
r10d = client.get('/api/reports', headers={'Authorization': f'Bearer {host_token}'})
print(f'TEST 10d [Host -> Host Reports]: Status={r10d.status_code}')
assert r10d.status_code == 200

print('\n=====================================================')
print('   ALL 10 VERIFICATION TESTS PASSED 100% SUCCESSFULLY!   ')
print('=====================================================')
