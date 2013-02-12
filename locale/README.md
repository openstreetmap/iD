# Translations

At this stage in its development, iD is using an extremely minimal, simple
system for translations. This directory contains languages according to
code (de: German, fr: French, etc).

To contribute:

If you're technically-minded, clone this repository and edit the necessary
file, and you can preview your changes in-place if your system language is
set. Check out [the contributing guide for submitting changes](https://github.com/systemed/iD/blob/master/CONTRIBUTING.md).

If you aren't, you can still contribute! You'll still need a GitHub account, but
you can just browse to your language's file here,
click 'Edit', and edit each translated string.

## Translating Strings

Let's look at an example line from `en.js`:

```javascript
no_results: "Couldn't locate a place named '{name}'"
```

The word in brackets, `{name}`, should **not** be translated into a new
language: it's replaced with a place name when iD presents the text. So
a French translation would look like

```javascript
no_results: "Impossible de localiser l'endroit nommé '{name}'"
```

## License

Contributions to translations are under the same liberal
license as iD itself, [wtfpl](http://www.wtfpl.net/).
