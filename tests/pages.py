"""Read-only local smoke checks for public pages and distinct demo identities."""
import hashlib
from html.parser import HTMLParser
from urllib.parse import urlparse,parse_qs,urlencode
from e2e import Actor

class Links(HTMLParser):
    def __init__(self):super().__init__();self.links=[]
    def handle_starttag(self,tag,attrs):
        if tag=='a':
            href=dict(attrs).get('href')
            if href:self.links.append(href)

def run():
    visitor=Actor('public-pages@matchmelo.test')
    status,html,_=visitor.request('/invest')
    assert status==200 and b'Shlok Chauhan' in html and b'No pitch deck.' in html
    links=Links();links.feed(html.decode())
    whatsapp=[urlparse(url) for url in links.links if urlparse(url).hostname=='wa.me']
    assert len(whatsapp)>=2 and all(url.path=='/919137757202' and 'equity' in parse_qs(url.query)['text'][0] for url in whatsapp)
    place='Andheri West, Mumbai'
    status,html,headers=visitor.request('/dates?'+urlencode({'place':place}))
    assert status==200 and headers['Cache-Control']=='private, no-store'
    assert b'MELODATE10' in html and b'MELODRINK' in html and html.count(b'NOT REDEEMABLE')>=2
    links=Links();links.feed(html.decode())
    maps=[urlparse(url) for url in links.links if urlparse(url).hostname=='www.google.com']
    assert len(maps)>=5
    for url in maps:
        params=parse_qs(url.query)
        assert url.scheme=='https' and url.path=='/maps/search/' and params['api']==['1'] and place in params['query'][0]
    me=Actor('demo-you@matchmelo.test').login()
    try:
        status,html,_=me.request('/profile')
        assert status==200 and b'THIS IS YOU' in html
        own=me.ok('/api/member/bootstrap')
        my_photo=me.ok('/api/member/photo?id='+own['profile']['photos'][0]['id'])
        for match in me.ok('/api/member/matches')['matches']:
            assert match['profile']['id']!=me.uid
            other_photo=me.ok('/api/member/photo?id='+match['profile']['photos'][0]['id'])
            assert hashlib.sha256(my_photo).digest()!=hashlib.sha256(other_photo).digest(),'The demo member and a prospect must not share the same cover image.'
        me.ok('/api/member/bootstrap',expected=409,extra={'X-Matchmelo-Member':'stale-account'})
    finally:me.ok('/api/auth/sign-out','POST',{})
    print('PASS: public fundraising page and WhatsApp destination, city-specific Maps links, demo-only coupons, distinct demo avatars, own-profile labels, and stale-account rejection.')

if __name__=='__main__':run()
