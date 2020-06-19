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

--

_Further sections coming soon…_
