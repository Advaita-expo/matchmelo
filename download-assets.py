from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import Request, urlopen

out = Path(__file__).parent / 'dist' / 'assets'
photos = ['1524504388940-b1c1722653e1', '1534528741775-53994a69daeb', '1524250502761-1ac6f2e30d43', '1517841905240-472988babdf9', '1531123897727-8f129e1688ce', '1488426862026-3ee34a7d66df', '1506794778202-cad84cf45f1d', '1500648767791-00dcc994a43e', '1539571696357-5a69c17a67c6', '1519085360753-af0119f7cbe7']

def download(item):
    index, photo = item
    url = f'https://images.unsplash.com/photo-{photo}?auto=format&fit=crop&w=900&h=1100&q=85'
    with urlopen(Request(url, headers={'User-Agent': 'MatchmeloPrototype/1.0'}), timeout=40) as response:
        data = response.read()
    (out / f'profile-{index + 1}.jpg').write_bytes(data)
    return f'profile-{index + 1}.jpg: {len(data)} bytes'

with ThreadPoolExecutor(max_workers=5) as pool:
    for result in pool.map(download, enumerate(photos)):
        print(result)
