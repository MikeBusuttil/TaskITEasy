from requests import post

r = post("http://localhost/user", json={"user": "Mike Busuttil"})
print(r.json())

r = post("http://localhost/user", json={"user": "Mikey B", "org": "Acme💥"})
print(r.json())
