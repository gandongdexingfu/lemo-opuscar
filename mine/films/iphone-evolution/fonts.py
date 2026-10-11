# 下載字體（Google Fonts，SIL OFL 1.1）：Noto Sans SC 只取片中用到的字；IBM Plex Mono 拉丁全集
# python3 fonts.py → fonts/*.woff2 + fonts/fonts.css（改了片中文字就重跑）
import re, subprocess, urllib.parse, os
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
src = open("index.html", encoding="utf-8").read() + open("geo/iphone2007.mjs", encoding="utf-8").read()
chars = sorted(set(c for c in src if ord(c) > 0x2e80) | set("0123456789 ·×%，、：（）") | set(chr(c) for c in range(32, 127)))
text = "".join(chars)
os.makedirs("fonts", exist_ok=True)
for f in os.listdir("fonts"):
    if f.endswith(".woff2"): os.remove("fonts/" + f)
def get(url):
    return subprocess.run(["curl", "-sS", "-m", "30", "-A", UA, url], capture_output=True, text=True, check=True).stdout
faces = []
css = get("https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500&display=block&text=" + urllib.parse.quote(text))
for b in re.findall(r"@font-face \{(.*?)\}", css, re.S):
    w = re.search(r"font-weight: (\d+)", b).group(1); url = re.search(r"url\((\S+?)\)", b).group(1)
    name = f"NotoSansSC-{w}.woff2"; subprocess.run(["curl", "-sS", "-m", "60", "-o", "fonts/" + name, url], check=True)
    faces.append(f"@font-face{{font-family:'Noto Sans SC';font-weight:{w};font-display:block;src:url({name}) format('woff2')}}")
css = get("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=block")
for sub, b in re.findall(r"/\* (\S+) \*/\s*@font-face \{(.*?)\}", css, re.S):
    if sub != "latin": continue
    w = re.search(r"font-weight: (\d+)", b).group(1); url = re.search(r"url\((\S+?)\)", b).group(1)
    ur = re.search(r"unicode-range: ([^;]+);", b).group(1)
    name = f"IBMPlexMono-{w}-latin.woff2"; subprocess.run(["curl", "-sS", "-m", "60", "-o", "fonts/" + name, url], check=True)
    faces.append(f"@font-face{{font-family:'IBM Plex Mono';font-weight:{w};font-display:block;src:url({name}) format('woff2');unicode-range:{ur}}}")
open("fonts/fonts.css", "w").write("\n".join(faces) + "\n")
print(len(chars), "CJK/符號字元；", len(faces), "個字型")
