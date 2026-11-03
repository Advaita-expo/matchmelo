"""Real-cookie integration suite. Deliberately restricted to the local app."""
import concurrent.futures
import http.cookiejar
import json
import time
import secrets
from local_db import local_database
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, build_opener, HTTPCookieProcessor, HTTPRedirectHandler
from uuid import uuid4

BASE='http://127.0.0.1:4183'
PASSWORD='Local-Matchmelo-Only-2026!'
ROOT=Path(__file__).resolve().parent.parent
class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self,*args): return None
class Actor:
    count=0
    network=secrets.randbelow(240)+10
    city='Mumbai'
    def __init__(self,email,name='Test Member'):
        Actor.count+=1
        self.email,self.name=email,name
        self.ip='10.81.'+str(Actor.network)+'.'+str(Actor.count)
        self.cookies=http.cookiejar.CookieJar()
        self.opener=build_opener(HTTPCookieProcessor(self.cookies),NoRedirect())
        self.uid=None
        self.password=PASSWORD
    def request(self,path,method='GET',body=None,extra=None):
        assert BASE.startswith('http://127.0.0.1:'), 'Tests must never target production.'
        headers={'Origin':BASE,'cf-connecting-ip':self.ip,'User-Agent':'MatchmeloLocalIntegration/1.0',**(extra or {})}
        if isinstance(body,dict): body=json.dumps(body).encode(); headers['Content-Type']='application/json'
        try: response=self.opener.open(Request(path if path.startswith(BASE) else BASE+path,data=body,method=method,headers=headers),timeout=60)
        except HTTPError as error: response=error
        raw=response.read()
        try: data=json.loads(raw)
        except (ValueError,UnicodeDecodeError): data=raw
        return response.status,data,response.headers
    def ok(self,path,method='GET',body=None,expected=200,extra=None):
        result=self.request(path,method,body,extra)
        assert result[0]==expected,(path,result[0],str(result[1])[:350])
        return result[1]
    def mailbox(self,subject):
        for _ in range(25):
            messages=self.ok('/api/dev/mailbox?'+urlencode({'email':self.email}))['messages']
            match=next((m for m in messages if subject in m['subject']),None)
            if match:return match['link']
            time.sleep(.15)
        raise AssertionError('Expected local email was not captured.')
    def signup(self,verify=True):
        data=self.ok('/api/auth/sign-up/email','POST',dict(name=self.name,email=self.email,password=self.password,adult=True,policy=True,callbackURL=BASE+'/signin?verified=1'))
        self.uid=data['user']['id']
        assert data['user']['emailVerified'] is False
        if verify:
            result=self.request(self.mailbox('Confirm'))
            assert result[0] in (200,302,303),result[:2]
            self.login()
        return self
    def login(self):
        result=self.ok('/api/auth/sign-in/email','POST',dict(email=self.email,password=self.password))
        self.uid=result['user']['id']
        assert any(c.name.endswith('session_token') and c.has_nonstandard_attr('HttpOnly') for c in self.cookies)
        return self
    def upload(self,path,image,fields=None):
        boundary='melo'+uuid4().hex
        raw=b''
        for key,value in (fields or {}).items():raw+=('--'+boundary+'\r\nContent-Disposition: form-data; name="'+key+'"\r\n\r\n'+str(value)+'\r\n').encode()
        raw+=('--'+boundary+'\r\nContent-Disposition: form-data; name="photo"; filename="fixture.png"\r\nContent-Type: image/png\r\n\r\n').encode()+image+('\r\n--'+boundary+'--\r\n').encode()
        return self.request(path,'POST',raw,{'Content-Type':'multipart/form-data; boundary='+boundary})
    def complete(self,admin,image,shared=True):
        self.ok('/api/passport','POST',dict(name=self.name,age=25,city=self.city,area='Bandra',intent='A relationship',bio='[LOCAL TEST] A fictional adult profile used for integration testing only.',interests=['Coffee','Art','Hiking'] if shared else ['Books','Music'],adult=True,policy=True))
        assert self.upload('/api/member/photos',image,{'consent':'yes'})[0]==200
        challenge=self.ok('/api/passport/challenge','POST',{})['challenge']
        fields={'consent':'yes','challengeId':challenge['id'],'source':'upload'}
        result=self.upload('/api/passport/selfie',image,fields)
        assert result[0]==200,result[:2]
        assert self.upload('/api/passport/selfie',image,fields)[0]==409, 'Selfie challenge must be one-use.'
        passport=result[1]['passport']
        admin.ok('/api/review','POST',dict(id=passport['id'],decision='reviewed',note='Local fictional fixture only.',updatedAt=passport['updated_at'],reviewedEvidence=True))
        self.ok('/api/member/preferences','POST',dict(gender='unspecified',interestedIn=['everyone'],minAge=18,maxAge=40,timezone='Asia/Kolkata',visibility=True,cityOnly=True))
        return passport

