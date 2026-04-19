import urllib.request, urllib.parse
data = urllib.parse.urlencode({'optimized_text': 'test', 'format': 'pdf'}).encode('utf-8')
req = urllib.request.Request('http://localhost:8000/api/resume/download', data=data)
try:
    with urllib.request.urlopen(req) as r:
        print('Status:', r.getcode())
except Exception as e:
    print(e.read().decode())
