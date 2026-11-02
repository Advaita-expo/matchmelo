"""Local built-Worker integration tests. Never target a hosted Site."""
import json
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from uuid import uuid4

BASE = 'http://127.0.0.1:4184'
A = {'oai-authenticated-user-id': 'matchmelo_test_a', 'oai-authenticated-user-email': 'member-a@sites.test'}
B = {'oai-authenticated-user-id': 'matchmelo_test_b', 'oai-authenticated-user-email': 'member-b@sites.test'}
REVIEWER = {'oai-authenticated-user-id': 'local_seedy', 'oai-authenticated-user-email': 'seedy@sites.test'}
INTRO = dict(name='Test Member', age=25, city='Mumbai', area='Bandra', intent='A relationship', bio='A fictional profile used only for local integration testing.', interests=['Coffee', 'Art'], adult=True, policy=True)

def request(path, identity=None, method='GET', body=None, extra=None):
    headers = {'Origin': BASE, **(identity or {}), **(extra or {})}
    if isinstance(body, dict):
        body = json.dumps(body).encode()
        headers['Content-Type'] = 'application/json'
    req = Request(BASE + path, data=body, headers=headers, method=method)
    try:
        response = urlopen(req, timeout=20)
    except HTTPError as error:
        response = error
    return response.status, response.headers, response.read()

def expect(result, status):
    assert result[0] == status, (result[0], status, result[2][:500])
    return result

def payload(result):
    return json.loads(result[2])

def multipart(image, mimetype='image/jpeg'):
    boundary = 'matchmelo' + uuid4().hex
    data = ('--'+boundary+'\r\nContent-Disposition: form-data; name="consent"\r\n\r\nyes\r\n--'+boundary+'\r\nContent-Disposition: form-data; name="photo"; filename="sample.jpg"\r\nContent-Type: '+mimetype+'\r\n\r\n').encode() + image + ('\r\n--'+boundary+'--\r\n').encode()
    return data, {'Content-Type': 'multipart/form-data; boundary='+boundary}

try:
    assert b'A little hello' in expect(request('/'), 200)[2]
    assert b'Continue with ChatGPT' in expect(request('/signin'), 200)[2]
    for path in ['/api/passport', '/api/passport/selfie']:
        expect(request(path), 401)
    expect(request('/api/passport', A, 'POST', INTRO, {'Origin': 'https://other.test'}), 403)
    expect(request('/api/passport', A, 'POST', {**INTRO, 'age': 17}), 400)
    created = payload(expect(request('/api/passport', A, 'POST', {**INTRO, 'user_id': 'matchmelo_test_b', 'review_status': 'reviewed'}), 200))['passport']
    assert created['review_status'] == 'not_submitted' and 'user_id' not in created
    assert payload(request('/api/passport?id='+created['id'], B))['passport'] is None
    image = (Path(__file__).parent.parent/'public/assets/profile-1.jpg').read_bytes()
    body, headers = multipart(image)
    submitted = payload(expect(request('/api/passport/selfie', A, 'POST', body, headers), 200))['passport']
    assert submitted['review_status'] == 'pending' and submitted['has_selfie']
    assert expect(request('/api/passport/selfie', A), 200)[1]['Cache-Control'] == 'private, no-store'
    expect(request('/api/passport/selfie?id='+created['id'], B), 404)
    expect(request('/api/review/selfie?id='+created['id'], A), 403)
    expect(request('/api/review/selfie?id='+created['id'], REVIEWER), 200)
    review = dict(id=created['id'], decision='reviewed', note='Local test review only.', updatedAt=submitted['updated_at'])
    expect(request('/api/review', B, 'POST', review), 403)
    expect(request('/api/review', REVIEWER, 'POST', review), 200)
    expect(request('/api/review', REVIEWER, 'POST', review), 409)
    assert payload(request('/api/passport', A))['passport']['review_status'] == 'reviewed'
    edited = payload(expect(request('/api/passport', A, 'POST', {**INTRO, 'bio': 'A changed fictional profile. The previous review must be invalidated.'}), 200))['passport']
    assert edited['review_status'] == 'pending'
    expect(request('/api/passport/selfie', A, 'DELETE'), 200)
    expect(request('/api/passport/selfie', A), 404)
    bad, headers = multipart(b'<svg>'+b'.'*150+b'</svg>')
    expect(request('/api/passport/selfie', A, 'POST', bad, headers), 400)
    assert b'Test Member' in expect(request('/profile', A), 200)[2]
    assert b'member-context' in expect(request('/discover', A), 200)[2]
    print('Integration passed: public pages, authorization, age/consent validation, account isolation, private selfies, authorized reviews, stale-review rejection, profile updates, deletion, and invalid-image rejection.')
finally:
    request('/api/passport', A, 'DELETE')
    request('/api/passport', B, 'DELETE')
