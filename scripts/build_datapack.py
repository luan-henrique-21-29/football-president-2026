import csv
import gzip
import io
import json
import math
import re
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path

BASE='https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data'
SNAPSHOT=date.today()
TARGET_COMPETITIONS={'GB1','GB2','ES1','ES2','IT1','IT2','FR1','FR2','BRA1','BRA2','MLS1','SA1'}
OUT=Path('data');OUT.mkdir(exist_ok=True)

def fetch_gz(name):
    req=urllib.request.Request(f'{BASE}/{name}.csv.gz',headers={'User-Agent':'ClubDynasty26/2.0 (+github-actions)'})
    with urllib.request.urlopen(req,timeout=180) as response:raw=response.read()
    return gzip.decompress(raw).decode('utf-8-sig',errors='replace')
def num(value,default=0):
    if value in ('',None):return default
    if isinstance(value,(int,float)):return int(value)
    text=str(value).strip().replace(',','');m=re.search(r'-?\d+(?:\.\d+)?',text)
    if not m:return default
    try:base=float(m.group(0))
    except:return default
    low=text.lower()
    if 'm' in low and base<100000:base*=1_000_000
    elif 'k' in low and base<100000:base*=1_000
    return int(base)
def iso(value):
    value=str(value or '').strip()[:10]
    try:datetime.strptime(value,'%Y-%m-%d');return value
    except:return ''
def age_on(dob):
    try:
        born=datetime.strptime(str(dob)[:10],'%Y-%m-%d').date();return SNAPSHOT.year-born.year-((SNAPSHOT.month,SNAPSHOT.day)<(born.month,born.day))
    except:return 25
def overall(value,age,position):
    value=max(0,value);score=55+10.5*math.log10(value/100000+1) if value else 54
    if 21<=age<=29:score+=1
    elif age<=18:score-=2
    elif age>=36:score-=4
    elif age>=33:score-=2
    if position=='Goalkeeper' and age>=30:score+=1
    return max(50,min(93,round(score)))
def potential(ovr,age,value):
    bonus=8 if age<=18 else 6 if age<=20 else 4 if age<=22 else 2 if age<=24 else -1 if age>=31 else 0
    if value>=50_000_000 and age<=23:bonus+=1
    return max(ovr,min(95,ovr+bonus))
def transfer_fee(row):
    fee=num(row.get('transfer_fee'));raw=str(row.get('transfer_fee') or '').lower()
    if any(x in raw for x in ('free','loan','end of loan','?','-')) and not re.search(r'\d',raw):return 0
    return max(0,fee)
def parse_date(value):
    value=iso(value)
    return datetime.strptime(value,'%Y-%m-%d').date() if value else None

print('Downloading current Transfermarkt dataset...')
clubs_rows=list(csv.DictReader(io.StringIO(fetch_gz('clubs'))));players_rows=list(csv.DictReader(io.StringIO(fetch_gz('players'))))
try:transfers_rows=list(csv.DictReader(io.StringIO(fetch_gz('transfers'))))
except Exception as exc:print(f'Warning: transfers dataset unavailable: {exc}');transfers_rows=[]
clubs=[];club_map={}
for row in clubs_rows:
    cid=str(row.get('club_id') or '').strip()
    if not cid:continue
    club={'id':cid,'name':(row.get('name') or '').strip(),'competitionId':(row.get('domestic_competition_id') or '').strip(),'squadSize':num(row.get('squad_size')),'averageAge':row.get('average_age') or '','stadium':(row.get('stadium_name') or '').strip(),'stadiumSeats':num(row.get('stadium_seats')),'coach':(row.get('coach_name') or '').strip(),'totalMarketValue':row.get('total_market_value') or '','lastSeason':num(row.get('last_season'))}
    clubs.append(club);club_map[cid]=club
