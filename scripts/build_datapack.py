import csv
import gzip
import io
import json
import math
import re
import urllib.request
from datetime import date, datetime, timezone, timedelta
from pathlib import Path

BASE='https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data'
SNAPSHOT=date.today()
TARGET_COMPETITIONS={'GB1','GB2','ES1','ES2','IT1','IT2','FR1','FR2','BRA1','BRA2','MLS1','SA1'}
OUT=Path('data');OUT.mkdir(exist_ok=True)

def request(name):
    return urllib.request.Request(f'{BASE}/{name}.csv.gz',headers={'User-Agent':'GolacoClash/3.1 (+github-actions)'})
def fetch_gz(name):
    with urllib.request.urlopen(request(name),timeout=180) as response:raw=response.read()
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
def overall(value,age,position,highest=0):
    current=max(0,value);peak=max(current,highest);peak_share=.05 if age<=21 else .09 if age<=24 else .13 if age<=29 else .23 if age<=32 else .30
    bias=1.18 if position=='Goalkeeper' else 1.07 if position=='Defender' else 1.0
    effective=max(80_000,(current*(1-peak_share)+peak*peak_share)*bias)
    score=59+11*math.log10(effective/100000+1)
    if age<=18:score-=3
    elif age<=20:score-=1.5
    elif age>=37:score-=3.2
    elif age>=35:score-=2
    elif age>=33:score-=1
    if position=='Goalkeeper' and 29<=age<=34:score+=.6
    if current>=80_000_000:score+=.8
    if current>=120_000_000:score+=.6
    if peak>=100_000_000 and age>=30:score+=.4
    return max(50,min(94,round(score)))
def potential(ovr,age,value):
    bonus=9 if age<=18 else 7 if age<=20 else 5 if age<=22 else 3 if age<=24 else 1 if age<=27 else 0
    if value>=35_000_000 and age<=22:bonus+=1
    return max(ovr,min(96,ovr+bonus))
def transfer_fee(row):
    fee=num(row.get('transfer_fee'));raw=str(row.get('transfer_fee') or '').lower()
    if any(x in raw for x in ('free','loan','end of loan','?','-')) and not re.search(r'\d',raw):return 0
    return max(0,fee)
def parse_date(value):
    value=iso(value)
    return datetime.strptime(value,'%Y-%m-%d').date() if value else None

def load_recent_lineups(days=240):
    """Stream game_lineups and aggregate recent first-team usage per player+club."""
    cutoff=SNAPSHOT-timedelta(days=days);stats={};rows_seen=0
    try:
        with urllib.request.urlopen(request('game_lineups'),timeout=240) as response:
            with gzip.GzipFile(fileobj=response,mode='rb') as gz:
                text=io.TextIOWrapper(gz,encoding='utf-8-sig',errors='replace',newline='')
                for row in csv.DictReader(text):
                    when=parse_date(row.get('date'))
                    if not when or when>SNAPSHOT or when<cutoff:continue
                    pid=str(row.get('player_id') or '').strip();cid=str(row.get('club_id') or '').strip()
                    if not pid or not cid:continue
                    key=(cid,pid);s=stats.setdefault(key,{'lineups':0,'starts':0,'latest':'','latestPosition':''})
                    s['lineups']+=1;kind=str(row.get('type') or '').strip().lower()
                    if 'start' in kind or kind in {'xi','starting xi','starting lineup'}:s['starts']+=1
                    day=when.isoformat()
                    if day>s['latest']:
                        s['latest']=day;s['latestPosition']=(row.get('position') or '').strip()
                    rows_seen+=1
        print(f'Aggregated {rows_seen} recent lineup rows for {len(stats)} player-club pairs')
    except Exception as exc:print(f'Warning: game_lineups unavailable: {exc}')
    return stats

