import requests

url = "http://127.0.0.1:8000/cv/upload-cv"

headers = {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJwZWRybyIsImV4cCI6MTc3OTA3MTkxM30.EGFaspDQTZyj38E1ENILZBEYuyoRPD3JDuizKOc9aMA"
}

files = {
    "file": open("Pedro.pdf", "rb")
}

response = requests.post(url, headers=headers, files=files)

print("STATUS:", response.status_code)
print("RESPONSE:", response.text)