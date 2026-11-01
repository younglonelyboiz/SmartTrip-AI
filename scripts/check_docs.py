"""Check internal Markdown targets and explicit path references in document links."""
from pathlib import Path
import re,sys
from urllib.parse import unquote
root=Path(__file__).resolve().parents[1]
files=[root/'README.md',root/'frontend/README.md',*sorted((root/'docs').rglob('*.md'))]
errors=[];links=0
for p in files:
    text=p.read_text()
    for raw in re.findall(r'!?\[[^\]]*\]\(([^)]+)\)',text):
        target=unquote(raw.strip().strip('<>')).split('#')[0]
        if not target or re.match(r'^[a-zA-Z]+:',target):continue
        target=target.split(' "')[0]
        path=(p.parent/target).resolve() if not target.startswith('/') else Path(target)
        links+=1
        if not path.exists():errors.append(f'{p.relative_to(root)} -> {target}')
if errors:
    print('\n'.join(errors));sys.exit(1)
print(f'PASS: {len(files)} Markdown files, {links} local links; anchors/rendering checked separately')
