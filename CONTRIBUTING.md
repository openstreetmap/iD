# Contributing to iD

Thinking of contributing to iD? High five! There are plenty of ways to get involved.
You don't need to know anything about programming (though it's always a great time to learn!).

Everyone involved in the iD project is subject to the [Code of Conduct](CODE_OF_CONDUCT.md).
Please take a moment to read it before proceeding, it's short and simple. We want
everyone to feel comfortable contributing to iD.

The project is currently maintained by [@tyr_asd](https://github.com/tyrasd) and [@k-yle](https://github.com/k-yle/). Get in touch if you have any questions.

## Submitting Issues

We'd love to hear your feedback about iD. Please [search existing issues](https://github.com/search?l=&q=repo%3Aopenstreetmap%2FiD&type=Issues)
before [opening a new one](https://github.com/openstreetmap/iD/issues/new/choose). Many bugs and ideas have already been posted.

When reporting a bug:

* Write specifically what browser (type and version, like "Firefox 49.0"), OS,
and browser extensions you have installed
* Write steps to replicate the error: when did it happen? What did you expect to happen?
What happened instead?
* We love screenshots. If you can take a picture of the issue, that is extra helpful.
You can drag the image or video file onto the GitHub issue and it will be included with your bug report.
* Please keep bug reports professional and straightforward: trust us, we share your dismay at software breaking.
* If you can, enable web developer extensions and report the
JavaScript error message.
* When in doubt, over-describe the bug and how you discovered it.

When requesting a feature:

* Provide a link if the feature is available in some other software.
  We care about prior art.
* Understand that iD is focused on simplicity and doesn't aim to be
  as complete as JOSM or other editors.


### Issue Labels

We use GitHub labels to keep track of issues. Some guidelines:

Green labels are for **action items**. Jump in and start working!
* https://github.com/openstreetmap/iD/labels/new%20contributor%20opportunity -
Best for new contributors. Little experience necessary!
* https://github.com/openstreetmap/iD/labels/help%20wanted -
For more intermediate contributors, probably requires investigation or knowledge of iD code.
* https://github.com/openstreetmap/iD/labels/priority -
Issues that have a big impact or matter most to _new mappers_.
<br/>(There should probably be 10 or fewer "priority" items.)

Red labels are for **bugs**. These are things that we want fixed, but might be a bit more
complicated than the green action items.

* https://github.com/openstreetmap/iD/labels/bug
  https://github.com/openstreetmap/iD/labels/bug-browser-specific
  https://github.com/openstreetmap/iD/labels/bug-cant-reproduce
  https://github.com/openstreetmap/iD/labels/bug-release-blocker

Purple labels are for **non-action items**. These might be a question or feature request
that needs some discussion about whether it belongs in iD.  Discuss before working on these.

* https://github.com/openstreetmap/iD/labels/considering
  https://github.com/openstreetmap/iD/labels/question

Yellow labels are for **chores**. These are things like code cleanup, upgrades, tests,
documentation, repository gardening, and other stuff that makes developers happy.

* https://github.com/openstreetmap/iD/labels/chore
  https://github.com/openstreetmap/iD/labels/chore-build
  https://github.com/openstreetmap/iD/labels/chore-dependabot
  https://github.com/openstreetmap/iD/labels/chore-dependency
  https://github.com/openstreetmap/iD/labels/chore-embed
  https://github.com/openstreetmap/iD/labels/documentation

Light blue labels are for **components**, the specific parts of iD that concern the issue.

* https://github.com/openstreetmap/iD/labels/api
  https://github.com/openstreetmap/iD/labels/core
  https://github.com/openstreetmap/iD/labels/data
  https://github.com/openstreetmap/iD/labels/field
  https://github.com/openstreetmap/iD/labels/icon
  https://github.com/openstreetmap/iD/labels/map-renderer
  https://github.com/openstreetmap/iD/labels/operation
  https://github.com/openstreetmap/iD/labels/preset
  https://github.com/openstreetmap/iD/labels/streetlevel
  https://github.com/openstreetmap/iD/labels/tools
  https://github.com/openstreetmap/iD/labels/validation
  https://github.com/openstreetmap/iD/labels/walkthrough-help

Dark teal labels are for **categories**, the high-level concepts that the issue falls under.

* https://github.com/openstreetmap/iD/labels/accessibility
  https://github.com/openstreetmap/iD/labels/compatibility
  https://github.com/openstreetmap/iD/labels/keyboard
  https://github.com/openstreetmap/iD/labels/localization
  https://github.com/openstreetmap/iD/labels/performance
  https://github.com/openstreetmap/iD/labels/touch-stylus
  https://github.com/openstreetmap/iD/labels/usability

Dark grey labels are for **waitfor items**. We won't work on these now, but we'll keep the issues
open while we wait for something to happen.

* https://github.com/openstreetmap/iD/labels/waitfor
  https://github.com/openstreetmap/iD/labels/waitfor-consensus
  https://github.com/openstreetmap/iD/labels/waitfor-icon
  https://github.com/openstreetmap/iD/labels/waitfor-info
  https://github.com/openstreetmap/iD/labels/waitfor-tag
  https://github.com/openstreetmap/iD/labels/waitfor-upstream

Light grey labels are for **wontfix items**. We've decided these don't belong in
iD at this time. Don't feel bad, sometimes we change our minds later and revisit them!

* https://github.com/openstreetmap/iD/labels/duplicate
  https://github.com/openstreetmap/iD/labels/wontfix
  https://github.com/openstreetmap/iD/labels/wontfix-confusing
  https://github.com/openstreetmap/iD/labels/wontfix-impossible
  https://github.com/openstreetmap/iD/labels/wontfix-low-impact
  https://github.com/openstreetmap/iD/labels/wontfix-not-a-bug
  https://github.com/openstreetmap/iD/labels/wontfix-not-iD
  https://github.com/openstreetmap/iD/labels/wontfix-out-of-scope

Special:

* https://github.com/openstreetmap/iD/labels/bluesky -
Bluesky issues are extra challenging. They might require weeks of development or not even be possible.
* https://github.com/openstreetmap/iD/labels/wip -
Work in Progress.  Don't start work on these; somebody else already did!


## Testing

You can use the [development preview site](https://ideditor.netlify.app) to test
unreleased features and verify bug fixes, all without building iD yourself. This site
is updated with the latest code and translations every time we change the `develop` branch.

The deployments on https://openstreetmap.org and https://ideditor-release.netlify.app
are updated only with [stable releases](https://github.com/openstreetmap/iD/releases).
Recently fixed issues may still be present on these sites until the next version of iD
is released.

While it's possible to edit the live OpenStreetMap database with development versions
of iD, it's risky to do so. Your edits could be lost or garbled at any time. Press
the ![live](http://labl.es/svg?text=live&bgcolor=d32232) button in the bottom bar to
switch to the development database.


## Translating

Translations are managed using the
[Transifex](https://app.transifex.com/openstreetmap/id-editor/) platform. Sign up to Transifex via the
["Join This Project"](https://app.transifex.com/join/?o=openstreetmap&p=id-editor&t=opensource) link on
the [iD's project page](https://app.transifex.com/openstreetmap/id-editor/) and
click **Translate** to start translating. If you try to join via the home page "Sign up" link you won't
be able to create an account without a "business email". Translations are divided into
separate resources:

* *core* - contains text for the main interface of iD
* *presets* - contains the text for labeling feature presets
* *imagery* - contains text for imagery names and descriptions

The words in brackets, for example `{name}`, should not be translated into a
new language: it's replaced with a place name when iD presents the text. So a
French translation of `Couldn't locate a place named '{name}'` would look like
`Impossible de localiser l'endroit nommé '{name}'`.

The translations for presets, [maintained in the id-tagging-schema repository](https://github.com/openstreetmap/id-tagging-schema), consist of the names of presets, labels for
preset fields, and lists of search terms. You do _not_ need to translate the
search terms literally -- use a set of synonyms and related terms appropriate
to the target language, separated by commas.
For more information on translating the presets [please see this id-tagging-schema contribution guide](https://github.com/openstreetmap/id-tagging-schema/blob/main/CONTRIBUTING.md#translating).

You can check your translations on the [development preview site](https://ideditor.netlify.app),
which is updated every time we change the `develop` branch.

[iD translation project on Transifex](https://app.transifex.com/openstreetmap/id-editor/)

To get notifications when translation source files change, click **Watch
project** button near the bottom of the project page. You can edit your
[notification settings](https://app.transifex.com/user/settings/notices/) if you're
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
 [Osmose Transifex project](https://app.transifex.com/openstreetmap-france/osmose/)
 and the results will be seen in iD once deployed.

Note that if you want to add/update English translations in Osmose then you will
 need to head on over to the [Osmose backend source code](https://github.com/osm-fr/osmose-backend).

### Translations in Code

iD translates strings with a `t` function: `t('foo.bar')` translates the key
`foo.bar` into the current language. If you introduce new translatable strings,
only display them in the interface through the `t()` function.

Then, add the new string to `data/core.yaml`. The translation system, Transifex,
will automatically detect the change.

If you are adding or updating an existing string, update it in `data/core.yaml`
and run `npm run build` to generate the `en.min.json` file automatically. Only
commit the `data/core.yaml` file in your pull request. The translation system,
Transifex, will automatically detect the changes.

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


## Editing Presets or Tagging

iD's knowledge of OpenStreetMap tags is mostly handled by the [iD Tagging Schema](https://github.com/openstreetmap/id-tagging-schema)
project, which has its own opportunities to contribute.


## Contributing Code

We like when people get involved! iD is a busy project, so it helps if you first
open an issue to ask whether an idea makes sense,
instead of surprising us with a pull request.

### JavaScript

iD code was initially written with ES5 syntax, however we do now develop using ES6 syntax.

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
(Chrome, Firefox, Safari, Opera, and Edge) feel free to use newer features wisely.


### Tests

Test your code and make sure it passes.

1. Go to the directory where you have checked out `iD`
2. run `npm install`
3. run `npm test` to see whether your tests pass or fail.

Note that in order to run the tests, Chrome needs to be installed on the system. Chromium can be used as an alternative, but requires setting the environment variable `CHROME_BIN` to the corresponding executable (e.g. `export CHROME_BIN="`which chromium`"`).

### Building / Installing

Follow the steps in the [how to get started guide](https://github.com/openstreetmap/iD/wiki/How-to-get-started#build-and-test-instructions) on how to build and run iD.


### Licensing

iD is available under the [ISC License](https://opensource.org/licenses/ISC).
Some of the libraries it uses are under different licenses. If you're contributing
to iD, you're contributing ISC Licensed code.


## Submitting Changes

In your local copy, make a branch for this change using a descriptive branch name:

    git checkout -b fix-the-thing

Make your changes to source files under `modules/`.
The `iD.js` and `iD.min.js` files in this project are autogenerated - don't edit them.

1. Try your change locally.  Run `npm start` and visit `http://127.0.0.1:8080` in a browser.
2. Run lint and tests with `npm test`.
3. If you feel like it, append a line describing your changes to the project's [changelog](https://github.com/openstreetmap/iD/blob/develop/CHANGELOG.md).
4. Commit your changes with an informative commit message.
5. [Submit a pull request](https://help.github.com/articles/using-pull-requests) to the `openstreetmap/iD` project.


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
