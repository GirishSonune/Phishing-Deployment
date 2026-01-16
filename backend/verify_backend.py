import requests
import json

BASE_URL = "http://localhost:5000/api/predict"

def test_whitelist():
    print("\n--- Testing Whitelist ---")
    url = "https://www.google.com"
    try:
        response = requests.post(BASE_URL, json={"url": url})
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        data = response.json()
        if data.get("prediction") == "Legitimate" and data.get("is_whitelisted") == True:
            print("PASS: Whitelist check worked.")
        else:
            print("FAIL: Whitelist check failed.")
    except Exception as e:
        print(f"FAIL: Request error: {e}")

def test_phishing():
    print("\n--- Testing Phishing URL ---")
    # A known phishing URL or suspicious looking one
    url = "http://secure-login-update-account.com"
    try:
        response = requests.post(BASE_URL, json={"url": url})
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        data = response.json()
        if data.get("prediction") == "Phishing":
            print("PASS: Phishing detection likely working (check riskScore).")
        else:
             print("NOTE: Model might classify this as Safe. Check logic.")
    except Exception as e:
        print(f"FAIL: Request error: {e}")

if __name__ == "__main__":
    print("Ensure the Flask app is running before executing this script.")
    test_whitelist()
    test_phishing()
