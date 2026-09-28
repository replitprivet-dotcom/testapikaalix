import urllib.request
import re

with open('/tmp/manus.html') as f:
    text = f.read()

chunks = list(dict.fromkeys(re.findall(r'https://files\.manuscdn\.com/webapp/_next/static/chunks/[a-zA-Z0-9_\-\.]+\.js', text)))
print(f"Total unique chunks: {len(chunks)}")

for c in chunks:
    try:
        req = urllib.request.Request(c, headers={'User-Agent': 'Mozilla/5.0'})
        data = urllib.request.urlopen(req, timeout=4).read().decode('utf-8', errors='ignore')
        matches = set(re.findall(r'["\'`](/(?:api|trpc|v[1-9]|rpc)/[a-zA-Z0-9_\-\/\.]+)["\'`]', data))
        if matches:
            filename = c.split('/')[-1]
            print(f"--- {filename} ---")
            for m in list(matches)[:10]:
                print(f"  {m}")
    except Exception as e:
        pass
