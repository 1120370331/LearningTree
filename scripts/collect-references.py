"""Collect public, shallow reference checkouts without installing or running them."""
import concurrent.futures
import json
import os
from pathlib import Path
import subprocess
import sys
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'references'
DEST.mkdir(exist_ok=True)
CACHED = {x['repository']: x for x in json.loads((DEST / 'manifest.json').read_text(encoding='utf-8'))} if (DEST / 'manifest.json').exists() else {}
GROUPS = {
    'learning-paths': ['kamranahmedse/developer-roadmap', '24kchengYe/human-skill-tree', 'Preptics/SkillTreeOSS', 'iuliaferoli/backtoengineering', 'rajasegar/ember-skill-tree', 'IvanR3D/skill-quest'],
    'spaced-repetition': ['open-spaced-repetition/ts-fsrs', 'open-spaced-repetition/fsrs4anki', 'ankitects/anki', 'open-spaced-repetition/free-spaced-repetition-scheduler', 'eudoxia0/hashcards'],
    'knowledge-structure': ['hizzgdev/jsmind', 'wanglin2/mind-map', 'markmap/markmap', 'xyflow/xyflow', 'dagrejs/dagre', 'd3/d3-hierarchy'],
    'feedback-and-notes': ['HabitRPG/habitica', 'laurent22/joplin', 'logseq/logseq', 'toeverything/AFFiNE', 'purocean/yn', 'learningequality/kolibri', 'excalidraw/excalidraw'],
}

def get_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'LearningTree-reference-research'})
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)

def collect(item):
    group, repo = item
    entry = {'repository': repo, 'category': group, 'url': f'https://github.com/{repo}'}
    path = DEST / repo.replace('/', '--')
    try:
        cached = CACHED.get(repo)
        data = {'description': cached.get('description'), 'license': {'spdx_id': cached.get('license')}, 'stargazers_count': cached.get('stars', 0), 'archived': cached.get('archived', False), 'clone_url': entry['url'] + '.git'} if cached and 'description' in cached else get_json(f'https://api.github.com/repos/{repo}')
        entry.update(description=data.get('description'), license=(data.get('license') or {}).get('spdx_id'), stars=data['stargazers_count'], archived=data['archived'])
        env = {**os.environ, 'GIT_TERMINAL_PROMPT': '0', 'GIT_LFS_SKIP_SMUDGE': '1', 'GIT_CONFIG_GLOBAL': os.devnull, 'GIT_CONFIG_NOSYSTEM': '1'}
        if not (path / '.git').exists():
            result = subprocess.run(['git', '-c', 'core.longpaths=true', '-c', 'http.version=HTTP/1.1', 'clone', '--depth', '1', data['clone_url'], str(path)], capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=240, env=env)
            if result.returncode:
                raise RuntimeError(result.stderr[-700:])
        elif cached and cached['status'] == 'failed':
            result = subprocess.run(['git', '-c', 'core.longpaths=true', '-c', 'http.version=HTTP/1.1', '-C', str(path), 'restore', '--source=HEAD', '--worktree', '.'], capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=240, env=env)
            if result.returncode:
                raise RuntimeError(result.stderr[-700:])
        subprocess.run(['git', '-C', str(path), 'config', '--local', 'core.longpaths', 'true'], check=True, env=env)
        entry['commit'] = subprocess.check_output(['git', '-C', str(path), 'rev-parse', 'HEAD'], text=True).strip()
        entry['path'] = str(path.relative_to(ROOT)).replace('\\', '/')
        entry['status'] = 'cloned'
    except Exception as error:
        entry['status'] = 'failed'
        entry['error'] = str(error)
    print(f"{entry['status']}: {repo}", flush=True)
    return entry

if __name__ == '__main__':
    queries = ['learning skill tree stars:>10', 'spaced repetition stars:>100', 'personal learning tracker stars:>10', 'mind map stars:>100', 'learning feedback stars:>50']
    searches = []
    for query in ([] if '--retry' in sys.argv else queries):
        try:
            import urllib.parse
            data = get_json('https://api.github.com/search/repositories?' + urllib.parse.urlencode({'q': query, 'sort': 'stars', 'per_page': 15}))
            searches.append({'query': query, 'total': data['total_count'], 'results': [{'repository': x['full_name'], 'description': x['description'], 'stars': x['stargazers_count']} for x in data['items']]})
        except Exception as error:
            searches.append({'query': query, 'error': str(error)})
    if searches:
        (DEST / 'search-results.json').write_text(json.dumps(searches, ensure_ascii=False, indent=2), encoding='utf-8')
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        entries = list(executor.map(collect, [(group, repo) for group, repos in GROUPS.items() for repo in repos]))
    (DEST / 'manifest.json').write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'cloned': sum(x['status'] == 'cloned' for x in entries), 'total': len(entries)}), flush=True)
