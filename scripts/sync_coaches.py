import json, re, time
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

TARGET_COMPETITIONS={
    'GB1','GB2','ES1','ES2','IT1','IT2','FR1','FR2','BRA1','BRA2','MLS1','SA1'
}
STAFF_URL='https://www.transfermarkt.com/-/mitarbeiter/verein/{club_id}'
HEADERS={
    'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
    'Accept-Language':'en-US,en;q=0.9'
}
# Verified fallback for the game's snapshot when a provider page is stale or unavailable.
OVERRIDES={
    '199':{'name':'Fernando Diniz','contractUntil':'2026-12-31','source':'verified-news-2026-08-18'}
}

def clean_img(value):
    if not value:return ''
    return value.replace('small','header').strip()

def scrape_manager(club_id):
    try:
        r=requests.get(STAFF_URL.format(club_id=club_id),headers=HEADERS,timeout=18)
        if r.status_code!=200:return None
        soup=BeautifulSoup(r.text,'html.parser')
        rows=soup.select('tr')
        candidates=[]
        for row in rows:
            link=row.select_one('a[href*="/profil/trainer/"]')
            if not link:continue
            text=' '.join(row.stripped_strings)
            score=0
            if re.search(r'\b(manager|head coach|trainer|treinador)\b',text,re.I):score+=5
            if re.search(r'\b(assistant|auxiliar|goalkeeping|fitness|analyst)\b',text,re.I):score-=4
            name=link.get_text(' ',strip=True)
            if not name:continue
            img=row.select_one('img')
            image=clean_img((img or {}).get('data-src') or (img or {}).get('src') or '') if img else ''
            candidates.append((score,name,image,text))
        if not candidates:return None
        candidates.sort(key=lambda x:x[0],reverse=True)
        score,name,image,text=candidates[0]
        if score<0:return None
        return {'name':name,'image':image,'source':'transfermarkt-staff'}
    except Exception:
        return None

def main():
    path=Path('data/clubs-world.json')
    if not path.exists():raise SystemExit('data/clubs-world.json not found')
    raw=json.loads(path.read_text(encoding='utf-8'))
    clubs=raw.get('clubs',raw if isinstance(raw,list) else [])
    records=[]
    missing=[]
    for c in clubs:
        cid=str(c.get('id') or '')
        if not cid:continue
        coach=(c.get('coach') or c.get('coachName') or '').strip()
        base={'clubId':cid,'club':c.get('name',''),'competitionId':c.get('competitionId','')}
        if cid in OVERRIDES:
            records.append({**base,**OVERRIDES[cid]})
        elif coach:
            records.append({**base,'name':coach,'image':'','contractUntil':'','source':'club-datapack'})
        elif c.get('competitionId') in TARGET_COMPETITIONS:
            missing.append(base)

    print(f'Coach datapack: {len(records)} from club data, {len(missing)} to enrich')
    for i,c in enumerate(missing,1):
        found=scrape_manager(c['clubId'])
        if found:
            records.append({**c,**found,'contractUntil':''})
            print(f"[{i}/{len(missing)}] {c['club']}: {found['name']}")
        else:
            print(f"[{i}/{len(missing)}] {c['club']}: unavailable")
        time.sleep(.35)

    # Overrides always win after provider enrichment.
    by_id={str(r['clubId']):r for r in records}
    for cid,data in OVERRIDES.items():
        club=next((c for c in clubs if str(c.get('id'))==cid),{})
        by_id[cid]={'clubId':cid,'club':club.get('name',''),'competitionId':club.get('competitionId',''),**data}
    out={
        'snapshot':'2026-08-14',
        'syncedAt':datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z'),
        'entity':'coaches',
        'source':'club datapack + staff-page enrichment',
        'records':sorted(by_id.values(),key=lambda r:(r.get('club',''),r.get('name','')))
    }
    Path('data/coaches.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    print(f"Wrote {len(out['records'])} coach records")

if __name__=='__main__':
    main()
