# Contributing to iD

Thinking of contributing to iD? High five! There are plenty of ways to get involved.
You don't need to know the first thing about programming (though it's always a
great time to learn!)

Everyone involved in the iD project is subject to the [Code of Conduct](CODE_OF_CONDUCT.md).
Please take a moment to read it before proceeding, it's short and simple. We want
everyone to feel comfortable contributing to iD.


## Submitting Issues

We'd love to hear your feedback about iD. Please [search existing issues](https://github.com/search?l=&q=repo%3Aopenstreetmap%2FiD&type=Issues)
before [opening a new one](https://github.com/openstreetmap/iD/issues/new). Many bugs and ideas have already been posted.

When reporting a bug:

* Write specifically what browser (type and version, like "Firefox 49.0"), OS,
and browser extensions you have installed
* Write steps to replicate the error: when did it happen? What did you expect to happen?
What happened instead?
* We love screenshots.  If you can take a picture of the issue, that is extra helpful.
You can drag the image file onto the GitHub issue and it will be included with your bug report.
* You can use a program like [LICEcap](http://www.cockos.com/licecap/) to record an animated gif.
* Please keep bug reports professional and straightforward: trust us, we share your dismay at software breaking.
* If you can, [enable web developer extensions](http://debugbrowser.com/) and report the
JavaScript error message.
* When in doubt, over-describe the bug and how you discovered it.

When requesting a feature:

* Provide a link if the feature is available in some other software.
  We care about prior art.
* Understand that iD is focused on simplicity and doesn't aim to be
  as complete as JOSM or other editors.


### Issue Labels

We use GitHub labels to keep track of issues.  Some guidelines:

Green labels are for **action items**. Jump in and start working!
* <sub>[![good-first-issue][good-first-issue]][good-first-issue_link]</sub> -
Best for new contributors.  No experience necessary!
* <sub>[![help-wanted][help-wanted]][help-wanted_link]</sub> -
For more intermediate contributors, probably requires investigation or knowledge of iD code.
* <sub>[![priority][priority]][priority_link]</sub> -
Issues that have a big impact or matter most to _new mappers_.
<br/>(There should probably be 10 or fewer "priority" items.)

[good-first-issue]: http://labl.es/svg?text=good%20first%20issue&bgcolor=0e8a16
[help-wanted]: http://labl.es/svg?text=help%20wanted&bgcolor=0e8a16
[priority]: http://labl.es/svg?text=priority&bgcolor=0e8a16

[good-first-issue_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3A%22good%20first%20issue%22
[help-wanted_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3A%22help%20wanted%22
[priority_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3Apriority

Red labels are for **bugs**. These are things that we want fixed, but might be a bit more
complicated than the green action items.

* <sub>[![bug][bug]][bug_link]
[![bug-release-blocker][bug-release-blocker]][bug-release-blocker_link]
[![bug-browser-specific][bug-browser-specific]][bug-browser-specific_link]</sub>

[bug]: http://labl.es/svg?text=bug&bgcolor=d93f0b
[bug-release-blocker]: http://labl.es/svg?text=bug-release-blocker&bgcolor=d93f0b
[bug-browser-specific]: http://labl.es/svg?text=bug-browser-specific&bgcolor=d93f0b

[bug_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3Abug
[bug-release-blocker_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3Abug-release-blocker
[bug-browser-specific_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3Abug-browser-specific

Purple labels are for **non-action items**. These might be a question or feature request
that needs some discussion about whether it belongs in iD.  Discuss before working on these.

* <sub>[![considering][considering]][considering_link]
[![question][question]][question_link]</sub>

[considering]: http://labl.es/svg?text=considering&bgcolor=cc33cc
[question]: http://labl.es/svg?text=question&bgcolor=cc33cc

[considering_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3Aconsidering
[question_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3Aquestion

Yellow labels are for **chores**. These are the things like code cleanup, upgrades, tests,
documentation, repository gardening, and other stuff that makes developers happy.

* <sub>[![chore][chore]][chore_link]
[![chore-dependency][chore-dependency]][chore-dependency_link]
[![chore-documentation][chore-documentation]][chore-documentation_link]
[![chore-greenkeeper][chore-greenkeeper]][chore-greenkeeper_link]</sub>

[chore]: http://labl.es/svg?text=chore&bgcolor=fef2c0
[chore-dependency]: http://labl.es/svg?text=chore-dependency&bgcolor=fef2c0
[chore-documentation]: http://labl.es/svg?text=chore-documentation&bgcolor=fef2c0
[chore-greenkeeper]: http://labl.es/svg?text=chore-greenkeeper&bgcolor=fef2c0

[chore_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3Achore
[chore-dependency_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3Achore-dependency
[chore-documentation_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3Achore-documentation
[chore-greenkeeper_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3Achore-greenkeeper

Light blue labels are for **features**. We use labels to group them into categories.

* <sub>[![core][core]][core_link]
[![localization][localization]][localization_link]
[![performance][performance]][performance_link]
[![preset][preset]][preset_link]
[![renderer][renderer]][renderer_link]
[![validation][validation]][validation_link]</sub>

[core]: http://labl.es/svg?text=core&bgcolor=c5def5
[localization]: http://labl.es/svg?text=localization&bgcolor=c5def5
[performance]: http://labl.es/svg?text=performance&bgcolor=c5def5
[preset]: http://labl.es/svg?text=preset&bgcolor=c5def5
[renderer]: http://labl.es/svg?text=renderer&bgcolor=c5def5
[validation]: http://labl.es/svg?text=validation&bgcolor=c5def5

[core_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3Acore
[localization_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3Alocalization
[performance_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3Aperformance
[preset_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3Apreset
[renderer_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3Arenderer
[validation_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3Avalidation

Dark Grey labels are for **waitfor items**. We won't work on these now, but we'll keep the issues
open while we wait for something to happen.

* <sub>[![waitfor][waitfor]][waitfor_link]
[![waitfor-consensus][waitfor-consensus]][waitfor-consensus_link]
[![waitfor-icon][waitfor-icon]][waitfor-icon_link]
[![waitfor-info][waitfor-info]][waitfor-info_link]
[![waitfor-upstream][waitfor-upstream]][waitfor-upstream_link]</sub>

[waitfor]: http://labl.es/svg?text=waitfor&bgcolor=444
[waitfor-consensus]: http://labl.es/svg?text=waitfor-consensus&bgcolor=444
[waitfor-icon]: http://labl.es/svg?text=waitfor-icon&bgcolor=444
[waitfor-info]: http://labl.es/svg?text=waitfor-info&bgcolor=444
[waitfor-upstream]: http://labl.es/svg?text=waitfor-upstream&bgcolor=444

[waitfor_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3Awaitfor
[waitfor-consensus_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3Awaitfor-consensus
[waitfor-icon_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3Awaitfor-icon
[waitfor-info_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3Awaitfor-info
[waitfor-upstream_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3Awaitfor-upstream

Light Grey labels are for **wontfix items**. We've decided these doesn't belong in
iD at this time. Don't feel bad, sometimes we change our minds later and revisit them!
(ISATIDL = "I saw a thing I don't like", a common OpenStreetMap complaint)

* <sub>[![wontfix][wontfix]][wontfix_link]
[![wontfix-confusing][wontfix-confusing]][wontfix-confusing_link]
[![wontfix-ISATIDL][wontfix-ISATIDL]][wontfix-ISATIDL_link]
[![wontfix-low-impact][wontfix-low-impact]][wontfix-low-impact_link]</sub>

[wontfix]: http://labl.es/svg?text=wontfix&bgcolor=eee
[wontfix-confusing]: http://labl.es/svg?text=wontfix-confusing&bgcolor=eee
[wontfix-ISATIDL]: http://labl.es/svg?text=wontfix-ISATIDL&bgcolor=eee
[wontfix-low-impact]: http://labl.es/svg?text=wontfix-low-impact&bgcolor=eee

[wontfix_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aclosed+is%3Aissue+label%3Awontfix
[wontfix-confusing_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aclosed+is%3Aissue+label%3Awontfix-confusing
[wontfix-ISATIDL_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aclosed+is%3Aissue+label%3Awontfix-ISATIDL
[wontfix-low-impact_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aclosed+is%3Aissue+label%3Awontfix-low-impact

Special:

* <sub>[![bluesky][bluesky]][bluesky_link]</sub> -
Bluesky issues are extra challenging. They might require weeks of development or not even be possible.
* <sub>[![wip][wip]][wip_link]</sub> -
Work in Progress.  Don't start work on these, somebody else already did!

[bluesky]: http://labl.es/svg?text=bluesky&bgcolor=1d76db
[wip]: http://labl.es/svg?text=wip&bgcolor=fbca04

[bluesky_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3Abluesky
[wip_link]: https://github.com/openstreetmap/iD/issues?q=is%3Aopen+is%3Aissue+label%3Awip


## Testing

You can use the [development preview site](https://ideditor.netlify.app) to test
unreleased features and verify bug fixes, all without building iD yourself. This site
is updated with the latest code and translations every time we change the `develop` branch.

The deployments on https://openstreetmap.org and https://preview.ideditor.com/release
are updated only with [stable releases](https://github.com/openstreetmap/iD/releases).
Recently fixed issues may still be present on these sites until the next version of iD
is released.

While it's possible to edit the live OpenStreetMap database with development versions
of iD, it's risky to do so. Your edits could be lost or garbled at any time. Press
the ![live](http://labl.es/svg?text=live&bgcolor=d32232) button in the bottom bar to
switch to the development database.


## Translating

Translations are managed using the
[Transifex](https://www.transifex.com/projects/p/id-editor/) platform. After
signing up, you can go to [iD's project
page](https://www.transifex.com/projects/p/id-editor/), select a language and
click **Translate** to start translating. Translations are divided into
separate resources:

* *core* - contains text for the main interface of iD
* *presets* - contains the text for labeling feature presets
* *imagery* - contains text for imagery names and descriptions

The words in brackets, for example `{name}`, should not be translated into a
new language: it's replaced with a place name when iD presents the text. So a
French translation of `Couldn't locate a place named '{name}'` would look like
`Impossible de localiser l'endroit nommé '{name}'`.

The translations for presets consist of the names of presets, labels for
preset fields, and lists of search terms. You do _not_ need to translate the
search terms literally -- use a set of synonyms and related terms appropriate
to the target language, separated by commas.

You can check your translations on the [development preview site](https://ideditor.netlify.app),
which is updated every time we change the `develop` branch.

[iD translation project on Transifex](https://www.transifex.com/projects/p/id-editor/)

To get notifications when translation source files change, click **Watch
project** button near the bottom of the project page. You can edit your
[notification settings](https://www.transifex.com/user/settings/notices/) if you're
getting too many notifications.

Translations are licensed under
[ISC](https://raw.github.com/openstreetmap/iD/develop/LICENSE.md), the same license
as iD.

**Why are there so many duplicate "Type" translations?** There are multiple
distinct preset fields with the label "Type". You can see some context on the
"Details" tab in Transifex:

![image](https://f.cloud.github.com/assets/98601/324275/1a5cfc8c-9ae0-11e2-9a38-36c0f14d532d.png)

The "key" field indicates that this is the "Type" label for the
"[aeroway](http://wiki.openstreetmap.org/wiki/Aeroway)" preset, i.e. you should
translate it as you would translate "type" in "type of aeroway".

These are separate translations for uniformity reasons and because some languages
 may translate "type" differently in "type of aeroway" and "type of amenity", for
 example.

**Why can't I find the Osmose QA layer translations?** The Osmose QA strings are
 pulled in from the external Osmose API. You can contribute to the
 [Osmose Transifex project](https://www.transifex.com/projects/p/osmose/)
 and the results will be seen in iD once deployed.

Note that if you want to add/update English translations in Osmose then you will
 need to head on over to the [Osmose backend source code](https://github.com/osm-fr/osmose-backend).

### Translations in Code

iD translates strings with a `t` function: `t('foo.bar')` translates the key
`foo.bar` into the current language. If you introduce new translatable strings,
only display them in the interface through the `t()` function.

Then, add the new string to `data/core.yaml`. The translation system, Transifex,
will automatically detect the change.

If you are updating an existing string, update it in `data/core/yaml` and run
`npm run build` to generate the `en.json` file automatically, then commit both
modified files.

Use `npm run build` to build the translations with the local changes.

`npm run translations` can be used to pull the latest translations from Transifex.


## Contributing Documentation

Documentation is maintained as a series of [Markdown](http://daringfireball.net/projects/markdown/)
documents in [core.yaml](/data/core.yaml). The documentation
is in the `help` section. The first line
of each new section of documentation should be of the form

```markdown
# GPS
```

This will be used for navigation and as its title in iD. To add a new piece
of documentation, simply add to [/data/core.yaml](/data/core.yaml) in the
same format as the rest, include your new corresponding `docKey` in
[/modules/ui/help.js](/modules/ui/help.js) and call `npm run build`.


## Adding or Refining Presets

Presets save time for iD users by automatically showing them the tags they are
likely to add for a given feature. They are stored in `data/presets/presets`. If
you're going to update the presets, [review the Presets README](/data/presets/README.md).


## Contributing Code

We like when people get involved! iD is a busy project, so it helps if you first
open an issue to ask whether an idea makes sense,
instead of surprising us with a pull request.

### JavaScript

Legacy iD code was written with ES5 syntax, however we now support most ES6 syntax via [Rollup.js](https://rollupjs.org/guide/en) and the [Rollup Bublé plugin](https://github.com/rollup/plugins/tree/master/packages/buble). You can find details about Bublé [here](https://buble.surge.sh/guide/).

In order to continue to support older browsers like IE11 and our PhantomJS-based test runner, we also include the [browser-polyfills](https://github.com/tiagomapmarques/browser-polyfills#what-does-it-have) package.

We mostly follow the Airbnb style guide for JavaScript:
- [Modern ES6](https://github.com/airbnb/javascript)
- [Legacy ES5](https://github.com/airbnb/javascript/tree/es5-deprecated/es5)

We ask that you follow the convention of using 4 space indent in ES5 files and 2 space indent in ES6 files. While the indenting doesn't matter to the compiler, it does make it easier for us humans to see at a glance whether a file has been "upgraded" to ES6.

Always spaces, never tabs.

JavaScript code should pass through [ESLint](http://eslint.org/) with no warnings.


### HTML

There isn't much HTML in iD, but what there is is similar to JavaScript: 4 spaces
always, indented by the level of the tree:

```html
<div>
    <div></div>
</div>
```


### CSS

Just like HTML and JavaScript, 4 space soft tabs always.

```css
.menu-tooltip {
    background: rgba(255, 255, 255, 0.8);
}
```

We write vanilla CSS with no preprocessing step. Since iD targets modern browsers,
(Chrome, Firefox, Safari, Opera, IE11, and Edge) feel free to use newer features wisely.


### Tests

Test your code and make sure it passes.

1. Go to the directory where you have checked out `iD`
2. run `npm install`
3. run `npm test` to see whether your tests pass or fail.


### Building / Installing

You can rebuild iD completely with the command `npm run all`.

iD will be built to the `dist` directory. This directory is self-contained; you can copy it
into the public directory of your webserver to deploy iD.


### Licensing

iD is available under the [ISC License](https://opensource.org/licenses/ISC).
Some of the libraries it uses are under different licenses. If you're contributing
to iD, you're contributing ISC Licensed code.


## Submitting Changes

In your local copy, make a branch for this change using a descriptive branch name:

    git checkout -b fix-the-thing

Make your changes to source files under `modules/`.
The `iD.js` and `iD.min.js` files in this project are autogenerated - don't edit them.

1. Try your change locally.  Run `npm start` and visit `localhost:8080` in a browser.
2. Run lint and tests with `npm test`
3. Commit your changes with an informative commit message
4. [Submit a pull request](https://help.github.com/articles/using-pull-requests) to the `openstreetmap/iD` project.


## Using GitHub and git

If you are new to GitHub or git you can read the [GitHub Guides](https://guides.github.com)
"Understanding the GitHub Flow", "Git Handbook" and "Forking Projects" could be especially interesting to you.

### Step by Step

Additionally here is a step-by-step workflow example for beginners:

1. [Login](https://github.com/login) to your GitHub account or [create](https://services.github.com/on-demand/intro-to-github/create-github-account) a GitHub account, if you do not already have one.

2. Go to the [iD main repository](https://github.com/openstreetmap/iD) and fork iD into your GitHub account (Fork is top right).

3. Set up [Git](https://help.github.com/articles/set-up-git/) and prepare for Authenticating with GitHub from Git.

4. Clone or download your local copy of iD from your GitHub account using https `git clone https://github.com/<yourgithubaccount>/iD.git` or using ssh `git clone git@github.com:{{yourgithubaccount}}/iD.git`. In your local copy you'll have a "remote" called origin.

5. Switch to the iD directory, create a working branch (choose a descriptive name) and switch to it : `cd iD ; git checkout -b <working-branch-name>`. Never do anything in the `develop` branch.

6. Edit file(s) and try your change locally (See above).

7. Add Files and commit them `git add <files> ; git commit -m "Description of what you did"` .. repeat as needed ..

8. Push Changes to your GitHub account `git push origin <working-branch-name>`. The next push also works without the branch name: `git push origin`.

9.  Go to GitHub for your fork of iD at https://github.com/{{yourgithubaccount}}/iD. GitHub will already know about your recently pushed branch, and ask if you want to create a Pull Request for it.

10. Your Pull Request will be seen by the maintainers of iD. They can merge it or ask for changes. You can update your Pull Request with Steps 7 and 8, Step 9 is required only once per Pull Request.

### Clean Up

After your Pull Request gets merged into the main repository
you can clean up by deleting the branch from your GitHub-iD-Clone and your local directory

`git push --delete origin <working-branch-name> ; git branch -d <working-branch-name>`

### Restart with another PR after some while

If you did not use your copy of iD for some while, other Pull Request gets merged and you don't have the latest version of iD. You can replace your `develop` with whatever is in our `develop`. If you have not done so yet: Add the main repo as an "upstream" remote:

`git remote add upstream git@github.com:openstreetmap/iD.git`

Then change to the `develop` branch and get everything from upstream (the main repository)

`git checkout develop ; git fetch --all && git reset --hard upstream/develop`


## Submitting directly in the Browser

If you want to submit Documentation, Spelling improvements, etc. which do not need testing,
you can do this with your browser in GitHub. Please don't use this to change Code and create untested Pull Requests.
You also need a GitHub account and may find this [Article about Editing](https://help.github.com/articles/editing-files-in-another-user-s-repository/) and this [Article about Pull Requests](https://help.github.com/articles/about-pull-requests/) useful.

### Step by Step with Browser

Additionally here is a step-by-step workflow example for beginners:

1. [Login](https://github.com/login) to your GitHub account or [create](https://services.github.com/on-demand/intro-to-github/create-github-account) a GitHub account, if you do not already have one.

2. Go to the [iD main repository](https://github.com/openstreetmap/iD) and fork iD into your GitHub account (Fork is top right).

3. Create a New Branch by clicking on "Branch: develop" and entering the name of a new branch (choose a descriptive name).

4. Navigate to the file you want to edit and click on "Edit this file" and apply your changes to the file. Alternatively, you could also "Create a new file".

5. When finished editing the file enter a commit text (the description is optional) and commit directly to the newly created branch. You may repeat 4 and 5 until all required changes are committed.

6. Navigate back to your "id" project - https://github.com/{{yourgithubaccount}}/iD

7. Follow this [Article about Pull Requests](https://help.github.com/articles/about-pull-requests/) to create a new pull request for your change
