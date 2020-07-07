# Accessibility & Compatibility

iD aims to make mapping as easy possible for as many people as possible. To this end,
we recognize that everyone has different backgrounds, abilities, and technologies,
and therefore different needs. Developing for the "average user" will inevitably
fail to serve some proportion of mappers. Broadly speaking, iD should strive to
follow [universal design](https://en.wikipedia.org/wiki/Universal_design) principles.

This is a living document that details the usability of iD across a number of dimensions,
with the intent of identifying and addressing problem areas. Since there are always more
factors to consider, no part of this document should be considered complete.

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

|   | Icon | Browser | Notes | Issues |
|---|---|---|---|---|
| ✅ | ![chrome logo] | [Chrome](https://en.wikipedia.org/wiki/Google_Chrome) | |
| ✅* | ![firefox logo] | [Firefox](https://en.wikipedia.org/wiki/Firefox) | \*Minor known issues | [#7132](https://github.com/openstreetmap/iD/issues/7132) |
| ✅ | ![safari logo] | [Safari](https://en.wikipedia.org/wiki/Safari_(web_browser)) | |
| 🟩 | ![opera logo] | [Opera](https://en.wikipedia.org/wiki/Opera_(web_browser)) | |
| 🟩 | ![edge logo] | [Edge](https://en.wikipedia.org/wiki/Microsoft_Edge) | |
| 🟠 | ![ie logo] | [Internet Explorer](https://en.wikipedia.org/wiki/Internet_Explorer) | IE has been discontinued, but [IE 11 is still maintained](https://docs.microsoft.com/en-us/lifecycle/faq/internet-explorer-microsoft-edge). iD [polyfills](https://en.wikipedia.org/wiki/Polyfill_(programming)) modern web features for IE 11 where possible, but full support should not be expected |
| ✅ | 📱 | [iOS](https://en.wikipedia.org/wiki/IOS) browsers | All browsers on iOS (e.g. Safari, Chrome, Firefox, Edge) use the [WebKit](https://en.wikipedia.org/wiki/WebKit) engine and should thus have equivalent support |
| 🟩 | 📱 | [Android](https://en.wikipedia.org/wiki/Android_(operating_system)) browsers | Browsers on Android can use their own engines, so support may vary, but there are currently no known issues |
| 🟩 | 🌐 | Others | iD should run on any browser implementing [modern web standards](https://www.w3.org/standards/). Hardware factors such as screen size may affect usability |

[safari logo]: https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Safari_browser_logo.svg/30px-Safari_browser_logo.svg.png
[opera logo]: https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Opera_browser_logo_2013_vector.svg/30px-Opera_browser_logo_2013_vector.svg.png
[chrome logo]: https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Chrome_icon_%28September_2014%29.svg/30px-Google_Chrome_icon_%28September_2014%29.svg.png
[firefox logo]: https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Firefox_logo%2C_2019.svg/30px-Firefox_logo%2C_2019.svg.png
[edge logo]: https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Microsoft_Edge_logo_%282015%E2%80%932019%29.svg/30px-Microsoft_Edge_logo_%282015%E2%80%932019%29.svg.png
[ie logo]: https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Internet_Explorer_10%2B11_logo.svg/30px-Internet_Explorer_10%2B11_logo.svg.png


## Input Device Support

iD has traditionally assumed the mapper will be interacting via a mouse and keyboard,
but realistically people want or need to use various other [input devices](https://en.wikipedia.org/wiki/Input_device).

iD relies on modern [pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) for some interactions, so
some devices may see degraded functionality on older browsers.

### Setups

The following table lists iD's usability for different setups. A setup is where
a mapper is using only the device(s) given in the row.

A setup with "full support" offers functionality equivalent to that of the
highest-functioning setup (generally mouse and keyboard).
Certain functions may be accessed differently on different setups,
such as opening the edit menu via long-pressing instead of right-clicking.

|   | Icon | Input Setup | Notes | Issues |
|---|---|---|---|---|
| ✅ | 🖱⌨️ | [Mouse](https://en.wikipedia.org/wiki/Computer_mouse) + [keyboard](https://en.wikipedia.org/wiki/Computer_keyboard) | iD's original input paradigm. Any mouse-like device such as a [trackpad](https://en.wikipedia.org/wiki/Touchpad), [trackball](https://en.wikipedia.org/wiki/Trackball), or [pointing stick](https://en.wikipedia.org/wiki/Pointing_stick) is grouped into "mouse" for this table |
| ❌ | ⌨️   | Keyboard only | Not all elements can necessarily be keyed to. Key traps may exists. Geometry editing isn't possible |
| 🟠 | 🖱  | Mouse only | The primary [mouse button](https://en.wikipedia.org/wiki/Mouse_button) (e.g. left click) alone is sufficient. Multiselection and disabling of node-snapping aren't possible |
| 🟠 | 🖐  | [Multi-touch](https://en.wikipedia.org/wiki/Multi-touch) on a [touchscreen](https://en.wikipedia.org/wiki/Touchscreen) | Moving and rotating selections isn't possible | [#7599](https://github.com/openstreetmap/iD/issues/7599) |
| 🟠 | ✍️   | [Stylus](https://en.wikipedia.org/wiki/Stylus_(computing)) on a touchscreen | Moving and rotating selections isn't possible, nor is selecting multiple features |
| 🤷 | ✍️🔲 | Stylus on a [graphics tablet](https://en.wikipedia.org/wiki/Graphics_tablet) | |
| 🤷 | 🎮  | [Gamepad](https://en.wikipedia.org/wiki/Gamepad) | |
| 🤷 | 🗣  | [Voice](https://en.wikipedia.org/wiki/Voice_user_interface) | Tools like [Voice Control on macOS](https://support.apple.com/en-us/HT210539) and [Windows Speech Recognition](https://en.wikipedia.org/wiki/Windows_Speech_Recognition) allow navigating webpages with voice commands to some degree |
| 🤷 | 🔘  | [Switch](https://en.wikipedia.org/wiki/Switch_access) | Tools like [Switch Control on macOS](https://support.apple.com/en-us/HT202865) can theoretically replicate mouse and keyboard interactions in most apps |

### Devices

This table details iD's support for specific classes of input devices.

"Full support" for a device means that iD reasonably handles its entire range of input on supported platforms. But unlike the "Setups" table above, a given device is not necessarily expected to perform all of iD's functions.

It's impractical to ensure every single input device works as expected, so the table only reflects the support status to the best of our knowledge.

|   | Icon | Input Device | Notes | Issues |
|---|---|---|---|---|
| 🟩 | ![apple adb mouse] | Single-button [mouse](https://en.wikipedia.org/wiki/Computer_mouse) | Primary click (e.g. left-click) can be used for all pointer interactions. Long-clicking on map features opens the edit menu |
| 🟩 | ![ibm mouse] | Multi-button mouse | Secondary click (e.g. right-click) can be used on map features to open the edit menu. Middle click, etc., are not needed by iD but are passed through to the browser |
| 🟩 | [![magic mouse]](https://en.wikipedia.org/wiki/Magic_Mouse) | Multi-touch mouse | 2D scrolling in the map is treated as panning, not zooming |
| 🟠 | ![vertical scroll wheel] | Vertical [scroll wheel](https://en.wikipedia.org/wiki/Scroll_wheel) | Should zoom the map in and out | [#5550](https://github.com/openstreetmap/iD/issues/5550) | 
| ❌ |  | Horizontal scroll wheel | Currently does nothing in the map | [#7134](https://github.com/openstreetmap/iD/issues/7134) |
| 🤷 | [![apple mighty mouse]](https://en.wikipedia.org/wiki/Apple_Mighty_Mouse) | Scroll ball | Works like combined vertical/horizontal scroll wheels |
| 🟩 | 🖲 | [Trackball](https://en.wikipedia.org/wiki/Trackball) | |
| 🟩 | ![touchpad] | [Trackpad](https://en.wikipedia.org/wiki/Touchpad) | |
| 🟩 | [![macbook trackpad]](https://en.wikipedia.org/wiki/Magic_Trackpad) | Multi-touch trackpad | Pinch-to-zoom and scroll-to-pan are supported in the map |
| 🟩 | ![pointing stick] | [Pointing stick](https://en.wikipedia.org/wiki/Pointing_stick) | |
| 🟩 | ⌨️ | [Keyboard](https://en.wikipedia.org/wiki/Computer_keyboard) | Any keyboard can be used, but certain functionality may require certain keys |
| 🤷 |  | [Touch bar](https://www.imore.com/touch-bar) | Generic, browser-provided controls should be shown |
| 🟩 |  | Multi-touch screen | |
| 🟩 | ✍️ | [Stylus](https://en.wikipedia.org/wiki/Stylus_(computing)) | Works like a single touch for tapping, dragging, scrolling, etc. |
| 🤷 | 🔲 | [Graphics tablet](https://en.wikipedia.org/wiki/Graphics_tablet) | |
| 🤷 | 🎮  | [Gamepad](https://en.wikipedia.org/wiki/Gamepad) | |

[ibm mouse]: https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Myszka_IBM.jpg/40px-Myszka_IBM.jpg
[apple adb mouse]: https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Apple-ADB-mouse.jpg/70px-Apple-ADB-mouse.jpg
[apple mighty mouse]: https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Apple_Mighty_Mouse_top_viewo.jpg/35px-Apple_Mighty_Mouse_top_viewo.jpg
[vertical scroll wheel]: https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Razer_DeathAdder_2013_Edition-mouse_wheel_PNr%C2%B00405.jpg/50px-Razer_DeathAdder_2013_Edition-mouse_wheel_PNr%C2%B00405.jpg
[magic mouse]: https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Magic_Mouse.jpg/70px-Magic_Mouse.jpg
[pointing stick]: https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Mouse_pointing_stick.jpeg/70px-Mouse_pointing_stick.jpeg
[touchpad]: https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Touchpad_F3JA.jpg/70px-Touchpad_F3JA.jpg
[macbook trackpad]: https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/MacBook_Pro%27s_trackpad.JPG/70px-MacBook_Pro%27s_trackpad.JPG


## Language Support

English is the language of tags and relation roles in the OpenStreetMap database.
It's also the source language of iD's interface, meaning English is the only language
guaranteed to have 100% coverage. Despite this privileged position, English proficiency
should not be a barrier to mapping.

Most of iD's interface can be translated to essentially any written language via the Transifex
platform. Some languages have region-specific variants, such as Brazilian Portuguese (`pt_BR`).
Translators are typically volunteers. See the [translation guide](https://github.com/openstreetmap/iD/blob/develop/CONTRIBUTING.md#translating)
for more info.

|   | Localization Feature | Notes |
|---|---|---|
| ✅ | Browser language preference | iD tries to use the language set in the browser |
| ❌ | Base language fallback | E.g. if `pt_BR` is incomplete, `pt` should be tried before `en` |
| ❌ | Custom fallback language | If the preferred language is incomplete, a user-specified one should be tried before `en` (e.g. `kk` → `ru`) |
| ❌ | [`lang` HTML attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang) | Helps with text-to-speech, text formatting, and auto-transliteration, particularly when iD mixes strings from different languages |
| ✅ | Locale URL parameters | `locale` and `rtl` can be used to manually set iD's locale preferences. See the [API](API.md#url-parameters) |
| 🟩 | Right-to-left layouts | Used for languages like Hebrew and Arabic |

### Translatability

The following table details which interface elements can adapt to the mapper's
language preferences. This doesn't account for whether they've actually been
translated to one or more languages.

|   | Interface Element | Notes | Issues |
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

## Vision Accessbility

|   | Vision-Access Feature | Notes | Issues |
|---|---|---|---|
| 🤷 | [Screen reader support](https://en.wikipedia.org/wiki/Screen_reader) | | |
| 🟠 | [Browser zoom](https://support.mozilla.org/en-US/kb/accessibility-features-firefox-make-firefox-and-we#w_page-zoom) | Scrolling-to-pan the map may react oddly on some browsers | |
| 🟠 | [Text-only browser zoom](https://support.mozilla.org/en-US/kb/accessibility-features-firefox-make-firefox-and-we#w_text-zoom) | Enlarged text can overflow containers that have fixed dimensions | |
| 🟠 | [Don't rely on color alone](https://www.wuhcag.com/use-of-colour/) | Some classes of map data are indistinguishable except for their colors | |
| 🤷 | [High-contrast text colors](https://www.wuhcag.com/contrast-enhanced/) | | |
| ❌ | Dark mode | Many people find light-on-dark UIs easier to read under certain conditions | |
| ❌ | Audio feedback | This would need to be easy to disable or even disabled by default | [#5821](https://github.com/openstreetmap/iD/issues/5821) |

## Hearing Accessibility

iD itself currently has no audio, so hearing difficulties alone are not expected to impact usability.

---

_Further sections coming soon…_
