"""References for the minimal shell and game-style skill-tree redesign."""
import concurrent.futures
import json
import os
from pathlib import Path
import subprocess
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
REPOS = ['hayyi2/react-shadcn-starter', 'satnaing/shadcn-admin', 'andrico1234/beautiful-skill-tree', 'Acamaeda/The-Modding-Tree']

def collect(repo):
    path = ROOT / 'references' / repo.replace('/', '--')
    entry = {'repository': repo, 'url': 'https://github.com/' + repo}
    env = {**os.environ, 'GIT_CONFIG_GLOBAL': os.devnull, 'GIT_CONFIG_NOSYSTEM': '1', 'GIT_TERMINAL_PROMPT': '0', 'GIT_LFS_SKIP_SMUDGE': '1'}
    try:
        try:
            req = urllib.request.Request('https://api.github.com/repos/' + repo, headers={'User-Agent': 'LearningTree-design'})
            with urllib.request.urlopen(req, timeout=25) as response: info = json.load(response)
            entry.update(description=info['description'], license=(info.get('license') or {}).get('spdx_id'))
        except Exception as error:
            entry['metadata_error'] = str(error)
        if not (path / '.git').exists():
            result = subprocess.run(['git', '-c', 'core.longpaths=true', '-c', 'http.version=HTTP/1.1', 'clone', '--depth', '1', entry['url']+'.git', str(path)], capture_output=True, text=True, encoding='utf-8', errors='replace', env=env, timeout=180)
            if result.returncode: raise RuntimeError(result.stderr[-600:])
        subprocess.run(['git', '-C', str(path), 'config', 'core.longpaths', 'true'], check=True)
        entry.update(status='cloned', commit=subprocess.check_output(['git', '-C', str(path), 'rev-parse', 'HEAD'], text=True).strip(), path=str(path.relative_to(ROOT)).replace('\\', '/'))
    except Exception as error:
        entry.update(status='failed', error=str(error))
    print(json.dumps(entry, ensure_ascii=True), flush=True)
    return entry

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    entries = list(pool.map(collect, REPOS))
(ROOT/'references/design-manifest.json').write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding='utf-8')
