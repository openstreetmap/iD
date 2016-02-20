# Contributing to iD

Thinking of contributing to iD? High five! Here are some basics for our habits
so that you can write code that fits in perfectly.

## Reporting Issues

We'd love to hear what you think about iD, about any specific problems or
concerns you have. Here's a quick list of things to consider:

Please [search for your issue before filing it: many bugs and improvements have already been reported](https://github.com/search?l=&q=repo%3Aopenstreetmap%2FiD&type=Issues)

To report a bug:

* Write specifically what browser (type and version, like "Firefox 43.0"), OS, and browser extensions you have installed
* Write steps to replicate the error: when did it happen? What did you expect to happen? What happened instead?
* Please keep bug reports professional and straightforward: trust us, we share your dismay at software breaking.
* If you can, [enable web developer extensions](http://debugbrowser.com/) and report the
  Javascript error message.

When in doubt, be over-descriptive of the bug and how you discovered it.

To request a feature:

* If the feature is available in some other software (like Potlatch), link to that software and the implementation.
  We care about prior art.
* Understand that iD is meant to be a simple editor and doesn't aim to be
  as complete or complicated as JOSM or similar.

## Verifying Bug Fixes

To verify a bug fix (or test a new feature), use the [master deployment](http://www.openstreetmap.us/iD/master/)
(http://www.openstreetmap.us/iD/master/), which is updated every 10 minutes with the latest code.

The deployments on openstreetmap.org and http://www.openstreetmap.us/iD/release/ are updated only
with stable releases. Issues that are marked fixed in the tracker may still be present.

## Translating

Translations are managed using the
[Transifex](https://www.transifex.com/ideditor/id-editor/) platform. After
signing up, you can go to [iD's project
page](https://www.transifex.com/ideditor/id-editor/), select a language and
click *Translate now* to start translating. Translations are divided into two
sections, *core*, which contains text for the main interface of iD, and
*presets*, which has the text for labeling feature presets.

The words in brackets, for example `{name}`, should not be translated into a
new language: it's replaced with a place name when iD presents the text. So a
French translation of `Couldn't locate a place named '{name}'` would look like
`Impossible de localiser l'endroit nommé '{name}'`.

The translations for presets consist of the names of presets, labels for
preset fields, and lists of search terms. You do _not_ need to translate the
search terms literally -- use a set of synonyms and related terms appropriate
to the target language, separated by commas.

[iD translation project on
Transifex](https://www.transifex.com/ideditor/id-editor/)

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

## Adding New Strings for Translation

iD translates strings with a `t` function - `t('foo.bar')` translate the key
`foo.bar` into the current language. If you introduce new translatable strings
to iD, only display them in the interface through the `t()` function.

Then, add the new string to `data/core.yaml`. The translation system, Transifex,
will automatically detect the change.

Use `make` to build the translations with the local changes.
`make translate` can be used to pull the latest translations from Transifex.

## Contributing Documentation

Documentation is maintained as a series of [Markdown](http://daringfireball.net/projects/markdown/)
documents in [core.yaml](/data/core.yaml). The documentation
is in the `help` section (currently starting at line 258). The first line
of each new section of documentation should be of the form

    # GPS

This will be used for navigation and as its title in iD. Documentation is
shown in alphabetical order, so most documentation is prefixed with `02-` and
so on in order to keep it in a certain order.

To add a new piece of documentation, simply add to [core.yaml](/data/core.yaml) in the same format as the rest.

## Adding or Refining Presets

Presets save time for iD users by automatically showing them the tags they are
likely to add for a given feature. They are stored in `data/presets/presets`. If
you're going to update the presets, [review the Presets README](/data/presets/README.md).

## Javascript

We use the [Airbnb style for Javascript](https://github.com/airbnb/javascript) with
only one difference:

**4 space soft tabs always for Javascript, not 2.**

No aligned `=`, no aligned arguments, spaces are either indents or the 1
space between expressions. No hard tabs, ever.

Javascript code should pass through [ESLint](http://eslint.org/) with no
warnings.

## HTML

There isn't much HTML in iD, but what there is is similar to JS: 4 spaces
always, indented by the level of the tree:

```html
<div>
    <div></div>
</div>
```

## CSS

Just like HTML and Javascript, 4 space soft tabs always.

```css
.radial-menu-tooltip {
    background: rgba(255, 255, 255, 0.8);
}
```

We write vanilla CSS with no preprocessing step. Since iD targets modern browsers,
feel free to use newer features wisely.

## Tests

Test your code and make sure it passes.

First ensure you have a `phantomjs` binary, version 2.0 or later, available on your `$PATH`. On a Mac,
you can install this via homebrew with `brew install phantomjs`. Then:

1. Go to the directory where you have checked out `iD`
2. run `npm install`
3. run `make`
4. run `npm test` to see whether your tests pass or fail.

## Building / Installing

You can build a concatenated and minified version of iD with the command `make`. Node.js is
required for this.

iD will be built to the `dist` directory. This directory is self-contained; you can copy it
into the public directory of your webserver to deploy iD.

## Live reloading

You can use [live-server](https://www.npmjs.com/package/live-server) *(npm module)* to
reload the browser automatically whenever there is a change in code.

1. run `npm install -g live-server`
2. run  `live-server .` or `live-server dist`
 *(You will be automatically redirected to the local server page.)*

*(Note: Sometimes auto reload might not display correctly and you might need to rebuild iD by running `make`.)*

## Licensing

iD is available under the [ISC License](https://opensource.org/licenses/ISC).
Some of the libraries it uses are under different licenses. If you're contributing
to iD, you're contributing ISC Licensed code.

## Submitting Changes

Let's say that you've thought of a great improvement to iD - a change that
turns everything red (please do not do this, we like colors other than red).

In your local copy, make a branch for this change:

    git checkout -b make-red

Make your changes to source files. By source files we mean the files in `js/`.
the `iD.js` and `iD.min.js` files in this project are autogenerated - don't edit
them.

So let's say you've changed `js/ui/confirm.js`.

1. Run `eslint js/id` to make sure your code is clean
2. Run tests with `npm test`
3. Commit your changes with an informative commit message
4. [Submit a pull request](https://help.github.com/articles/using-pull-requests) to the `openstreetmap/iD` project.
