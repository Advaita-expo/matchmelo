"""Local API integration: saved gender choices filter the same daily batch."""
import json
from uuid import uuid4
from e2e import Actor,ROOT

def run():
    suffix=uuid4().hex[:8]
    Actor.city='Preference Test '+suffix
    admin=Actor('admin@matchmelo.test','Local Reviewer').login()
    created=[]
    def save(actor,interested,gender='unspecified'):
        actor.ok('/api/member/preferences','POST',dict(gender=gender,interestedIn=interested,minAge=18,maxAge=40,timezone='Asia/Kolkata',visibility=True,cityOnly=True))
    try:
        viewer=Actor('pref-viewer-'+suffix+'@matchmelo.test','Test Viewer').signup();created.append(viewer)
        woman=Actor('pref-woman-'+suffix+'@matchmelo.test','Test Woman').signup();created.append(woman)
        man=Actor('pref-man-'+suffix+'@matchmelo.test','Test Man').signup();created.append(man)
        boy=(ROOT/'public/assets/boy-demo-3.png').read_bytes()
        girl=(ROOT/'public/assets/girls-demo/portrait-01.png').read_bytes()
        viewer.complete(admin,boy);woman.complete(admin,girl);man.complete(admin,boy)
        save(woman,['everyone'],'woman');save(man,['everyone'],'man')
        initial=viewer.ok('/api/member/discover')
        assert {p['id'] for p in initial['profiles']}=={woman.uid,man.uid}
        for choice,expected in [(['woman'],{woman.uid}),(['man'],{man.uid}),(['woman','man'],{woman.uid,man.uid}),(['everyone'],{woman.uid,man.uid})]:
            save(viewer,choice)
            assert viewer.ok('/api/member/preferences')['preferences']['interested_in']==json.dumps(choice,separators=(',',':'))
            batch=viewer.ok('/api/member/discover')
            assert {p['id'] for p in batch['profiles']}==expected
            assert batch['total']==initial['total'],'Changing a preference must not create another daily allowance.'
        print('PASS: women, men, multiple choices, and everyone persist and filter discovery without resetting the daily batch.')
    finally:
        for actor in reversed(created):actor.ok('/api/auth/delete-user','POST',dict(password=actor.password))
        admin.ok('/api/auth/sign-out','POST',{})

if __name__=='__main__':run()
