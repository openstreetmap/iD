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
- 🟩 Full support assumed, but not sufficiently tested
- 🟠 Partial support
- ❌ No appreciable support
- 🤷 Unknown support, none is assumed

## Browser Compatibility

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
| 🟩 | Opera | |
| 🟩 | Edge | |
| 🟠 | Internet Explorer | Infrequently tested. IE has been discontinued, but IE 11 is still maintained. iD polyfills ES6 features on IE 11, with varying success. |
| 🟠 | Mobile browsers | iD has not yet been fully optimized for mobile devices, but some editing is usually possible. |

[#7132]: https://github.com/openstreetmap/iD/issues/7132

## Input Device Support

iD has traditionally assumed the mapper will be interacting via a mouse and keyboard,
but realistically people want or need to use various other input devices.

### Setups

The following table details iD's usability for different setups. A setup is where
a mapper is using only the device(s) listed in the row.

A setup with "full support" offers functionality equivalent to that of the
highest-functioning setup (generally mouse and keyboard).
Certain functions may be accessed differently on different setups,
such as opening the edit menu via long-pressing instead of right-clicking.

Older browsers that don't support [pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)
may see degraded functionality for some setups.

|  |  | Input Setup | Notes |
|---|---|---|---|
| ✅ | 🖱⌨️ | [Mouse](https://en.wikipedia.org/wiki/Computer_mouse) + [keyboard](https://en.wikipedia.org/wiki/Computer_keyboard) | iD's original input paradigm. Any mouse-like device such as a [trackpad](https://en.wikipedia.org/wiki/Touchpad), [trackball](https://en.wikipedia.org/wiki/Trackball), or [pointing stick](https://en.wikipedia.org/wiki/Pointing_stick) is grouped into "mouse" for this table |
| ❌ | ⌨️   | Keyboard only | Not all elements can necessarily be keyed to. Key traps may exists. Geometry editing isn't possible |
| 🟠 | 🖱  | Mouse only | The primary [mouse button](https://en.wikipedia.org/wiki/Mouse_button) (e.g. left click) alone is sufficient. Multiselection and disabling of node-snapping aren't possible |
| 🟠 | 🖐  | [Multi-touch](https://en.wikipedia.org/wiki/Multi-touch) on a [touchscreen](https://en.wikipedia.org/wiki/Touchscreen) | Move and rotate aren't possible |
| 🟠 | ✍️   | [Stylus](https://en.wikipedia.org/wiki/Stylus_(computing)) on a touchscreen | Move, rotate, and multiselection aren't possible |
| 🤷 | ✍️🔲 | Stylus on a [graphics tablet](https://en.wikipedia.org/wiki/Graphics_tablet) | |
| 🤷 | 🎮  | [Gamepad](https://en.wikipedia.org/wiki/Gamepad) | |
| 🤷 | 🗣  | [Voice](https://en.wikipedia.org/wiki/Voice_user_interface) | Tools like [Voice Control on macOS](https://support.apple.com/en-us/HT210539) and [Windows Speech Recognition](https://en.wikipedia.org/wiki/Windows_Speech_Recognition) allow navigating webpages with voice commands to some degree |
| 🤷 | 🔘  | [Switch](https://en.wikipedia.org/wiki/Switch_access) | Tools like [Switch Control on macOS](https://support.apple.com/en-us/HT202865) can theoretically replicate mouse and keyboard interactions in most apps |

## Language Support

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
| ✅ | Browser language preference | iD tries to use the language set in the browser |
| ❌ | Base language fallback | E.g. if `pt_BR` is incomplete, `pt` should be tried before `en` |
| ❌ | Custom fallback language | If the preferred language is incomplete, a user-specified one should be tried before `en` (e.g. `kk` → `ru`) |
| ✅ | Locale URL parameters | `locale` and `rtl` can be used to manually set iD's locale preferences. See the [API](API.md#url-parameters) |
| 🟩 | Right-to-left layouts | Used for languages like Hebrew and Arabic |

### Translatability

The following table details which interface elements can adapt to the mapper's
language preferences. This doesn't account for whether they've actually been
translated to one or more languages.

|  | Interface Element | Notes | Issues |
|---|---|---|---|
| ✅ | Labels and descriptions | | |
| ✅ | Help docs and walkthrough | | |
| ✅ | Letter hotkeys | E.g. <kbd>S</kbd> for Straighten makes sense in English, but not every language | |
| ✅ | Preset names and search terms | | |
| 🟠 | Fields | Combo fields may show raw tag values. The Wikipedia field lists Wiki names in their native languages | [#2708](https://github.com/openstreetmap/iD/issues/2708) |
| ❌ | Tags | OpenStreetMap tags are English-only as a limitation of the database | |
| ❌ | Relation member roles | OpenStreetMap roles are also limited to English | |
| ✅ | Imagery metadata | | |
| 🟠 | Locator overlay | This layer shows feature labels in their local languages | [#7737](https://github.com/openstreetmap/iD/issues/7737) |
| ✅ | OSM community index | | |
| ✅ | iD validation issues | | |
| ✅ | KeepRight issues | | |
| ✅ | ImproveOSM issues | | |
| ✅ | Osmose issues | Translated strings are [provided by Osmose](https://www.transifex.com/openstreetmap-france/osmose/) itself, not iD | |

### Language Coverage

The completion percentages for iD translations constantly change, and so are not
listed here. Visit the [Transifex project page](https://www.transifex.com/openstreetmap/id-editor/)
to see the latest numbers. Typically a few languages (German, Spanish, Japanese…)
are kept close to 100% coverage, while most languages have less than 50% coverage.

---

_Further sections coming soon…_
