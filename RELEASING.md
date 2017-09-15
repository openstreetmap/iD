## Release Checklist

### Prerelease (several days prior)
- Notify translators of impending release
  (https://www.transifex.com/projects/p/id-editor/announcements/)
- Notify TomH

### Prep
- If you don't have a `transifex.auth` file in the root of your iD checkout,
you'll need to create a Transifex account, ask @bhousel for admin rights
on the iD project, and then create this file with contents like<br><pre>
     {"user": "yourusername", "password": "*******"}</pre>

### Update master branch
```bash
$  git checkout master
$  rm -rf node_modules/editor-layer-index/
$  npm install
$  npm run imagery
$  npm run all
$  git add . && git commit -m 'npm run imagery'
$  npm run translations
$  git add . && git commit -m 'npm run translations'
$  Update `CHANGELOG.md`
$  Update version number in `modules/core/context.js`, `package.json`
$  git add . && git commit -m 'A.B.C'
$  git push origin master
```

### Update and tag release branch
```bash
$  git checkout release
$  git reset --hard master
$  npm run all
$  git add -f dist/*.css dist/*.js dist/img/*.svg dist/mapillary-js/
$  git commit -m 'Check in build'
$  git tag vA.B.C
$  git push origin -f release vA.B.C
```

### Update openstreetmap-website

#### Setup remotes (one time only)
```bash
$  git remote add osmlab git@github.com:osmlab/openstreetmap-website.git
$  git remote add upstream git@github.com:openstreetmap/openstreetmap-website.git
```

#### Sync master and update iD (every time)
```bash
$  git fetch --all
$  git checkout master
$  git reset --hard upstream/master
$  git checkout -b iD-A.B.C
$  bundle install
$  rm -rf vendor/assets/iD/* && vendorer
$  git add . && git commit -m 'Update to iD vA.B.C'
$  git push osmlab
$  Open pull request
```
