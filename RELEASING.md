## Release Checklist

### Prerelease (several days prior)
- [Notify translators](https://app.transifex.com/openstreetmap/communication/?q=project%3Aid-editor) of the impending release
- Notify TomH

### Prep
- If you don't have a `transifex.auth` file in the root of your iD checkout,
you'll need to create a Transifex account, ask the project's maintainers for admin rights
on the iD project, and then create this file with contents like

  ````json
  { "user":"api", "password": "<your-transifex-api-key>" }
  ````

  where you insert your personal [transifex api token](https://app.transifex.com/user/settings/api/). This file is not version-controlled and will not be checked in.

### Update `iD`

#### Update `develop` branch

```bash
git checkout develop
npm clean-install
npm install editor-layer-index
npm run imagery
npm run all
git add . && git commit -m 'npm run imagery'
npm run translations
git add . && git commit -m 'npm run translations'
```

- Check and finalize `CHANGELOG.md`

```bash
ID_VERSION=A.B.C
npm version --no-git-tag-version $ID_VERSION
git add . && git commit -m "v$ID_VERSION"
git push origin develop
```

#### Update and tag `release` branch

```bash
git checkout release
git reset --hard develop
npm run all
git add -f dist
git commit -m 'Check in build'
git tag "v$ID_VERSION"
git push origin -f release "v$ID_VERSION"
```
- Open https://github.com/openstreetmap/iD/tags
- Click `•••` –> `Create Release`, paste version(vA.B.C) to `Release title` and copy/paste the relevant [`changelog`](https://github.com/openstreetmap/iD/blob/release/CHANGELOG.md) entries into the description of the release.

#### Push release to npm

```bash
npm publish
```

#### Prepare `develop` branch for further development

```bash
git checkout develop
```

Add section in `CHANGELOG.md` for new version number (e.g. `# Unreleased (AA.BB.0-dev)`).

```bash
npm version --no-git-tag-version vAA.BB.0-dev
git add . && git commit -m 'Set development version number'
git push origin develop
```

### Update `openstreetmap-website`

- Create a PR branch that updates the version number of iD (`@openstreetmap/id`) in the [`package.json`](https://github.com/openstreetmap/openstreetmap-website/blob/master/package.json) file of the OpenStreetMap Website repository.
```bash
bundle install
bundle exec bin/yarn add "@openstreetmap/id@$ID_VERSION"
```
- If there have been any changes to iD's [URL parameters](https://github.com/openstreetmap/iD/blob/develop/API.md#url-parameters), make sure they're reflected in [app/assets/javascripts/edit/id.js.erb](https://github.com/openstreetmap/openstreetmap-website/blob/master/app/assets/javascripts/edit/id.js.erb).
- Test the new version locally:
```bash
bundle exec rails assets:precompile
bundle exec rails server
```
- Open the pull request on github and link to the release on github in the issue text for the changelog.