print('Downloading current Transfermarkt dataset...')
clubs_rows=list(csv.DictReader(io.StringIO(fetch_gz('clubs'))));players_rows=list(csv.DictReader(io.StringIO(fetch_gz('players'))))
try:transfers_rows=list(csv.DictReader(io.StringIO(fetch_gz('transfers'))))
except Exception as exc:print(f'Warning: transfers dataset unavailable: {exc}');transfers_rows=[]
lineup_stats=load_recent_lineups()
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
    dob=iso(row.get('date_of_birth'));age=age_on(dob);position=(row.get('position') or 'Unknown').strip();sub_position=(row.get('sub_position') or '').strip();base_value=num(row.get('market_value_in_eur'));highest=num(row.get('highest_market_value_in_eur'));club_id=str(row.get('current_club_id') or '').strip();club_name=(row.get('current_club_name') or '').strip();competition_id=(row.get('current_club_domestic_competition_id') or '').strip();last=latest_transfer.get(pid)
    if last:
        last_date=parse_date(last['date'])
        if last_date and last_date>=date(SNAPSHOT.year-1,6,1) and last['toClubId'] and last['toClubId']!='0':
            target=club_map.get(last['toClubId'])
            if target:club_id=last['toClubId'];club_name=target['name'] or last['toClub'];competition_id=target['competitionId']
        if last_date and last_date>=date(SNAPSHOT.year,5,1) and last['marketValueAtTransfer']>0:base_value=last['marketValueAtTransfer']
    if not club_name and club_id in club_map:club_name=club_map[club_id]['name']
    if not club_name:continue
    usage=lineup_stats.get((club_id,pid),{});lineups=num(usage.get('lineups'));starts=num(usage.get('starts'));start_rate=(starts/lineups) if lineups else 0
    latest_position=str(usage.get('latestPosition') or '').strip()
    if not sub_position and latest_position:sub_position=latest_position
    starter_priority=min(55,round(start_rate*38+min(12,starts)*1.4)) if lineups>=2 else 0
    real_starter=bool(lineups>=3 and start_rate>=.60)
    contract_until=iso(row.get('contract_expiration_date'))
    contract_date=parse_date(contract_until)
    # Conservative stale-membership fallback: only release extremely old expired records with no recent same-club lineup.
    if club_id and club_id!='FREE' and contract_date and contract_date<=SNAPSHOT-timedelta(days=120) and not usage.get('latest'):
        club_id='FREE';club_name='Livre';competition_id='';real_starter=False;starter_priority=0
    ovr=overall(base_value,age,position,highest)
    players.append({'id':pid,'name':name,'firstName':(row.get('first_name') or '').strip(),'lastName':(row.get('last_name') or '').strip(),'clubId':club_id,'club':club_name,'competitionId':competition_id,'nationality':(row.get('country_of_citizenship') or '').strip(),'birthDate':dob,'age':age,'position':position,'subPosition':sub_position,'foot':(row.get('foot') or '').strip(),'height':num(row.get('height_in_cm')),'value':base_value,'highestValue':highest,'contractUntil':contract_until,'agentName':(row.get('agent_name') or '').strip(),'imageUrl':(row.get('image_url') or '').strip(),'overall':ovr,'potential':potential(ovr,age,base_value),'joinedOn':last['date'] if last and last.get('toClubId')==club_id else '','lastTransferFee':last['fee'] if last else 0,'lastTransferDate':last['date'] if last else '','lastTransferFromId':last['fromClubId'] if last else '','lastTransferFrom':last['fromClub'] if last else '','lastTransferToId':last['toClubId'] if last else '','lastTransferTo':last['toClub'] if last else '','recentLineups':lineups,'recentStarts':starts,'realLifeStartRate':round(start_rate,3),'starterPriority':starter_priority,'realLifeStarter':real_starter,'lastLineupDate':usage.get('latest') or '','dataStatus':'FREE_AGENT' if club_id=='FREE' else 'CURRENT_SQUAD'})
players.sort(key=lambda x:(-x['overall'],-x['value'],x['name']));current_transfers.sort(key=lambda x:(x['date'],x['fee']),reverse=True)
meta={'gameSnapshot':SNAPSHOT.isoformat(),'syncedAt':datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z'),'source':'dcaribou/transfermarkt-datasets (weekly Transfermarkt dataset)','playerCount':len(players),'clubCount':len(clubs),'transferCount':len(current_transfers),'lineupUsagePairs':len(lineup_stats),'lineupUsageWindowDays':240,'ratingModel':'GCP calibrated market-age-position v2','overallNote':'OVR e potencial são índices internos do Golaço Clash. Valores de mercado, contratos, transferências e frequência de titularidade vêm do datapack de futebol; titularidade recente é usada como contexto, enquanto posição natural e OVR continuam decidindo a escalação.'}
(OUT/'players.json').write_text(json.dumps({'meta':meta,'players':players},ensure_ascii=False,separators=(',',':')),encoding='utf-8');(OUT/'clubs-world.json').write_text(json.dumps({'meta':meta,'clubs':clubs},ensure_ascii=False,separators=(',',':')),encoding='utf-8');(OUT/'transfers.json').write_text(json.dumps({'meta':meta,'transfers':current_transfers[:5000]},ensure_ascii=False,separators=(',',':')),encoding='utf-8');(OUT/'database-meta.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Built {len(players)} players, {len(clubs)} clubs and {len(current_transfers)} recent transfers for {SNAPSHOT}')
