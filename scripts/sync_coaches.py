import csv, gzip, io, json, re, time, urllib.request
from datetime import date, datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

TARGET_COMPETITIONS={'GB1','GB2','ES1','ES2','IT1','IT2','FR1','FR2','BRA1','BRA2','MLS1','SA1'}
BASE='https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data'
STAFF_URL='https://www.transfermarkt.com/-/mitarbeiter/verein/{club_id}'
HEADERS={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36','Accept-Language':'en-US,en;q=0.9'}
TODAY=date.today()
OVERRIDES={
    '281':{'name':'Enzo Maresca','contractUntil':'2029-06-30','source':'official-mancity-2026-06-29'},
    '418':{'name':'José Mourinho','contractUntil':'2029-06-30','source':'official-realmadrid-2026-06-11'},
    '631':{'name':'Xabi Alonso','contractUntil':'2030-06-30','source':'official-chelsea-2026-05-17'},
    '199':{'name':'Fernando Diniz','contractUntil':'2026-12-31','source':'current-corinthians-2026-08'}
}

def clean_img(value):return (value or '').replace('small','header').strip()
def clean_date(text):
    m=re.search(r'(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})',text or '')
    if not m:return ''
    try:return date(*map(int,m.groups())).isoformat()
    except:return ''

def latest_game_managers():
    out={}
    try:
        req=urllib.request.Request(f'{BASE}/games.csv.gz',headers={'User-Agent':'ClubDynasty26/2.0'})
        with urllib.request.urlopen(req,timeout=180) as r:raw=gzip.decompress(r.read()).decode('utf-8-sig',errors='replace')
        for row in csv.DictReader(io.StringIO(raw)):
            when=str(row.get('date') or '')[:10]
            try:d=datetime.strptime(when,'%Y-%m-%d').date()
            except:continue
            if d>TODAY:continue
            for side in ('home','away'):
                cid=str(row.get(f'{side}_club_id') or '').strip();name=(row.get(f'{side}_club_manager_name') or '').strip()
                if not cid or not name:continue
                old=out.get(cid)
                if old is None or when>old['date']:out[cid]={'name':name,'date':when}
        print(f'Latest-game manager evidence for {len(out)} clubs')
    except Exception as exc:print(f'Latest games unavailable: {exc}')
    return out

def scrape_manager(club_id):
    try:
        r=requests.get(STAFF_URL.format(club_id=club_id),headers=HEADERS,timeout=22)
        if r.status_code!=200:return None
        soup=BeautifulSoup(r.text,'html.parser');candidates=[]
        for row in soup.select('tr'):
            link=row.select_one('a[href*="/profil/trainer/"]')
            if not link:continue
            text=' '.join(row.stripped_strings);score=0
            if re.search(r'\b(manager|head coach|trainer|treinador|entrenador)\b',text,re.I):score+=6
            if re.search(r'\b(assistant|auxiliar|goalkeeping|fitness|analyst|youth|u19|u21|u23)\b',text,re.I):score-=5
            name=link.get_text(' ',strip=True)
            if not name:continue
            img=row.select_one('img');image=clean_img((img or {}).get('data-src') or (img or {}).get('src') or '') if img else ''
            candidates.append((score,name,image,clean_date(text)))
        if not candidates:return None
        candidates.sort(key=lambda x:x[0],reverse=True);score,name,image,contract=candidates[0]
        if score<0:return None
        return {'name':name,'image':image,'contractUntil':contract,'source':'transfermarkt-staff-live'}
    except:return None

def main():
    path=Path('data/clubs-world.json')
    if not path.exists():raise SystemExit('data/clubs-world.json not found')
    raw=json.loads(path.read_text(encoding='utf-8'));clubs=raw.get('clubs',raw if isinstance(raw,list) else []);game_managers=latest_game_managers();records=[]
    targets=[c for c in clubs if c.get('competitionId') in TARGET_COMPETITIONS]
    for i,club in enumerate(clubs,1):
        cid=str(club.get('id') or '')
        if not cid:continue
        base={'clubId':cid,'club':club.get('name',''),'competitionId':club.get('competitionId','')}
        if cid in OVERRIDES:records.append({**base,**OVERRIDES[cid]});continue
        recent=game_managers.get(cid)
        if recent and club.get('competitionId') in TARGET_COMPETITIONS:
            records.append({**base,'name':recent['name'],'image':'','contractUntil':'','source':f'latest-match-{recent["date"]}'});continue
        if club.get('competitionId') in TARGET_COMPETITIONS:
            found=scrape_manager(cid);fallback=(club.get('coach') or club.get('coachName') or '').strip()
            if found and found.get('name'):records.append({**base,**found});print(f"{club.get('name')}: {found['name']} (live staff)")
            elif fallback:records.append({**base,'name':fallback,'image':'','contractUntil':'','source':'club-datapack-fallback'})
            time.sleep(.35);continue
        fallback=(club.get('coach') or club.get('coachName') or '').strip()
        if fallback:records.append({**base,'name':fallback,'image':'','contractUntil':'','source':'club-datapack-fallback'})
    by_id={str(r['clubId']):r for r in records}
    for cid,data in OVERRIDES.items():
        club=next((c for c in clubs if str(c.get('id'))==cid),{});by_id[cid]={'clubId':cid,'club':club.get('name',''),'competitionId':club.get('competitionId',''),**data}
    out={'snapshot':TODAY.isoformat(),'syncedAt':datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z'),'entity':'coaches','source':'latest match managers + live staff pages + verified overrides','records':sorted(by_id.values(),key=lambda r:(r.get('club',''),r.get('name','')))}
    Path('data/coaches.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')),encoding='utf-8');print(f"Wrote {len(out['records'])} coach records")

if __name__=='__main__':main()
