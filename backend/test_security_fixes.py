#!/usr/bin/env python3
"""
SECURITY AUDIT: Test that fake credentials are properly rejected
Tests the fixes implemented in commit 9aac3e7
"""
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.auth_service import auth_service
from app.services.users_service import UsersService

def test_student_fake_credentials():
    """Test 1: Student login with fake credentials should FAIL"""
    print("\n" + "="*70)
    print("TEST 1: Student Login - Fake Credentials Should FAIL")
    print("="*70)
    
    users_service = UsersService()
    
    # Attempt to login with completely fake credentials
    result_user, result_err = users_service.authenticate_student(
        name="ZZZ UNKNOWN STUDENT",
        roll_number="FAKE-999999",
        password="DefinitelyWrongPassword!987"
    )
    
    if result_err and not result_user:
        print("✅ PASS: Fake student credentials REJECTED")
        print(f"   Error message: {result_err}")
        return True
    else:
        print("❌ FAIL: Fake student credentials were ACCEPTED")
        print(f"   User: {result_user}")
        return False


def test_student_valid_credentials():
    """Test 2: Valid student should still work"""
    print("\n" + "="*70)
    print("TEST 2: Student Login - Valid Credentials Should PASS")
    print("="*70)
    
    users_service = UsersService()
    
    # Try with a pre-seeded account (from _initialize_seed_users)
    result_user, result_err = users_service.authenticate_student(
        name="Student User",  # Exact name from seed
        roll_number="STUDENT",  # From seed
        password="student@123"  # From seed
    )
    
    if result_user and not result_err:
        print("✅ PASS: Valid student credentials ACCEPTED")
        print(f"   User: {result_user.name} (role: {result_user.role})")
        return True
    else:
        print("❌ FAIL: Valid student credentials were REJECTED")
        print(f"   Error: {result_err}")
        return False


def test_host_fake_credentials():
    """Test 3: Host login with fake credentials should FAIL"""
    print("\n" + "="*70)
    print("TEST 3: Host Login - Fake Credentials Should FAIL")
    print("="*70)
    
    users_service = UsersService()
    
    # Try with fake host credentials
    result_user, result_err = users_service.authenticate(
        username="fakevamsi",
        password="fakevamsi@999",
        role="host"
    )
    
    if result_err and not result_user:
        print("✅ PASS: Fake host credentials REJECTED")
        print(f"   Error: {result_err}")
        return True
    else:
        print("❌ FAIL: Fake host credentials were ACCEPTED")
        return False


def test_host_valid_credentials():
    """Test 4: Valid host should work"""
    print("\n" + "="*70)
    print("TEST 4: Host Login - Valid Credentials Should PASS")
    print("="*70)
    
    users_service = UsersService()
    
    # Try with default host credentials
    result_user, result_err = users_service.authenticate(
        username="vamsi",
        password="vamsi@123",
        role="host"
    )
    
    if result_user and not result_err:
        print("✅ PASS: Valid host credentials ACCEPTED")
        print(f"   User: {result_user.name} (role: {result_user.role})")
        return True
    else:
        print("❌ FAIL: Valid host credentials were REJECTED")
        print(f"   Error: {result_err}")
        return False


def test_password_verification_with_none_values():
    """Test 5: verify_password should reject None/empty hash or salt"""
    print("\n" + "="*70)
    print("TEST 5: Password Verification - None Values Should REJECT")
    print("="*70)
    
    # Test with None password_hash
    result = auth_service.verify_password("testpass", None, "somesalt")
    if result == False:
        print("✅ PASS: None password_hash properly rejected")
    else:
        print("❌ FAIL: None password_hash was not rejected")
        return False
    
    # Test with None salt
    result = auth_service.verify_password("testpass", "somehash", None)
    if result == False:
        print("✅ PASS: None salt properly rejected")
    else:
        print("❌ FAIL: None salt was not rejected")
        return False
    
    # Test with empty strings
    result = auth_service.verify_password("testpass", "", "")
    if result == False:
        print("✅ PASS: Empty password_hash rejected")
        return True
    else:
        print("❌ FAIL: Empty password_hash was not rejected")
        return False


def run_all_tests():
    """Run all security tests"""
    print("\n" + "="*70)
    print("SECURITY AUDIT: Authentication Vulnerability Fixes")
    print("Testing fixes from commit: 9aac3e7")
    print("="*70)
    
    tests = [
        test_student_fake_credentials,
        test_student_valid_credentials,
        test_host_fake_credentials,
        test_host_valid_credentials,
        test_password_verification_with_none_values,
    ]
    
    results = []
    for test_func in tests:
        try:
            result = test_func()
            results.append(result)
        except Exception as e:
            print(f"❌ EXCEPTION: {e}")
            results.append(False)
    
    # Summary
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)
    passed = sum(results)
    total = len(results)
    print(f"✅ Passed: {passed}/{total}")
    print(f"❌ Failed: {total - passed}/{total}")
    
    if all(results):
        print("\n🔐 SECURITY AUDIT PASSED - All authentication vulnerabilities fixed!")
        return True
    else:
        print("\n⚠️  SECURITY AUDIT FAILED - Some issues remain!")
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
