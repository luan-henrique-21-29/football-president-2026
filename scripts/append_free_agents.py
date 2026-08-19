import csv
import gzip
import io
import json
import math
import urllib.request
from datetime import date,datetime,timezone
from pathlib import Path

BASE='https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data'
TODAY=date.today()
OUT=Path('data/players.json')

def fetch_players():
    req=urllib.request.Request(f'{BASE}/players.csv.gz',headers={'User-Agent':'GolacoClash/3.0 (+github-actions)'})
    with urllib.request.urlopen(req,timeout=180) as r:return gzip.decompress(r.read()).decode('utf-8-sig',errors='replace')
def num(v):
    try:return int(float(str(v or 0).replace(',','')))
    except:return 0
def iso(v):
    text=str(v or '')[:10]
    try:datetime.strptime(text,'%Y-%m-%d');return text
    except:return ''
def age(dob):
    try:
        d=datetime.strptime(dob,'%Y-%m-%d').date();return TODAY.year-d.year-((TODAY.month,TODAY.day)<(d.month,d.day))
    except:return 25
def rating(value,years,pos):
    value=max(80_000,value);score=59+11*math.log10(value/100000+1)
    if years<=18:score-=3
    elif years<=20:score-=1.5
    elif years>=37:score-=3.2
    elif years>=35:score-=2
    elif years>=33:score-=1
    if str(pos).lower()=='goalkeeper' and 29<=years<=34:score+=.6
    return max(50,min(94,round(score)))
def potential(ovr,years,value):
    bonus=9 if years<=18 else 7 if years<=20 else 5 if years<=22 else 3 if years<=24 else 1 if years<=27 else 0
    if years<=22 and value>=35_000_000:bonus+=1
    if years>=30:bonus=0
    return max(ovr,min(96,ovr+bonus))

def main():
    payload=json.loads(OUT.read_text(encoding='utf-8'));players=payload.get('players',[]);known={str(p.get('id')) for p in players};rows=csv.DictReader(io.StringIO(fetch_players()));added=[]
    for row in rows:
        pid=str(row.get('player_id') or '').strip();name=str(row.get('name') or '').strip();club=str(row.get('current_club_id') or '').strip();club_name=str(row.get('current_club_name') or '').strip();last=num(row.get('last_season'));value=num(row.get('market_value_in_eur'));dob=iso(row.get('date_of_birth'));years=age(dob);position=str(row.get('position') or 'Unknown').strip()
        if not pid or pid in known or not name:continue
        if club and club not in {'0','-1'}:continue
        if club_name and club_name.lower() not in {'without club','free agent','vereinslos','sem clube',''}:continue
        if last and last<TODAY.year-1:continue
        if value<100_000 or not 16<=years<=39:continue
        ovr=rating(value,years,position)
        p={'id':pid,'name':name,'firstName':str(row.get('first_name') or '').strip(),'lastName':str(row.get('last_name') or '').strip(),'clubId':'FREE','club':'Livre','competitionId':'','nationality':str(row.get('country_of_citizenship') or '').strip(),'birthDate':dob,'age':years,'position':position,'subPosition':str(row.get('sub_position') or '').strip(),'foot':str(row.get('foot') or '').strip(),'height':num(row.get('height_in_cm')),'value':value,'highestValue':num(row.get('highest_market_value_in_eur')),'contractUntil':'','agentName':str(row.get('agent_name') or '').strip(),'imageUrl':str(row.get('image_url') or '').strip(),'overall':ovr,'potential':potential(ovr,years,value),'joinedOn':'','signedFrom':'','lastTransferFee':0,'lastTransferDate':'','lastTransferFromId':'','lastTransferFrom':'','lastTransferToId':'FREE','lastTransferTo':'Livre','dataStatus':'FREE_AGENT'}
        players.append(p);known.add(pid);added.append(p)
    players.sort(key=lambda p:(-num(p.get('overall')),-num(p.get('value')),p.get('name','')));payload['players']=players;meta=payload.setdefault('meta',{});meta['freeAgentCount']=sum(1 for p in players if str(p.get('clubId'))=='FREE');meta['freeAgentsSyncedAt']=datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z');meta['playerCount']=len(players);OUT.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf-8');print(f'Added {len(added)} free agents; total free agents {meta["freeAgentCount"]}')
if __name__=='__main__':main()
