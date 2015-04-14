## Release Checklist

### Prerelease (several days prior)

- [ ] Notify translators of impending release
  (https://www.transifex.com/projects/p/id-editor/announcements/)
- [ ] Notify TomH

### Make release

TODO: turn this into a script.

- [ ] make translations
- [ ] make imagery
- [ ] Update CHANGELOG.md
- [ ] Update version number in id.js
- [ ] Update version number in package.json
- [ ] git checkout release && git reset --hard master
- [ ] make
- [ ] git add -f dist/*.css dist/*.js && git commit -m 'Check in build'
- [ ] git tag vA.B.C
- [ ] git push origin -f release vA.B.C

### Update openstreetmap-website

- [ ] git checkout -b iD-A.B.C
- [ ] rm -rf vendor/assets/iD/* && vendorer
- [ ] git commit -a -m 'Update to iD vA.B.C'
- [ ] git push osmlab
- [ ] Open pull request
