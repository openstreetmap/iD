# Contributing to iD

Thinking of contributing to iD? High five! Here are some basics for our habits
so that you can write code that fits in perfectly.


## Code of Conduct

We want everyone to feel comfortable contributing to iD.  Please read the project
[Code of Conduct](CODE_OF_CONDUCT.md) and remember to be nice to one another.


## Reporting Issues

We'd love to hear what you think about iD, about any specific problems or
concerns you have. Here's a quick list of things to consider:

Please [search for your issue before filing it: many bugs and improvements have already been reported](https://github.com/search?l=&q=repo%3Aopenstreetmap%2FiD&type=Issues)

To report a bug:

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

When in doubt, be over-descriptive of the bug and how you discovered it.

To request a feature:

* If the feature is available in some other software (like Potlatch), link to that software and the implementation.
  We care about prior art.
* Understand that iD is meant to be a simple editor and doesn't aim to be
  as complete or complicated as JOSM or similar.


## Issue Labels

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
complicted than the green action items.

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

## Verifying Bug Fixes

To verify a bug fix (or test a new feature), use the [master deployment](http://preview.ideditor.com/master/)
(http://preview.ideditor.com/master/), which is updated every 10 minutes with the
latest code and translation strings.

The deployments on openstreetmap.org and http://preview.ideditor.com/release/ are updated only
with stable releases. Issues that are marked fixed in the tracker may still be present.

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

You can check your translations in the [master deployment](http://preview.ideditor.com/master/)
(http://preview.ideditor.com/master/), which is updated every 10 minutes with the
latest code and translation strings.

[iD translation project on Transifex](https://www.transifex.com/projects/p/id-editor/)

To get notifications when translation source files change, click **Watch
project** button near the bottom of the project page. You can edit your
[notification settings](https://www.transifex.com/user/settings/notices/) if you're
getting too many notifications.

Translations are licensed under
[ISC](https://raw.github.com/openstreetmap/iD/master/LICENSE), the same license
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

## Adding New Strings for Translation or Updating Existing Strings

iD translates strings with a `t` function - `t('foo.bar')` translate the key
`foo.bar` into the current language. If you introduce new translatable strings
to iD, only display them in the interface through the `t()` function.

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


## JavaScript

We use the [Airbnb style for JavaScript](https://github.com/airbnb/javascript) with
only one difference:

**4 space soft tabs always for JavaScript, not 2.**

No aligned `=`, no aligned arguments, spaces are either indents or the 1
space between expressions. No hard tabs, ever.

JavaScript code should pass through [ESLint](http://eslint.org/) with no
warnings. iD uses [ES6 modules](http://exploringjs.com/es6/ch_modules.html) to
handle connect code together, so we support `import` and `export` constructs.


## HTML

There isn't much HTML in iD, but what there is is similar to JavaScript: 4 spaces
always, indented by the level of the tree:

```html
<div>
    <div></div>
</div>
```


## CSS

Just like HTML and JavaScript, 4 space soft tabs always.

```css
.radial-menu-tooltip {
    background: rgba(255, 255, 255, 0.8);
}
```

We write vanilla CSS with no preprocessing step. Since iD targets modern browsers,
(Chrome, Firefox, Safari, Opera, IE11, and Edge) feel free to use newer features wisely.


## Tests

Test your code and make sure it passes.

1. Go to the directory where you have checked out `iD`
2. run `npm install`
3. run `npm test` to see whether your tests pass or fail.

## Building / Installing

You can rebuild iD completely with the command `npm run all`.

iD will be built to the `dist` directory. This directory is self-contained; you can copy it
into the public directory of your webserver to deploy iD.


## Licensing

iD is available under the [ISC License](https://opensource.org/licenses/ISC).
Some of the libraries it uses are under different licenses. If you're contributing
to iD, you're contributing ISC Licensed code.


## Submitting Changes

We like when people get involved! iD is a busy project, and it helps the
maintainers if you first open an issue to ask whether an idea makes sense,
instead of surprising us with a pull request.

In your local copy, make a branch for this change using a descriptive branch name:

    git checkout -b fix-the-thing

Make your changes to source files under `modules/`.
The `iD.js` and `iD.min.js` files in this project are autogenerated - don't edit them.

1. Try your change locally.  Run `npm start` and visit `localhost:8080` in a browser.
2. Run lint and tests with `npm test`
3. Commit your changes with an informative commit message
4. [Submit a pull request](https://help.github.com/articles/using-pull-requests) to the `openstreetmap/iD` project.
