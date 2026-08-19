import csv, gzip, io, json, re, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
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
 '281':{'name':'Enzo Maresca','contractUntil':'2029-06-30','status':'EMPLOYED','source':'official-mancity-2026-06-29'},
 '418':{'name':'José Mourinho','contractUntil':'2029-06-30','status':'EMPLOYED','source':'official-realmadrid-2026-06-11'},
 '631':{'name':'Xabi Alonso','contractUntil':'2030-06-30','status':'EMPLOYED','source':'official-chelsea-2026-05-17'},
 '199':{'name':'Fernando Diniz','contractUntil':'2026-12-31','status':'EMPLOYED','source':'official-corinthians-2026-04-07'},
 '614':{'name':'Leonardo Jardim','contractUntil':'','status':'EMPLOYED','source':'official-flamengo-current-2026-08'}
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
  req=urllib.request.Request(f'{BASE}/games.csv.gz',headers={'User-Agent':'GolacoClash/3.0'})
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
  r=requests.get(STAFF_URL.format(club_id=club_id),headers=HEADERS,timeout=14)
  if r.status_code!=200:return None
  soup=BeautifulSoup(r.text,'html.parser');candidates=[]
  for row in soup.select('tr'):
   link=row.select_one('a[href*="/profil/trainer/"]')
   if not link:continue
   text=' '.join(row.stripped_strings);score=0
   if re.search(r'\b(manager|head coach|trainer|treinador|entrenador|caretaker|interim)\b',text,re.I):score+=8
   if re.search(r'\b(assistant|auxiliar|goalkeeping|fitness|analyst|youth|u19|u21|u23|reserve)\b',text,re.I):score-=7
   name=link.get_text(' ',strip=True)
   if not name:continue
   img=row.select_one('img');image=clean_img((img or {}).get('data-src') or (img or {}).get('src') or '') if img else ''
   interim=bool(re.search(r'\b(caretaker|interim|interino)\b',text,re.I))
   candidates.append((score,name,image,clean_date(text),'INTERIM' if interim else 'EMPLOYED',text))
  if not candidates:return None
  candidates.sort(key=lambda x:x[0],reverse=True);score,name,image,contract,status,role=candidates[0]
  if score<1:return None
  return {'name':name,'image':image,'contractUntil':contract,'status':status,'role':role,'source':'transfermarkt-staff-live'}
 except Exception:return None

def main():
 path=Path('data/clubs-world.json')
 if not path.exists():raise SystemExit('data/clubs-world.json not found')
 raw=json.loads(path.read_text(encoding='utf-8'));clubs=raw.get('clubs',raw if isinstance(raw,list) else []);game_managers=latest_game_managers();targets=[c for c in clubs if c.get('competitionId') in TARGET_COMPETITIONS];live={}
 with ThreadPoolExecutor(max_workers=10) as pool:
  futures={pool.submit(scrape_manager,str(c.get('id'))):c for c in targets if c.get('id')}
  for f in as_completed(futures):
   c=futures[f];cid=str(c.get('id'));found=f.result()
   if found:live[cid]=found;print(f"{c.get('name')}: {found['name']} ({found['status']})")
 records=[]
 for club in clubs:
  cid=str(club.get('id') or '')
  if not cid:continue
  base={'clubId':cid,'club':club.get('name',''),'competitionId':club.get('competitionId','')}
  if cid in OVERRIDES:records.append({**base,**OVERRIDES[cid]});continue
  if cid in live:records.append({**base,**live[cid]});continue
  recent=game_managers.get(cid)
  if recent and club.get('competitionId') in TARGET_COMPETITIONS:records.append({**base,'name':recent['name'],'image':'','contractUntil':'','status':'EMPLOYED','source':f'latest-match-{recent["date"]}'});continue
  fallback=(club.get('coach') or club.get('coachName') or '').strip()
  if fallback:records.append({**base,'name':fallback,'image':'','contractUntil':'','status':'EMPLOYED','source':'club-datapack-fallback'})
  else:records.append({**base,'name':f"Comissão técnica interina — {club.get('name','Clube')}",'image':'','contractUntil':'','status':'INTERIM','source':'interim-fallback'})
 out={'snapshot':TODAY.isoformat(),'syncedAt':datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z'),'entity':'coaches','source':'live staff first + official overrides + latest match fallback','records':sorted(records,key=lambda r:(r.get('club',''),r.get('name','')))}
 Path('data/coaches.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')),encoding='utf-8');print(f"Wrote {len(out['records'])} coach records; live={len(live)}; missing=0")

if __name__=='__main__':main()
