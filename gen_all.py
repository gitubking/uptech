import os, pathlib

BASE = r'C:\Users\hp\Desktop\uptech'

def w(rel, content):
    full = os.path.join(BASE, rel.replace('/', os.sep))
    pathlib.Path(os.path.dirname(full)).mkdir(parents=True, exist_ok=True)
    with open(full, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)
    print(f"WROTE {rel} ({len(content.encode())} bytes)")

print("Starting file generation...")
