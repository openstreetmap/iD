# Accessibility & Compatibility

iD aims to make mapping as easy possible for as many people as possible. To this end,
we recognize that everyone has different backgrounds, abilities, and technologies,
and therefore different needs. Developing for the "average user" will inevitably
fail to serve some proportion of mappers. Broadly speaking, iD should strive to
follow [universal design](https://en.wikipedia.org/wiki/Universal_design) principles.

This is a living document that details the usability of iD across a number of dimensions,
with the intent of identifying and addressing problem areas.

Symbols used in this document:

- ✅ Full support
- 🟩 Full support assumed but unverified
- 🟠 Partial support
- ❌ No appreciable support

## Cross-Browser Compatibility

As a web app, iD's browser support is fundamental. The user experience should be
as equivalent as possible across the latest versions of all modern browsers on all
major operating systems. When possible, functionality unsupported by older browsers
should fallback gracefully without breaking other aspects of the app.

This table covers high-level compatibility, with individual features to be detailed
elsewhere in this document.

|   | Browser | Notes |
|---|---|---|
| ✅ | Chrome | |
| ✅* | Firefox | *Minor known issues ([#7132]) |
| ✅ | Safari | |
| 🟩 | Opera | Infrequently tested |
| 🟩 | Edge | Infrequently tested |
| 🟠 | Internet Explorer | Infrequently tested. IE has been discontinued, but IE 11 is still maintained. iD polyfills ES6 features on IE 11, with varying success. |
| 🟠 | Mobile browsers | iD has not yet been fully optimized for mobile devices, but some editing is usually possible. |

[#7132]: https://github.com/openstreetmap/iD/issues/7132

## Multilingual Support

English is the language of tags and relation roles in the OpenStreetMap database.
It's also the source language of iD's interface, meaning English is the only language
guaranteed to have 100% coverage. Despite this privileged position, English proficiency
should not be a barrier to mapping.

Most of iD's interface can be translated to essentially any written language via the Transifex
platform. Some languages have region-specific variants, such as Brazilian Portuguese (`pt_BR`).
Translators are typically volunteers. See the [translation guide](https://github.com/openstreetmap/iD/blob/develop/CONTRIBUTING.md#translating)
for more info.

|  | Localization Feature | Notes |
|---|---|---|
| ✅ | Detect the browser's locale | |
| 🟩 | Right-to-left layouts | Infrequently tested. Used for languages like Hebrew and Arabic |

### Translatability

The following table details which interface elements can adapt to the mapper's
language preferences. This doesn't account for whether they've actually been
translated to one or more languages.

|  | Interface Element | Notes |
|---|---|---|
| ✅ | Labels and descriptions | |
| ✅ | Help docs and walkthrough | |
| ✅ | Letter hotkeys | e.g. <kbd>S</kbd> for Straighten makes sense in English, but not every language |
| ✅ | Preset names and search terms | |
| 🟠 | Fields | Combo fields may show raw tag values. The Wikipedia field lists Wiki names in their native languages |
| ❌ | Tags | OpenStreetMap tags are English-only as a limitation of the database |
| ❌ | Relation member roles | OpenStreetMap roles are also limited to English |
| ✅ | Imagery metadata | |
| 🟠 | Locator overlay | This layer shows feature labels in their local languages |
| ✅ | OSM community index | |
| ✅ | iD validation issues | |
| ✅ | KeepRight issues | |
| ✅ | ImproveOSM issues | |
| ✅ | Osmose issues | Translated strings are [provided by Osmose](https://www.transifex.com/openstreetmap-france/osmose/) itself, not iD |

---

_Further sections coming soon…_
