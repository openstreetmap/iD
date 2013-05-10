## Release Checklist

TODO: turn this into a script.

- [ ] make translations
- [ ] Update CHANGELOG.md
- [ ] Update version number in id.js
- [ ] Update version number in package.json
- [ ] git checkout release && git reset --hard master
- [ ] make
- [ ] Check in dist/iD.css, dist/iD.js, and dist/iD.min.js
- [ ] git tag vA.B.C
- [ ] git push origin -f release vA.B.C

### Update openstreetmap-website

- [ ] git checkout -b iD-A.B.C
- [ ] rm -rf vendor/assets/iD/* && vendorer
- [ ] git commit -a -m 'Update to iD vA.B.C'
- [ ] git push osmlab
- [ ] Open pull request
