## Release Checklist

### Prerelease (several days prior)
- [Notify translators](https://www.transifex.com/projects/p/id-editor/announcements/) of the impending release
- Notify TomH

### Prep
- If you don't have a `transifex.auth` file in the root of your iD checkout,
you'll need to create a Transifex account, ask @tyr_asd or @bhousel for admin rights
on the iD project, and then create this file with contents like

  ````json
  { "user":"api", "password": "<your-transifex-api-key>" }
  ````

  where you insert your personal [transifex api token](https://www.transifex.com/user/settings/api/). This file is not version-controlled and will not be checked in.

### Update `iD`

#### Update `develop` branch

```bash
$  git checkout develop
$  npm clean-install
$  npm install editor-layer-index
$  npm run imagery
$  npm run all
$  git add . && git commit -m 'npm run imagery'
$  npm run translations
$  git add . && git commit -m 'npm run translations'
```

- Check and finalize `CHANGELOG.md`

```bash
$  npm version --no-git-tag-version vA.B.C
$  git add . && git commit -m 'vA.B.C'
$  git push origin develop
```

#### Update and tag `release` branch
```bash
$  git checkout release
$  git reset --hard develop
$  npm run all
$  git add -f dist
$  git commit -m 'Check in build'
$  git tag vA.B.C
$  git push origin -f release vA.B.C
```
- Open https://github.com/openstreetmap/iD/tags
- Click `•••` –> `Create Release`, paste version(vA.B.C) to `Release title` and link to [`CHANGELOG.md`](https://github.com/openstreetmap/iD/blob/release/CHANGELOG.md) in `Describe this release`

#### Prepare `develop` branch for further development

```bash
$  git checkout develop
```

Add section in `CHANGELOG.md` for new version number (e.g. `# Unreleased (2.28.0-dev)`).

```bash
$  npm version --no-git-tag-version vAA.BB.0-dev
$  git add . && git commit -m 'Set development version number'
$  git push origin develop
```

### Update `openstreetmap-website`

#### Setup remotes (first time only)
```bash
$  git remote add osmlab git@github.com:osmlab/openstreetmap-website.git
$  git remote add openstreetmap git@github.com:openstreetmap/openstreetmap-website.git
```

#### Sync `master` branches

```bash
$  git fetch --all
$  git checkout master
$  git reset --hard openstreetmap/master
$  git push osmlab master
```

#### Create and push branch with the new iD version

```bash
$  git checkout -b iD-A.B.C
$  bundle install
$  rm -rf vendor/assets/iD/* && vendorer
```

- If there have been any changes to iD's [URL parameters](https://github.com/openstreetmap/iD/blob/develop/API.md#url-parameters), make sure they're reflected in [app/assets/javascripts/edit/id.js.erb](https://github.com/osmlab/openstreetmap-website/blob/master/app/assets/javascripts/edit/id.js.erb).

```bash
$  git add . && git commit -m 'Update to iD vA.B.C'
$  git push osmlab iD-A.B.C
```

- [Open a pull request](https://github.com/openstreetmap/openstreetmap-website/compare/master...osmlab:) using the [markdown text from the changelog](https://raw.githubusercontent.com/openstreetmap/iD/release/CHANGELOG.md) as the comment
