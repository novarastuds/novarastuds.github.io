"""Write subtitles_id.srt from the page's subtitle list (the "sub" events in events.json)."""
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.environ.get('LIB') or os.path.expanduser('~/lemo-opuscar')
subs = [dict(t0=e['t'], t1=e['t1'], text=e['text']) for e in json.load(open(os.path.join(HERE, 'events.json')))['ev'] if e['type'] == 'sub']
cues = [{'t0': s['t0'], 't1': s['t1'], 'text': s['text']} for s in subs]
json.dump(cues, open(os.path.join(HERE, 'out', 'cues.json'), 'w'), ensure_ascii=False)
subprocess.run([sys.executable, os.path.join(LIB, 'core/render/srt.py'), os.path.join(HERE, 'out', 'cues.json'), os.path.join(HERE, 'subtitles_id.srt')], check=True)
