from requests import post
from datetime import timedelta

# r = post("http://localhost/user", json={"user": "Mike Busuttil"})
# print(r.json())

# r = post("http://localhost/user", json={"user": "Mikey B", "org": "Acme💥"})
# print(r.json())

# payload = {
#     "user": "4:f33852a2-d3c7-4508-97e4-ba99dfc83aa6:2",
#     "task": {
#         "title": "get 'er done",
#         "point_estimate": 5
#     }
# }
# r = post("http://localhost/task", json=payload)
# print(r.json())

payload = {
    "user": "4:f33852a2-d3c7-4508-97e4-ba99dfc83aa6:2",
    "task": {
        # "parent": "4:f33852a2-d3c7-4508-97e4-ba99dfc83aa6:5",
        "title": "keep mothertrucking",
        "time_estimate": timedelta(hours=1).seconds,
    }
}
r = post("http://localhost/task", json=payload)
print(r.json())
