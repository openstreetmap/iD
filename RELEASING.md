## Release Checklist

### Prerelease (several days prior)
- [ ] Notify translators of impending release
  (https://www.transifex.com/projects/p/id-editor/announcements/)
- [ ] Notify TomH

### Prep
- [ ] If you don't have a `transifex.auth` file in the root of your iD checkout,
      you'll need to create a Transifex account, ask @bhousel for admin rights
      on the iD project, and then create this file with contents
      like `{"user": "yourusername", "password": "*******"}`

### Update master branch
- [ ] git checkout master
- [ ] make translations
- [ ] git add . && git commit -m 'make translations'
- [ ] make imagery
- [ ] git add . && git commit -m 'make imagery'
- [ ] make suggestions
- [ ] git add . && git commit -m 'make suggestions'
- [ ] Update `CHANGELOG.md`
- [ ] Update version number in `id.js`, `package.json`
- [ ] git add . && git commit -m 'A.B.C'
- [ ] git push origin master

### Update and tag release branch
- [ ] git checkout release
- [ ] git reset --hard master
- [ ] make
- [ ] git add -f dist/*.css dist/*.js dist/img/*.svg dist/locales/*.json
- [ ] git commit -m 'Check in build'
- [ ] git tag vA.B.C
- [ ] git push origin -f release vA.B.C

### Update openstreetmap-website

#### Setup remotes (one time only)

- [ ] git remote add osmlab git@github.com:osmlab/openstreetmap-website.git
- [ ] git remote add upstream git@github.com:openstreetmap/openstreetmap-website.git

#### Sync master and update iD (every time)

- [ ] git fetch --all
- [ ] git checkout master
- [ ] git reset --hard upstream/master
- [ ] git checkout -b iD-A.B.C
- [ ] bundle install
- [ ] rm -rf vendor/assets/iD/* && vendorer
- [ ] git add . && git commit -m 'Update to iD vA.B.C'
- [ ] git push osmlab
- [ ] Open pull request
