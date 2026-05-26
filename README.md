# NTags

Minimal Zotero plugin that adds:

- a sortable `Tag Number` column to the item tree
- a `Tag Number` condition in Advanced Search

Requires Zotero 7 or newer. The current release is marked compatible through
Zotero 9.0.x.

The item-tree column is hidden by default and can be enabled from the column
picker. The advanced-search condition supports `is`, `is not`, `is less than`,
and `is greater than`.

## Development

```sh
npm install
npm run build
```

## Release

The repository includes the template release workflow. Pushing a version tag
matching `v**` starts `.github/workflows/release.yml`, which builds the plugin
and runs `npm run release` to attach the generated XPI and update metadata to a
GitHub release.
