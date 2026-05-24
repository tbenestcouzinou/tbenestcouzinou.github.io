# tbenestcouzinou.github.io
Personal site for publications and portfolio items.

## ADS sync

The `Recent Work` section is refreshed from ADS by the GitHub Action in [.github/workflows/update-ads-works.yml](.github/workflows/update-ads-works.yml).

Required secret:

- `ADS_API_TOKEN`: ADS API bearer token used by [`scripts/update-ads-works.mjs`](scripts/update-ads-works.mjs) to fetch the latest refereed articles.

The workflow runs monthly and rewrites the marked section in [index.html](index.html) plus the cache file in [data/ads-works.json](data/ads-works.json).
