from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print('=== 1. FAKE / UNKNOWN CREDENTIALS TEST ===')
fake_payload = {
    'name': 'Test Unknown User',
    'roll_number': 'FAKE999999',
    'password': 'WrongPassword123!'
}
res_fake = client.post('/api/auth/student/login', json=fake_payload)
print(f'Status Code: {res_fake.status_code}')
print(f'Response Body: {res_fake.json()}')
print(f'Has token: {"token" in res_fake.json()}')
print(f'Has session: {res_fake.json().get("authenticated", False)}')

assert res_fake.status_code == 401
assert 'token' not in res_fake.json()
assert res_fake.json().get('authenticated', False) is False
print('RESULT: REJECTED with 401 Unauthorized. NO token, NO session created.')

print('\n=== 2. NAME MISMATCH / WRONG NAME TEST ===')
wrong_name_payload = {
    'name': 'Wrong Name',
    'roll_number': 'STUDENT',
    'password': 'student@123'
}
res_wrong_name = client.post('/api/auth/student/login', json=wrong_name_payload)
print(f'Status Code: {res_wrong_name.status_code}')
print(f'Response Body: {res_wrong_name.json()}')
print(f'Has token: {"token" in res_wrong_name.json()}')
assert res_wrong_name.status_code == 401
assert 'token' not in res_wrong_name.json()
print('RESULT: REJECTED with 401 Unauthorized when the student name does not match the roll number.')

print('\n=== 3. REAL / VALID CREDENTIALS TEST ===')
valid_payload = {
    'name': 'Student User',
    'roll_number': 'STUDENT',
    'password': 'student@123'
}
res_valid = client.post('/api/auth/student/login', json=valid_payload)
print(f'Status Code: {res_valid.status_code}')
print(f'Response Body: {res_valid.json()}')
print(f'Has token: {"token" in res_valid.json()}')
print(f'User Role: {res_valid.json().get("user", {}).get("role")}')
print(f'User Name: {res_valid.json().get("user", {}).get("name")}')
print(f'Roll Number: {res_valid.json().get("user", {}).get("roll_number")}')

assert res_valid.status_code == 200
assert 'token' in res_valid.json()
assert res_valid.json()['user']['role'] == 'student'
assert res_valid.json()['user']['roll_number'] == 'STUDENT'
print('RESULT: ACCEPTED with 200 OK. Valid JWT token issued.')
