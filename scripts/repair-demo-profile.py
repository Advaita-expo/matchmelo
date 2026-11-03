"""Replace only the known duplicated fixture photo; preserve members and messages."""
import hashlib
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'tests'))
from e2e import Actor,ROOT

def repair():
    viewer=Actor('demo-you@matchmelo.test')
    viewer.ok('/api/dev/mailbox?email=demo-you%40matchmelo.test')
    viewer.login()
    admin=None
    try:
        p=viewer.ok('/api/passport')['passport']
        if not p or not p['bio'].startswith('[DEMO]'):
            print('Skipped: this account is no longer the untouched demo fixture.')
            return
        original=hashlib.sha256((ROOT/'public/assets/boy-demo-3.png').read_bytes()).digest()
        removed=False
        for photo in viewer.ok('/api/member/photos')['photos']:
            image=viewer.ok('/api/member/photo?id='+photo['id'])
            if hashlib.sha256(image).digest()==original:
                viewer.ok('/api/member/photos','DELETE',dict(id=photo['id']));removed=True
        if not removed:
            print('Demo member already has a distinct profile image. No changes needed.')
            return
        if not viewer.ok('/api/member/photos')['photos']:
            result=viewer.upload('/api/member/photos',(ROOT/'public/assets/demo-member-avatar.png').read_bytes(),{'consent':'yes'})
            assert result[0]==200
        p=viewer.ok('/api/passport')['passport']
        admin=Actor('admin@matchmelo.test','Local Reviewer').login()
        admin.ok('/api/review','POST',dict(id=p['id'],decision='reviewed',note='LOCAL DEMO ONLY: distinct placeholder avatar; fixture approval, no identity assertion.',updatedAt=p['updated_at'],reviewedEvidence=True))
        print('Repaired the local demo avatar. Existing accounts, matches, and conversations were preserved.')
    finally:
        viewer.ok('/api/auth/sign-out','POST',{})
        if admin:admin.ok('/api/auth/sign-out','POST',{})

if __name__=='__main__':repair()
