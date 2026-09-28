# Contributing

Contributions are welcome, especially corrections to resource availability, eligibility, links, and new student/research scenarios.

## Resource updates

Please cite an official UCLA or UCLA-affiliated source when adding or changing a resource. Include a verification date and avoid claiming access that the source does not establish.

## Code changes

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e . pytest
BRUIN_BACKEND=rules pytest -q
```

The rules backend is used in CI so tests remain deterministic and do not depend on classifier.dev.

## Safety / privacy

Do not submit credentials, patient-level information, unpublished research data, internal billing information, or collaborator-only material. Biomedical scenarios should use synthetic or clearly public data.

## Privacy-conscious Git metadata

Contributors who do not want a personal email embedded in public commit metadata should configure a GitHub `users.noreply.github.com` address before committing. Never commit local absolute paths, credentials, private configuration, or personal/research data.
