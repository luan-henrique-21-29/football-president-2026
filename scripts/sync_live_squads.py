import json
import math
import time
from datetime import date, datetime, timezone
from pathlib import Path

import requests

API='https://transfermarkt-api.fly.dev/clubs/{club_id}/players'
TARGET={'GB1','GB2','ES1','ES2','IT1','IT2','FR1','FR2','BRA1','BRA2','MLS1','SA1'}
HEADERS={'User-Agent':'ClubDynasty26/2.0 (+github-actions)','Accept':'application/json'}
TODAY=date.today()


def val(v,default=0):
    try:return int(v or default)
    except:return default


def iso(v):
    text=str(v or '')[:10]
    try:return datetime.strptime(text,'%Y-%m-%d').date().isoformat()
    except:return ''


def age(dob):
    try:
        d=datetime.strptime(str(dob)[:10],'%Y-%m-%d').date()
        return TODAY.year-d.year-((TODAY.month,TODAY.day)<(d.month,d.day))
    except:return 25


def overall(value,years,pos):
    value=max(0,val(value));score=55+10.5*math.log10(value/100000+1) if value else 54
    if 21<=years<=29:score+=1
    elif years<=18:score-=2
    elif years>=36:score-=4
    elif years>=33:score-=2
    if str(pos).lower()=='goalkeeper' and years>=30:score+=1
    return max(50,min(93,round(score)))


def potential(ovr,years,value):
    bonus=8 if years<=18 else 6 if years<=20 else 4 if years<=22 else 2 if years<=24 else -1 if years>=31 else 0
    if val(value)>=50_000_000 and years<=23:bonus+=1
    return max(ovr,min(95,ovr+bonus))


def request_club(session,club_id):
    for attempt in range(4):
        try:
            r=session.get(API.format(club_id=club_id),headers=HEADERS,timeout=30)
            if r.status_code==429:
                time.sleep(3+attempt*3);continue
            if r.status_code!=200:return None
            data=r.json();players=data.get('players') if isinstance(data,dict) else None
            return players if isinstance(players,list) else None
        except Exception:
            time.sleep(1.5+attempt)
    return None


def main():
    p_path=Path('data/players.json');c_path=Path('data/clubs-world.json');m_path=Path('data/database-meta.json')
    payload=json.loads(p_path.read_text(encoding='utf-8'))
    clubs_payload=json.loads(c_path.read_text(encoding='utf-8'))
    players=payload.get('players',[]);clubs=clubs_payload.get('clubs',[])
    by_id={str(p.get('id')):p for p in players}
    session=requests.Session();success=0;failed=0;updated=0;added=0
    targets=[c for c in clubs if c.get('competitionId') in TARGET]
    print(f'Live squad merge: {len(targets)} clubs')
    for idx,club in enumerate(targets,1):
        cid=str(club.get('id') or '')
        rows=request_club(session,cid)
        if rows is None:
            failed+=1;print(f'[{idx}/{len(targets)}] {club.get("name")}: unavailable');continue
        success+=1
        seen=0
        for row in rows:
            pid=str(row.get('id') or '')
            name=str(row.get('name') or '').strip()
            if not pid or not name:continue
            seen+=1
            current=by_id.get(pid)
            dob=iso(row.get('date_of_birth'))
            years=val(row.get('age'),age(dob))
            market=val(row.get('market_value'))
            contract=iso(row.get('contract'))
            joined=iso(row.get('joined_on'))
            position=str(row.get('position') or (current or {}).get('position') or 'Unknown')
            if current:
                current['clubId']=cid;current['club']=club.get('name','');current['competitionId']=club.get('competitionId','')
                if dob:current['birthDate']=dob;current['age']=years
                if market>0:current['value']=market
                if contract:current['contractUntil']=contract
                if joined:current['joinedOn']=joined
                if row.get('foot'):current['foot']=row.get('foot')
                if val(row.get('height'))>0:current['height']=val(row.get('height'))
                if row.get('signed_from'):current['signedFrom']=row.get('signed_from')
                if row.get('status'):current['status']=row.get('status')
                current['position']=position
                current['overall']=overall(current.get('value'),years,position)
                current['potential']=potential(current['overall'],years,current.get('value'))
                current['liveSquadCheckedAt']=TODAY.isoformat();updated+=1
            else:
                ovr=overall(market,years,position)
                current={'id':pid,'name':name,'firstName':'','lastName':'','clubId':cid,'club':club.get('name',''),'competitionId':club.get('competitionId',''),'nationality':', '.join(row.get('nationality') or []) if isinstance(row.get('nationality'),list) else str(row.get('nationality') or ''),'birthDate':dob,'age':years,'position':position,'subPosition':'','foot':row.get('foot') or '','height':val(row.get('height')),'value':market,'highestValue':market,'contractUntil':contract,'agentName':'','imageUrl':'','overall':ovr,'potential':potential(ovr,years,market),'joinedOn':joined,'signedFrom':row.get('signed_from') or '','lastTransferFee':0,'lastTransferDate':'','lastTransferFromId':'','lastTransferFrom':'','lastTransferToId':cid,'lastTransferTo':club.get('name',''),'liveSquadCheckedAt':TODAY.isoformat()}
                players.append(current);by_id[pid]=current;added+=1
        print(f'[{idx}/{len(targets)}] {club.get("name")}: {seen} live players merged')
        time.sleep(.55)
    meta=payload.get('meta',{});meta.update({'gameSnapshot':TODAY.isoformat(),'liveSquadsSyncedAt':datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z'),'liveSquadClubsSuccess':success,'liveSquadClubsFailed':failed,'playerCount':len(players)})
    payload['meta']=meta;players.sort(key=lambda p:(-val(p.get('overall')),-val(p.get('value')),p.get('name','')))
    p_path.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    if m_path.exists():
        db=json.loads(m_path.read_text(encoding='utf-8'));db.update({k:meta[k] for k in ('gameSnapshot','liveSquadsSyncedAt','liveSquadClubsSuccess','liveSquadClubsFailed','playerCount')});m_path.write_text(json.dumps(db,ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'Live merge complete: {success} clubs ok, {failed} failed, {updated} updated, {added} new. Missing API rows never delete existing players.')

if __name__=='__main__':main()