latest_transfer={};current_transfers=[]
for row in transfers_rows:
    pid=str(row.get('player_id') or '').strip();when=parse_date(row.get('transfer_date'))
    if not pid or not when or when>SNAPSHOT:continue
    t={'playerId':pid,'playerName':(row.get('player_name') or '').strip(),'date':when.isoformat(),'season':str(row.get('transfer_season') or ''),'fromClubId':str(row.get('from_club_id') or '').strip(),'fromClub':(row.get('from_club_name') or '').strip(),'toClubId':str(row.get('to_club_id') or '').strip(),'toClub':(row.get('to_club_name') or '').strip(),'fee':transfer_fee(row),'marketValueAtTransfer':num(row.get('market_value_in_eur'))}
    if pid not in latest_transfer or t['date']>latest_transfer[pid]['date']:latest_transfer[pid]=t
    if when.year>=SNAPSHOT.year-1 and (club_map.get(t['fromClubId'],{}).get('competitionId') in TARGET_COMPETITIONS or club_map.get(t['toClubId'],{}).get('competitionId') in TARGET_COMPETITIONS):current_transfers.append(t)
players=[]
for row in players_rows:
    name=(row.get('name') or '').strip();pid=str(row.get('player_id') or '').strip()
    if not name or not pid:continue
    last_season=num(row.get('last_season'))
    if last_season and last_season<SNAPSHOT.year-1:continue
    dob=iso(row.get('date_of_birth'));age=age_on(dob);position=(row.get('position') or 'Unknown').strip();base_value=num(row.get('market_value_in_eur'));club_id=str(row.get('current_club_id') or '').strip();club_name=(row.get('current_club_name') or '').strip();competition_id=(row.get('current_club_domestic_competition_id') or '').strip();last=latest_transfer.get(pid)
    if last:
        last_date=parse_date(last['date'])
        if last_date and last_date>=date(SNAPSHOT.year-1,6,1) and last['toClubId'] and last['toClubId']!='0':
            target=club_map.get(last['toClubId'])
            if target:club_id=last['toClubId'];club_name=target['name'] or last['toClub'];competition_id=target['competitionId']
        if last_date and last_date>=date(SNAPSHOT.year,5,1) and last['marketValueAtTransfer']>0:base_value=last['marketValueAtTransfer']
    if not club_name and club_id in club_map:club_name=club_map[club_id]['name']
    if not club_name:continue
    ovr=overall(base_value,age,position)
    players.append({'id':pid,'name':name,'firstName':(row.get('first_name') or '').strip(),'lastName':(row.get('last_name') or '').strip(),'clubId':club_id,'club':club_name,'competitionId':competition_id,'nationality':(row.get('country_of_citizenship') or '').strip(),'birthDate':dob,'age':age,'position':position,'subPosition':(row.get('sub_position') or '').strip(),'foot':(row.get('foot') or '').strip(),'height':num(row.get('height_in_cm')),'value':base_value,'highestValue':num(row.get('highest_market_value_in_eur')),'contractUntil':iso(row.get('contract_expiration_date')),'agentName':(row.get('agent_name') or '').strip(),'imageUrl':(row.get('image_url') or '').strip(),'overall':ovr,'potential':potential(ovr,age,base_value),'joinedOn':last['date'] if last and last.get('toClubId')==club_id else '','lastTransferFee':last['fee'] if last else 0,'lastTransferDate':last['date'] if last else '','lastTransferFromId':last['fromClubId'] if last else '','lastTransferFrom':last['fromClub'] if last else '','lastTransferToId':last['toClubId'] if last else '','lastTransferTo':last['toClub'] if last else ''})
players.sort(key=lambda x:(-x['overall'],-x['value'],x['name']));current_transfers.sort(key=lambda x:(x['date'],x['fee']),reverse=True)
meta={'gameSnapshot':SNAPSHOT.isoformat(),'syncedAt':datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z'),'source':'dcaribou/transfermarkt-datasets (weekly Transfermarkt dataset)','playerCount':len(players),'clubCount':len(clubs),'transferCount':len(current_transfers),'overallNote':'OVR e potencial são índices internos do jogo. Valores de mercado, contratos e transferências vêm do datapack de futebol e não são ratings da EA.'}
(OUT/'players.json').write_text(json.dumps({'meta':meta,'players':players},ensure_ascii=False,separators=(',',':')),encoding='utf-8');(OUT/'clubs-world.json').write_text(json.dumps({'meta':meta,'clubs':clubs},ensure_ascii=False,separators=(',',':')),encoding='utf-8');(OUT/'transfers.json').write_text(json.dumps({'meta':meta,'transfers':current_transfers[:5000]},ensure_ascii=False,separators=(',',':')),encoding='utf-8');(OUT/'database-meta.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Built {len(players)} players, {len(clubs)} clubs and {len(current_transfers)} recent transfers for {SNAPSHOT}')
