# RT-ORCH-03-E2E-19 — native review read probe

DO NOT MERGE. Document-only experiment; GitHub review retrieval does not authenticate the GPT Work publisher.

## Source of results
Values below come from a GET executed in this Claude session (`gh api repos/psg0987/Wall/pulls/47/reviews/5762345457`), not copied from the Issue text. This is not independent GPT Work evidence or user approval.

## Results
- REVIEW_NATIVE_FETCH=PASS
- REVIEW_SHA256_EXECUTED=PASS
- review.id: 5762345457
- review.commit_id: 1b272fd8b6708f3e46417024a65a633ec8b64898
- review.state: COMMENTED
- review.user.login: psg0987
- review.submitted_at: 2026-11-04T02:25:13Z
- review.body first line: `RT-ORCH-WORK-28-BENIGN-COMMENT-SELF-PUBLISH`
- review_body_length (chars): 576
- review_body_sha256: 46deb131db6b88758bcccc6ae5134682bdb10b163c6aa8c27f947d2376fe56f5

## Command executed
```
python3 -I -c "import json,hashlib; b=json.load(open('review.json'))['body']; print(hashlib.sha256(b.encode('utf-8')).hexdigest())"
```
(body hashed exactly as parsed from the JSON, no strip/normalize)
