"""Seed disposable fictional members through real local APIs; never runs remotely."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'tests'))
from e2e import Actor,ROOT,BASE,PASSWORD

def account(email,name):
    actor=Actor(email,name)
    status,data,_=actor.request('/api/auth/sign-up/email','POST',dict(name=name,email=email,password=PASSWORD,adult=True,policy=True,callbackURL=BASE+'/signin?verified=1'))
    if status==200:
        actor.request(actor.mailbox('Confirm'))
    elif status not in (400,422):
        raise RuntimeError('Local fixture signup failed: '+str(status))
    actor.login()
    return actor

def seed():
    probe=Actor('local-check@matchmelo.test')
    probe.ok('/api/dev/mailbox?email=local-check%40matchmelo.test')
    admin=account('admin@matchmelo.test','Local Reviewer')
    fixtures=[('demo-girl%02d@matchmelo.test'%i,'Demo %02d'%i,ROOT/('public/assets/girls-demo/portrait-%02d.png'%i),'woman') for i in range(1,9)]
    fixtures += [('demo-boy%02d@matchmelo.test'%i,'Demo %02d'%(8+i),ROOT/('public/assets/boy-demo-%d.png'%i),'man') for i in range(1,4)]
    fixtures += [('demo-you@matchmelo.test','Demo You',ROOT/'public/assets/demo-member-avatar.png','unspecified')]
    actors=[]
    for email,name,image,gender in fixtures:
        actor=account(email,name)
        if not actor.ok('/api/passport')['passport']:
            actor.complete(admin,image.read_bytes())
            p=actor.ok('/api/passport')['passport']
            actor.ok('/api/passport','POST',dict(name=name,age=25,city='Mumbai',area='Bandra',intent='A relationship',bio='[DEMO] Fictional local profile. The supplied photo illustrates the interface; name, age, interests, and review are development fixtures.',interests=['Coffee','Art','Hiking'],adult=True,policy=True))
            p=actor.ok('/api/passport')['passport']
            admin.ok('/api/review','POST',dict(id=p['id'],decision='reviewed',note='DEMO ONLY: fixture approval, no identity or age assertion.',updatedAt=p['updated_at'],reviewedEvidence=True))
            actor.ok('/api/member/preferences','POST',dict(gender=gender,interestedIn=['everyone'],minAge=18,maxAge=40,timezone='Asia/Kolkata',visibility=True,cityOnly=True))
        actors.append(actor)
    viewer=actors[-1]
    picks=viewer.ok('/api/member/discover')['profiles']
    if picks:
        target=next(a for a in actors if a.uid==picks[-1]['id'])
        target.ok('/api/member/discover')
        # Only seed a conversation if the viewer is in this member's actual batch.
        target_ids=[p['id'] for p in target.ok('/api/member/discover')['profiles']]
        if viewer.uid in target_ids:
            target.ok('/api/member/interest','POST',dict(targetId=viewer.uid,action='like',source='discover'))
            result=viewer.ok('/api/member/interest','POST',dict(targetId=target.uid,action='like',source='discover'))
            if result['matched']:
                from uuid import uuid4
                target.ok('/api/member/messages','POST',dict(matchId=result['matchId'],text='[DEMO] A little hello! This saved conversation demonstrates local messaging.',clientId=str(uuid4())))
    print('Local demo is ready at '+BASE+'/signin')
    print('Member: demo-you@matchmelo.test | Reviewer: admin@matchmelo.test')
    print('Disposable LOCAL-ONLY password for both: '+PASSWORD)
    print('All names, ages, review decisions, and conversations are fictional fixtures. Do not seed a production database.')

if __name__=='__main__':seed()