def run():
    suffix=uuid4().hex[:6]
    Actor.city='Test City '+suffix
    admin=Actor('admin@matchmelo.test','Local Reviewer')
    created=[]
    try:
        # Reuse the documented local fixture reviewer without deleting seeded data.
        with local_database() as connection:
            existing=connection.execute('SELECT 1 FROM auth_user WHERE email=?',(admin.email,)).fetchone()
        if existing:admin.login()
        else:admin.signup();created.append(admin)
        anonymous=Actor('nobody@matchmelo.test')
        anonymous.ok('/api/passport',expected=401)
        anonymous.ok('/api/passport',expected=401,extra={'oai-authenticated-user-id':'forged','oai-authenticated-user-email':admin.email})
        alpha=Actor('alpha-'+suffix+'@matchmelo.test','Demo Alpha').signup(False);created.append(alpha)
        alpha.ok('/api/auth/sign-in/email','POST',dict(email=alpha.email,password=PASSWORD),expected=403)
        alpha.request(alpha.mailbox('Confirm')); alpha.login()
        bravo=Actor('bravo-'+suffix+'@matchmelo.test','Demo Bravo').signup();created.append(bravo)
        third=Actor('third-'+suffix+'@matchmelo.test','Demo Third').signup();created.append(third)
        first_photo=(ROOT/'public/assets/boy-demo-3.png').read_bytes()
        second_photo=(ROOT/'public/assets/girls-demo/portrait-01.png').read_bytes()
        p_alpha=alpha.complete(admin,first_photo)
        p_bravo=bravo.complete(admin,second_photo)
        third.complete(admin,second_photo,False)
        # Age only fixture timestamps to exercise sliding renewal.
        with local_database() as connection:
            connection.execute('UPDATE auth_session SET updated_at=?,expires_at=? WHERE user_id=?',(int((time.time()-90000)*1000),int((time.time()+6*86400)*1000),alpha.uid))
        renewed=alpha.request('/api/passport')
        assert renewed[0]==200 and 'session_token=' in '\n'.join(renewed[2].get_all('Set-Cookie') or []),'Session renewal must reach the browser.'
        with local_database() as connection:
            assert connection.execute('SELECT expires_at FROM auth_session WHERE user_id=?',(alpha.uid,)).fetchone()[0]>int((time.time()+6.5*86400)*1000)
        alpha.ok('/api/passport','POST',{},expected=403,extra={'Origin':'https://other.test'})
        switched=alpha.ok('/api/member/bootstrap',expected=409,extra={'X-Matchmelo-Member':bravo.uid})
        assert switched['code']=='ACCOUNT_CHANGED'
        alpha.ok('/api/member/messages','POST',dict(matchId='invalid',text='A stale-tab message',clientId=str(uuid4())),expected=409,extra={'X-Matchmelo-Member':bravo.uid})
        assert alpha.ok('/api/passport')['passport']['name']=='Demo Alpha'
        assert bravo.ok('/api/passport?userId='+alpha.uid)['passport']['name']=='Demo Bravo'
        assert alpha.ok('/api/passport/selfie')==first_photo
        assert bravo.ok('/api/passport/selfie?userId='+alpha.uid)==second_photo
        third.ok('/api/review/selfie?id='+p_alpha['id'],expected=403)
        assert admin.ok('/api/review/selfie?id='+p_alpha['id'])==first_photo
        # Add enough reviewed adults to exercise the true ten-profile daily cap.
        for index in range(10):
            actor=Actor('quota-'+str(index)+'-'+suffix+'@matchmelo.test','Demo Pick '+str(index)).signup();created.append(actor);actor.complete(admin,second_photo,False)
        picks=alpha.ok('/api/member/discover');ids=[p['id'] for p in picks['profiles']]
        assert alpha.uid not in ids,'Your own profile must never appear in discovery.'
        for source in ['discover','incoming']:
            own=alpha.ok('/api/member/interest','POST',dict(targetId=alpha.uid,action='like',source=source),expected=400)
            assert own['code']=='SELF_CONNECTION'
        assert len(ids)==10 and len(set(ids))==10 and bravo.uid in ids
        assert [p['id'] for p in alpha.ok('/api/member/discover')['profiles']]==ids
        outsider=next(a for a in created if a not in [admin,alpha] and a.uid not in ids)
        alpha.ok('/api/member/interest','POST',dict(targetId=outsider.uid,action='like',source='discover'),expected=403)
        alpha.ok('/api/member/preferences','POST',dict(gender='unspecified',interestedIn=['everyone'],minAge=18,maxAge=40,timezone='UTC',visibility=True),expected=400)
        bravo.ok('/api/member/discover')
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            results=list(pool.map(lambda args:args[0].ok('/api/member/interest','POST',dict(targetId=args[1].uid,action='like',source='discover')),[(alpha,bravo),(bravo,alpha)]))
        matches=alpha.ok('/api/member/matches')['matches']
        match=next(m for m in matches if m['profile']['id']==bravo.uid)
        assert all(m['profile']['id']!=alpha.uid for m in matches)
        assert len([m for m in matches if m['profile']['id']==bravo.uid])==1
        client_id=str(uuid4());message=dict(matchId=match['id'],text='<script>not executed</script> A real database message.',clientId=client_id)
        alpha.ok('/api/member/messages','POST',message)
        alpha.ok('/api/member/messages','POST',message)
        received=bravo.ok('/api/member/messages?'+urlencode({'matchId':match['id']}))['messages']
        assert len(received)==1 and received[0]['text']==message['text']
        assert received[0]['sender_id']==alpha.uid and received[0]['sender_id']!=bravo.uid
        bravo.ok('/api/member/messages','POST',dict(matchId=match['id'],text='A reply from the other account.',clientId=str(uuid4())))
        conversation=alpha.ok('/api/member/messages?'+urlencode({'matchId':match['id']}))['messages']
        assert len(conversation)==2 and {m['sender_id'] for m in conversation}=={alpha.uid,bravo.uid}
        # Direct fixture writes must obey the same two-member invariant.
        import sqlite3
        with local_database() as connection:
            invalid=[('INSERT INTO member_likes (id,sender_id,recipient_id,created_at) VALUES (?,?,?,?)',(str(uuid4()),alpha.uid,alpha.uid,'2026-11-03T00:00:00.000Z')),('INSERT INTO member_matches (id,user_a,user_b,status,created_at) VALUES (?,?,?,?,?)',(str(uuid4()),alpha.uid,alpha.uid,'active','2026-11-03T00:00:00.000Z')),('INSERT INTO member_messages (id,match_id,sender_id,text,client_id,created_at) VALUES (?,?,?,?,?,?)',(str(uuid4()),match['id'],third.uid,'Invalid outsider',str(uuid4()),'2026-11-03T00:00:00.000Z'))]
            for sql,params in invalid:
                try:connection.execute(sql,params)
                except sqlite3.IntegrityError:pass
                else:raise AssertionError('Database accepted an invalid self-connection or message sender.')
        public_photo=bravo.ok('/api/member/photos')['photos'][0]['id']
        alpha.ok('/api/member/photo?id='+public_photo)
        bravo.ok('/api/passport/selfie','DELETE',{})
        alpha.ok('/api/member/photo?id='+public_photo,expected=404)
        alpha.ok('/api/member/messages?'+urlencode({'matchId':match['id']}),expected=404)
        challenge=bravo.ok('/api/passport/challenge','POST',{})['challenge']
        restored=bravo.upload('/api/passport/selfie',second_photo,{'consent':'yes','challengeId':challenge['id'],'source':'upload'})
        assert restored[0]==200
        passport=restored[1]['passport']
        admin.ok('/api/review','POST',dict(id=passport['id'],decision='reviewed',note='Restored local fixture.',updatedAt=passport['updated_at'],reviewedEvidence=True))
        third.ok('/api/member/messages?'+urlencode({'matchId':match['id']}),expected=404)
        call=alpha.ok('/api/member/calls','POST',dict(action='invite',matchId=match['id']))['call']
        alpha.ok('/api/member/calls','POST',dict(action='signal',callId=call['id'],kind='offer',payload={'type':'offer','sdp':'v=0'}),expected=403)
        third.ok('/api/member/calls?id='+call['id'],expected=404)
        bravo.ok('/api/member/calls','POST',dict(action='accept',callId=call['id']))
        alpha.ok('/api/member/calls','POST',dict(action='signal',callId=call['id'],kind='offer',payload={'type':'offer','sdp':'v=0'}))
        assert len(bravo.ok('/api/member/calls?id='+call['id'])['signals'])==1
        bravo.ok('/api/member/calls','POST',dict(action='end',callId=call['id']))
        assert alpha.ok('/api/member/feedback','POST',dict(callId=call['id'],choice='continue'))['mutualContinue'] is False
        assert bravo.ok('/api/member/feedback','POST',dict(callId=call['id'],choice='continue'))['mutualContinue'] is True
        alpha.ok('/api/member/block','POST',dict(targetId=bravo.uid))
        bravo.ok('/api/member/messages','POST',dict(matchId=match['id'],text='Blocked contact',clientId=str(uuid4())),expected=404)
        assert not alpha.ok('/api/member/matches')['matches']
        # Revocation and reset are checked with two genuine cookie jars.
        second_session=Actor(alpha.email,alpha.name).login()
        alpha.ok('/api/auth/revoke-other-sessions','POST',{})
        second_session.ok('/api/passport',expected=401)
        alpha.ok('/api/auth/request-password-reset','POST',dict(email=alpha.email,redirectTo=BASE+'/reset-password'))
        reset=alpha.mailbox('Reset')
        redirect=alpha.request(reset)
        assert redirect[0] in (302,303),redirect[:2]
        from urllib.parse import urlparse,parse_qs
        token=parse_qs(urlparse(redirect[2]['Location']).query)['token'][0]
        fresh=Actor(alpha.email,alpha.name)
        fresh.ok('/api/auth/reset-password','POST',dict(token=token,newPassword='Changed-Matchmelo-Password-2026!'))
        alpha.ok('/api/passport',expected=401)
        fresh.ok('/api/auth/reset-password','POST',dict(token=token,newPassword='Another-Matchmelo-Password-2026!'),expected=400)
        alpha.password='Changed-Matchmelo-Password-2026!';alpha.login()
        assert alpha.request('/api/passport')[2]['Cache-Control']=='private, no-store'
        exported=alpha.ok('/api/account/export');assert exported['account']['email']==alpha.email and 'selfie_key' not in exported['passport']
        alpha.ok('/api/member/report','POST',dict(targetId=third.uid,reason='Other',details='Local fixture moderation test.'))
        report=next(r for r in admin.ok('/api/moderation/reports')['reports'] if r['target_id']==third.uid)
        admin.ok('/api/moderation/reports','POST',dict(id=report['id'],action='suspend',note='Local fixture suspension test.'))
        third.ok('/api/passport',expected=401)
        # Restore only our fixture so authenticated deletion can clean it.
        with local_database() as connection:connection.execute('UPDATE auth_user SET disabled=0 WHERE id=?',(third.uid,))
        third.login()
        limited=Actor('absent-'+suffix+'@matchmelo.test')
        statuses=[limited.request('/api/auth/sign-in/email','POST',dict(email=limited.email,password=PASSWORD))[0] for _ in range(7)]
        assert statuses[-1]==429, 'Repeated login attempts must be throttled.'
        print('PASS: signup/email confirmation, password reset replay protection, sliding cookie sessions and revocation, private selfie challenges, review invalidation, isolation, ten-profile quota, atomic matching, idempotent chat, call signaling, blocking, moderation suspension, login throttling, export, and no-store caching.')
    finally:
        for actor in reversed(created):
            try:actor.ok('/api/auth/delete-user','POST',dict(password=actor.password))
            except Exception as error:print('Local fixture cleanup needs attention for',actor.email,type(error).__name__)
        with local_database() as connection:
            assert connection.execute('SELECT count(*) FROM media_deletions').fetchone()[0]==0,'Successful file cleanup must drain the durable deletion queue.'

if __name__=='__main__':run()
