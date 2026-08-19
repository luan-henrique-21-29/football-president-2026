import json
import math
import re
import time
from datetime import date, datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

API='https://transfermarkt-api.fly.dev/clubs/{club_id}/players'
SQUAD_URL='https://www.transfermarkt.com/-/kader/verein/{club_id}/saison_id/2026/plus/1'
TARGET={'GB1','GB2','ES1','ES2','IT1','IT2','FR1','FR2','BRA1','BRA2','MLS1','SA1'}
API_HEADERS={'User-Agent':'GolacoClash/3.0 (+github-actions)','Accept':'application/json'}
WEB_HEADERS={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36','Accept-Language':'en-US,en;q=0.9'}
TODAY=date.today()

def val(v,default=0):
    try:return int(v or default)
    except:return default

def money(v):
    text=str(v or '').strip().lower().replace('€','').replace(',','')
    if not text or text in {'-','?'}:return 0
    m=re.search(r'([0-9]+(?:\.[0-9]+)?)',text)
    if not m:return 0
    n=float(m.group(1))
    if 'bn' in text or 'b' in text:n*=1_000_000_000
    elif 'm' in text:n*=1_000_000
    elif 'k' in text:n*=1_000
    return int(n)

def iso(v):
    text=str(v or '').strip()
    if not text:return ''
    for fmt in ('%Y-%m-%d','%b %d, %Y','%d.%m.%Y','%m/%d/%Y'):
        try:return datetime.strptime(text[:20],fmt).date().isoformat()
        except:pass
    m=re.search(r'(20\d{2})-(\d{2})-(\d{2})',text)
    return m.group(0) if m else ''

def age(dob):
    try:
        d=datetime.strptime(str(dob)[:10],'%Y-%m-%d').date();return TODAY.year-d.year-((TODAY.month,TODAY.day)<(d.month,d.day))
    except:return 25

def overall(value,years,pos,highest=0):
    current=max(0,val(value));peak=max(current,val(highest));peak_share=.05 if years<=21 else .09 if years<=24 else .13 if years<=29 else .23 if years<=32 else .30
    pl=str(pos or '').lower();bias=1.18 if 'goalkeeper' in pl else 1.07 if any(x in pl for x in ('defender','back','centre-back','full-back')) else 1.0
    effective=max(80_000,(current*(1-peak_share)+peak*peak_share)*bias)
    score=59+11*math.log10(effective/100000+1)
    if years<=18:score-=3
    elif years<=20:score-=1.5
    elif years>=37:score-=3.2
    elif years>=35:score-=2
    elif years>=33:score-=1
    if 'goalkeeper' in pl and 29<=years<=34:score+=.6
    if current>=80_000_000:score+=.8
    if current>=120_000_000:score+=.6
    if peak>=100_000_000 and years>=30:score+=.4
    return max(50,min(94,round(score)))

def potential(ovr,years,value):
    bonus=9 if years<=18 else 7 if years<=20 else 5 if years<=22 else 3 if years<=24 else 1 if years<=27 else 0
    if val(value)>=35_000_000 and years<=22:bonus+=1
    return max(ovr,min(96,ovr+bonus))

def request_api(session,club_id):
    try:
        r=session.get(API.format(club_id=club_id),headers=API_HEADERS,timeout=18)
        if r.status_code!=200:return None
        data=r.json();rows=data.get('players') if isinstance(data,dict) else None
        return rows if isinstance(rows,list) and rows else None
    except:return None

def direct_squad(session,club_id):
    try:
        r=session.get(SQUAD_URL.format(club_id=club_id),headers=WEB_HEADERS,timeout=25)
        if r.status_code!=200:return None
        soup=BeautifulSoup(r.text,'html.parser');table=soup.select_one('#yw1 table.items') or soup.select_one('table.items')
        if not table:return None
        rows=[]
        for tr in table.select(':scope > tbody > tr'):
            pos=tr.select_one('td.posrela');link=pos.select_one('a[href*="/profil/spieler/"]') if pos else None
            if not link:continue
            href=link.get('href','');m=re.search(r'/spieler/(\d+)',href)
            if not m:continue
            pid=m.group(1);name=(link.get('title') or link.get_text(' ',strip=True) or '').strip()
            cells=tr.find_all('td',recursive=False)
            if len(cells)<9:continue
            pos_rows=pos.select('tr') if pos else []
            position=pos_rows[1].get_text(' ',strip=True) if len(pos_rows)>1 else ''
            dob_age=cells[2].get_text(' ',strip=True);dob_match=re.search(r'([A-Z][a-z]{2} \d{1,2}, 20?\d{2}|[A-Z][a-z]{2} \d{1,2}, 19\d{2})',dob_age)
            dob=iso(dob_match.group(1)) if dob_match else ''
            age_match=re.search(r'\((\d{1,2})\)',dob_age);years=int(age_match.group(1)) if age_match else age(dob)
            nations=[img.get('title','').strip() for img in tr.select('img.flaggenrahmen') if img.get('title')]
            height_text=cells[4].get_text(' ',strip=True);height=0
            hm=re.search(r'(\d[.,]\d{2})',height_text)
            if hm:height=round(float(hm.group(1).replace(',','.'))*100)
            foot=cells[5].get_text(' ',strip=True);joined=iso(cells[6].get_text(' ',strip=True));signed_img=cells[7].select_one('img[title]');signed_from=signed_img.get('title','').strip() if signed_img else ''
            contract=iso(cells[8].get_text(' ',strip=True));market_cell=tr.select_one('td.rechts.hauptlink');market=money(market_cell.get_text(' ',strip=True) if market_cell else '')
            image=tr.select_one('img.bilderrahmen-fixed') or tr.select_one('img[src*="portrait"]');image_url=(image.get('data-src') or image.get('src') or '').strip() if image else ''
            rows.append({'id':pid,'name':name,'position':position,'date_of_birth':dob,'age':years,'nationality':nations,'height':height,'foot':foot,'joined_on':joined,'signed_from':signed_from,'contract':contract,'market_value':market,'image_url':image_url,'status':''})
        return rows or None
    except Exception as exc:
        print(f'direct squad {club_id} failed: {exc}');return None

def merge_row(row,club,current):
    dob=iso(row.get('date_of_birth') or row.get('dateOfBirth'));years=val(row.get('age'),age(dob));market=val(row.get('market_value') or row.get('marketValue'));contract=iso(row.get('contract'));joined=iso(row.get('joined_on') or row.get('joinedOn'));position=str(row.get('position') or (current or {}).get('position') or 'Unknown');cid=str(club.get('id'))
    if current:
        current['clubId']=cid;current['club']=club.get('name','');current['competitionId']=club.get('competitionId','')
        if dob:current['birthDate']=dob;current['age']=years
        if market>0:current['value']=market;current['highestValue']=max(val(current.get('highestValue')),market)
        if contract:current['contractUntil']=contract
        if joined:current['joinedOn']=joined
        if row.get('foot'):current['foot']=row.get('foot')
        if val(row.get('height'))>0:current['height']=val(row.get('height'))
        if row.get('signed_from') or row.get('signedFrom'):current['signedFrom']=row.get('signed_from') or row.get('signedFrom')
        if row.get('status'):current['status']=row.get('status')
        if row.get('image_url') and not current.get('imageUrl'):current['imageUrl']=row.get('image_url')
        current['position']=position;current['overall']=overall(current.get('value'),years,position,current.get('highestValue'));current['potential']=potential(current['overall'],years,current.get('value'));current['liveSquadCheckedAt']=TODAY.isoformat();return current,False
    ovr=overall(market,years,position,market);nats=row.get('nationality') or []
    nationality=', '.join(nats) if isinstance(nats,list) else str(nats)
    return {'id':str(row.get('id')),'name':str(row.get('name') or '').strip(),'firstName':'','lastName':'','clubId':cid,'club':club.get('name',''),'competitionId':club.get('competitionId',''),'nationality':nationality,'birthDate':dob,'age':years,'position':position,'subPosition':'','foot':row.get('foot') or '','height':val(row.get('height')),'value':market,'highestValue':market,'contractUntil':contract,'agentName':'','imageUrl':row.get('image_url') or '','overall':ovr,'potential':potential(ovr,years,market),'joinedOn':joined,'signedFrom':row.get('signed_from') or row.get('signedFrom') or '','lastTransferFee':0,'lastTransferDate':'','lastTransferFromId':'','lastTransferFrom':'','lastTransferToId':cid,'lastTransferTo':club.get('name',''),'liveSquadCheckedAt':TODAY.isoformat()},True

def main():
    p_path=Path('data/players.json');c_path=Path('data/clubs-world.json');m_path=Path('data/database-meta.json');payload=json.loads(p_path.read_text(encoding='utf-8'));clubs_payload=json.loads(c_path.read_text(encoding='utf-8'));players=payload.get('players',[]);clubs=clubs_payload.get('clubs',[]);by_id={str(p.get('id')):p for p in players};session=requests.Session();success=failed=updated=added=api_ok=direct_ok=0
    targets=[c for c in clubs if c.get('competitionId') in TARGET and (not c.get('lastSeason') or val(c.get('lastSeason'))>=TODAY.year-1)]
    print(f'Current squad merge: {len(targets)} active clubs')
    for idx,club in enumerate(targets,1):
        cid=str(club.get('id') or '');rows=request_api(session,cid);source='api'
        if rows:api_ok+=1
        else:
            rows=direct_squad(session,cid);source='direct'
            if rows:direct_ok+=1
        if not rows:
            failed+=1;print(f'[{idx}/{len(targets)}] {club.get("name")}: live unavailable; weekly datapack preserved');time.sleep(.7);continue
        success+=1;seen=0
        for row in rows:
            pid=str(row.get('id') or '');name=str(row.get('name') or '').strip()
            if not pid or not name:continue
            merged,is_new=merge_row(row,club,by_id.get(pid));seen+=1
            if is_new:players.append(merged);by_id[pid]=merged;added+=1
            else:updated+=1
        print(f'[{idx}/{len(targets)}] {club.get("name")}: {seen} players ({source})');time.sleep(1.05 if source=='direct' else .6)
    meta=payload.get('meta',{});meta.update({'gameSnapshot':TODAY.isoformat(),'liveSquadsSyncedAt':datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z'),'liveSquadClubsSuccess':success,'liveSquadClubsFailed':failed,'liveSquadApiSuccess':api_ok,'liveSquadDirectSuccess':direct_ok,'playerCount':len(players),'ratingModel':'GCP calibrated market-age-position v2'});payload['meta']=meta;players.sort(key=lambda p:(-val(p.get('overall')),-val(p.get('value')),p.get('name','')));p_path.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    if m_path.exists():
        db=json.loads(m_path.read_text(encoding='utf-8'));db.update({k:meta[k] for k in ('gameSnapshot','liveSquadsSyncedAt','liveSquadClubsSuccess','liveSquadClubsFailed','liveSquadApiSuccess','liveSquadDirectSuccess','playerCount','ratingModel')});m_path.write_text(json.dumps(db,ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'Live merge: {success} clubs ({api_ok} API, {direct_ok} direct), {failed} preserved from weekly data, {updated} updated, {added} added')
if __name__=='__main__':main()
