# What's New

Thanks to all our contributors, users, and the many people that make iD possible! :heart:

The iD map editor is an open source project. You can submit bug reports, help out,
or learn more by visiting our project page on GitHub:  :octocat: https://github.com/openstreetmap/iD

_Breaking changes, which may affect downstream projects or sites that embed iD, are marked with a_ :warning:

<!--
# A.B.C
##### MMM DD, YYYY

#### :newspaper: News
#### :mega: Release Highlights
#### :boom: Breaking Changes
#### :tada: New Features
#### :sparkles: Usability
#### :bug: Bugfixes
#### :earth_asia: Localization
#### :hourglass: Performance
#### :mortar_board: Walkthrough
#### :rocket: Presets

[#xxxx]: https://github.com/openstreetmap/iD/issues/xxxx
[@xxxx]: https://github.com/xxxx
-->

# 2.4.1
##### August 26, 2017

#### :bug: Bugfixes

* Write post-save count, not pre-save count to the changesets_count tag ([#4283])

[#4283]: https://github.com/openstreetmap/iD/issues/4283


# 2.4.0
##### August 25, 2017

#### :mega: Release Highlights

* :artificial_satellite: We added a **new global imagery layer**: Esri World Imagery<br/>
Thank you Esri for making your imagery available for OSM use!<br/>
_Check out the new imagery by opening the Background pane (shortcut <kbd>B</kbd>)_

#### :tada: New Features

* Updates to save workflow ([#4223]):
  * Add `review_requested` changeset tag and checkbox ([#4133], thanks [@kepta])
  * Add `source` changeset tag and multiselect field
  * Add `hashtags` changeset tag, API parameter, and auto fill hashtags from `comment` ([#2834])
  * Write changeset tags for new mappers to indicate walkthrough progress - These tags all start with `ideditor:` ([#3968])
  * Write changeset tag for `changesets_count` - it will contain `"0"` for someone making their first edit ([#3968])
  * Refactor `uiCommit` into several smaller modules
* Add `addr:unit` input to address field for many countries ([#4235], thanks [@JamesKingdom])
* Make rotation and reflection operations available for more geometry types ([#4237])
* Change raw tag editor `readOnlyTags` function to accept array of regular expressions
* `name` field is no longer automatically added to every preset ([#4200], [#4210], [#4201] thanks [@JamesKingdom])
* Field refactor ([#3914], [#4214])
  * Add options for fields, allow unwrapped fields (no label, buttons, etc)
  * `uiField` can now be used anywhere, not just inside the preset editor
  * Rename `uiPreset` -> `uiPresetEditor` (consistent with raw tag editor, raw member editor, etc)

[#4237]: https://github.com/openstreetmap/iD/issues/4237
[#4235]: https://github.com/openstreetmap/iD/issues/4235
[#4133]: https://github.com/openstreetmap/iD/issues/4133
[#4223]: https://github.com/openstreetmap/iD/issues/4223
[#4214]: https://github.com/openstreetmap/iD/issues/4214
[#4210]: https://github.com/openstreetmap/iD/issues/4210
[#4201]: https://github.com/openstreetmap/iD/issues/4201
[#4200]: https://github.com/openstreetmap/iD/issues/4200
[#3968]: https://github.com/openstreetmap/iD/issues/3968
[#3914]: https://github.com/openstreetmap/iD/issues/3914
[#2834]: https://github.com/openstreetmap/iD/issues/2834
[@kepta]: https://github.com/kepta
[@JamesKingdom]: https://github.com/JamesKingdom


#### :sparkles: Usability

* In save mode, <kbd>esc</kbd> should cancel and return to browse mode ([#4230])
* Recognize more kinds of concrete surface as "paved"
* When drawing, ignore accidental clicks on mode buttons ([#4042])
* Change to 80px arrow key panning (this matches Leaflet default) ([#4207])
* Smoother border around the round vertex preset icon circles ([#4190])
* Render railway platform slightly different from sidewalk ([#4182])
* Treat a few special tags as areas even in the absence of a proper `area=yes` tag. ([#4194])

[#4230]: https://github.com/openstreetmap/iD/issues/4230
[#4207]: https://github.com/openstreetmap/iD/issues/4207
[#4194]: https://github.com/openstreetmap/iD/issues/4194
[#4190]: https://github.com/openstreetmap/iD/issues/4190
[#4182]: https://github.com/openstreetmap/iD/issues/4182
[#4042]: https://github.com/openstreetmap/iD/issues/4042


#### :bug: Bugfixes

* Include imagery offset when calculating tiles for background layer ([#4232])
* Return to browse mode when zooming out beyond edit limit ([#4184])
* Make sure bool url params actually contain value 'true' ([#4222])

[#4232]: https://github.com/openstreetmap/iD/issues/4232
[#4222]: https://github.com/openstreetmap/iD/issues/4222
[#4184]: https://github.com/openstreetmap/iD/issues/4184


#### :earth_asia: Localization

* Update Chinese address format ([#4248], thanks [@Stenive])
* Swap placement of increment/decrement spin buttons when RTL
* Fix RTL styling for info panel close buttons
* Fix RTL styling for spin control and form buttons

[#4248]: https://github.com/openstreetmap/iD/issues/4248
[@Stenive]: https://github.com/Stenive


#### :hourglass: Performance

* Use `requestIdleCallback` in supported browsers for deferred data fetching ([#4259], thanks [@kepta])
  * Avoid reparsing duplicate entities that appear across adjacent OSM tiles
  * Schedule parsing as a low priority task
  * Schedule redraws during idle browser times

[#4259]: https://github.com/openstreetmap/iD/issues/4259
[@kepta]: https://github.com/kepta


#### :rocket: Presets

* Add signpost term to guidepost preset ([#4277], thanks [@JamesKingdom])
* Remove maxspeed field from living street ([#4260], thanks [@JamesKingdom])
* Make `office=physician` non-searchable ([#4255], thanks [@M1dgard])
* Add preset for `amenity=shower` ([#4256], thanks [@JamesKingdom])
* Add preset for `emergency=life_ring` ([#4251], thanks [@JamesKingdom])
* Allow traffic mirror preset on vertex ([#4250], thanks [@JamesKingdom])
* Add presets for many theme park attractions ([#4236], thanks [@willemarcel])
* Improve search terms for wetland preset ([#4226], thanks [@boothym])
* Add jetty search term to `amenity=pier` preset ([#4224], thanks [@boothym])
* Remove `bin=yes` from excrement bag vending machine ([#4191])
* Improve search terms for group home and social facility presets ([#4219], thanks [@JamesKingdom])
* Allow aerialway station to be drawn as an area ([#4217], thanks [@JamesKingdom])
* Improve search terms for T-bar lift ([#4217], thanks [@JamesKingdom])
* Add hedge preset to barrier category ([#4215], thanks [@Stalfur])
* Add railway presets for Derailer, Milestone, Signal, Switch, Train Wash and icons ([#4196], thanks [@JamesKingdom])
* Add railway preset for Buffer Stop, and icon ([#4192], thanks [@JamesKingdom])
* Replace generic "Reference" field with more specific named fields ([#4180], thanks [@JamesKingdom])
* Add preset for Telecom Manhole ([#4185], thanks [@JamesKingdom])

[#4277]: https://github.com/openstreetmap/iD/issues/4277
[#4260]: https://github.com/openstreetmap/iD/issues/4260
[#4255]: https://github.com/openstreetmap/iD/issues/4255
[#4256]: https://github.com/openstreetmap/iD/issues/4256
[#4251]: https://github.com/openstreetmap/iD/issues/4251
[#4250]: https://github.com/openstreetmap/iD/issues/4250
[#4236]: https://github.com/openstreetmap/iD/issues/4236
[#4226]: https://github.com/openstreetmap/iD/issues/4226
[#4224]: https://github.com/openstreetmap/iD/issues/4224
[#4219]: https://github.com/openstreetmap/iD/issues/4219
[#4217]: https://github.com/openstreetmap/iD/issues/4217
[#4215]: https://github.com/openstreetmap/iD/issues/4215
[#4196]: https://github.com/openstreetmap/iD/issues/4196
[#4192]: https://github.com/openstreetmap/iD/issues/4192
[#4191]: https://github.com/openstreetmap/iD/issues/4191
[#4185]: https://github.com/openstreetmap/iD/issues/4185
[#4180]: https://github.com/openstreetmap/iD/issues/4180

[@JamesKingdom]: https://github.com/JamesKingdom
[@M1dgard]: https://github.com/M1dgard
[@willemarcel]: https://github.com/willemarcel
[@boothym]: https://github.com/boothym
[@Stalfur]: https://github.com/Stalfur


# 2.3.2
##### July 24, 2017

#### :tada: New Features

* Display capture date on the attribution line at bottom of Mapillary viewer ([#4156])
* Highlight detected objects and signs in Mapillary images ([#3772], [#4148], thanks [@kepta])

[#4156]: https://github.com/openstreetmap/iD/issues/4156
[#4148]: https://github.com/openstreetmap/iD/issues/4148
[#3772]: https://github.com/openstreetmap/iD/issues/3772
[@kepta]: https://github.com/kepta

#### :sparkles: Usability

* Prevent user from tabbing from fields in the sidebar to the browser's address bar ([#4159])
* Distinguish between default vs. tagged `service=*` highways and railways ([#4157])
* Fix styles for several aeroway, highway, railway mapped as areas ([#4167])
* Change rendering for non-grass sport pitches (basketball, skateboard, beachvolleyball)
* Render `railway=platform` like sidewalks and footpaths
* Place pasted point at cursor (not offset) when pasting while dragging the map ([#4155])

[#4167]: https://github.com/openstreetmap/iD/issues/4167
[#4159]: https://github.com/openstreetmap/iD/issues/4159
[#4157]: https://github.com/openstreetmap/iD/issues/4157
[#4155]: https://github.com/openstreetmap/iD/issues/4155

#### :bug: Bugfixes

* Make expandable sidebar sections work with incognito mode ([#4159])
* Remember the chosen custom background when set by url ([#4162], [#4165], thanks [@pgiraud])
* Fix: <kbd>⌘⇧B</kbd> / <kbd>Ctrl+Shift+B</kbd> should not also swap the background like <kbd>⌘B</kbd> / <kbd>Ctrl+B</kbd> ([#4153])

[#4165]: https://github.com/openstreetmap/iD/issues/4165
[#4162]: https://github.com/openstreetmap/iD/issues/4162
[#4159]: https://github.com/openstreetmap/iD/issues/4159
[#4153]: https://github.com/openstreetmap/iD/issues/4153
[@pgiraud]: https://github.com/pgiraud

#### :rocket: Presets

* Add presets, icons for Wind and Nuclear `power=generator`, and `output:electricity` field
* Add presets, icons for Shinto, Taoist, Hindu, Sikh `amenity=place_of_worship` ([#4175])
* Add preset for Dog Excrement Bin, `waste=dog_excrement` ([#4172], thanks [@JamesKingdom])
* Add Clothes field to Clothing Store, Botique, Fashion ([#4149])
* Change caption for content field from "Contents" to "Content" ([#4169])
* Add presets for Windmill and Watermill ([#4168])

[#4175]: https://github.com/openstreetmap/iD/issues/4175
[#4172]: https://github.com/openstreetmap/iD/issues/4172
[#4169]: https://github.com/openstreetmap/iD/issues/4169
[#4168]: https://github.com/openstreetmap/iD/issues/4168
[#4149]: https://github.com/openstreetmap/iD/issues/4149
[@JamesKingdom]: https://github.com/JamesKingdom


# 2.3.1
##### July 11, 2017

#### :sparkles: Usability

* Display left click icon for "Place a point" on keyboard shortcuts screen

#### :bug: Bugfixes

* Don't lose the imagery offset when switching between "Custom" and another background imagery layer ([#3982])
* After splitting a way, update all matching relation members (fix for broken u-turn relations) ([#4140])

[#3982]: https://github.com/openstreetmap/iD/issues/3982
[#4140]: https://github.com/openstreetmap/iD/issues/4140


# 2.3.0
##### July 7, 2017

#### :tada: New Features

* Toggleable information panels can be used to expose more advanced features without cluttering the UI ([#4121])
  * <kbd>⌘I</kbd> / <kbd>Ctrl+I</kbd>: Toggle visibility of all info panels
  (by default, will toggle the Measurement panel)
  * <kbd>⌘⇧M</kbd> / <kbd>Ctrl+Shift+M</kbd> : Toggle Measurement Panel<br/>
  Show selected object area, length, perimeter, calculate center, etc.
  * <kbd>⌘⇧L</kbd> / <kbd>Ctrl+Shift+L</kbd> : Toggle Location Panel<br/>
  Show location coordinates ([#2183]) and reverse geocode ([#2515])
  * <kbd>⌘⇧H</kbd> / <kbd>Ctrl+Shift+H</kbd> : Toggle History Panel<br/>
  Show last edited by ([#2273]), links to user and changeset info, object history ([#3761])
  * <kbd>⌘⇧B</kbd> / <kbd>Ctrl+Shift+B</kbd> : Toggle Background Panel<br/>
  Show imagery age if available ([#2492]), and toggle tile debugging

[#4121]: https://github.com/openstreetmap/iD/issues/4121
[#3761]: https://github.com/openstreetmap/iD/issues/3761
[#2515]: https://github.com/openstreetmap/iD/issues/2515
[#2492]: https://github.com/openstreetmap/iD/issues/2492
[#2273]: https://github.com/openstreetmap/iD/issues/2273
[#2183]: https://github.com/openstreetmap/iD/issues/2183

#### :sparkles: Usability

* Improve wording of "Restore my changes" / "Discard my changes" prompt ([#4117])
* Add example and improve the text on the custom url template prompt ([#3887])
* Adjust imagery attribution colors for better visibility ([#4047])
* Show background imagery icons from [editor-layer-index](https://github.com/osmlab/editor-layer-index), upgrade Bing icon and others

[#4117]: https://github.com/openstreetmap/iD/issues/4117
[#4047]: https://github.com/openstreetmap/iD/issues/4047
[#3887]: https://github.com/openstreetmap/iD/issues/3887

#### :bug: Bugfixes

* Don't remove important tags when performing point-area merge ([#4114])
* Don't break undo/redo when performing point-area merge ([#4113])
* Fix wikidata clearing, failed lookups when feature no longer selected ([#3987], [#3684])

[#4114]: https://github.com/openstreetmap/iD/issues/4114
[#4113]: https://github.com/openstreetmap/iD/issues/4113
[#3987]: https://github.com/openstreetmap/iD/issues/3987
[#3684]: https://github.com/openstreetmap/iD/issues/3684

#### :earth_asia: Localization

* Support localization of more keyboard shortcuts ([#4081])
* Support localization of background imagery names, descriptions, and attribution text ([#4034])

[#4081]: https://github.com/openstreetmap/iD/issues/4081
[#4034]: https://github.com/openstreetmap/iD/issues/4034

#### :mortar_board: Walkthrough

* Add `walkthrough=true` url parameter to auto-start the walkthrough ([#4111])
* Mention keyboard shortcuts <kbd>?</kbd> at the end of the walkthrough ([#4107])

[#4111]: https://github.com/openstreetmap/iD/issues/4111
[#4107]: https://github.com/openstreetmap/iD/issues/4107

#### :rocket: Presets

* Allow subway entrance preset as vertex geometry (attached to a line), update terms ([#4122])
* Add presets for manholes and storm drains
* Add preset for `amenity=scrapyard` ([#3387])

[#4122]: https://github.com/openstreetmap/iD/issues/4122
[#3387]: https://github.com/openstreetmap/iD/issues/3387


# 2.2.2
##### June 12, 2017

#### :tada: New Features

* Update to Mapillary API v3, use traffic signs from Mapillary sprites ([#4050], thanks [@nickplesha])
* iD editor translation project on Transifex has moved to the [OpenStreetMap organization](https://www.transifex.com/openstreetmap/)
* New Keyboard Shortcuts help screen, press <kbd>?</kbd> to view ([#3791], [#1481], thanks [@ajithranka] and [@kepta])

[#4050]: https://github.com/openstreetmap/iD/issues/4050
[#3791]: https://github.com/openstreetmap/iD/issues/3791
[#1481]: https://github.com/openstreetmap/iD/issues/1481

[@nickplesha]: https://github.com/nickplesha
[@ajithranka]: https://github.com/ajithranka
[@kepta]: https://github.com/kepta

#### :sparkles: Usability

* Don't omit tags (e.g. `address`, `name`) when copy/pasting ([#4067])

[#4067]: https://github.com/openstreetmap/iD/issues/4067

#### :bug: Bugfixes

* Fix: Switching background while drawing a line was caused the line to get cancelled ([#4099])
* Fix: "View on osm.org" link was unclickable after uploading changes ([#4104], thanks [@tyrasd])
* Fix fullscreen shortcuts - <kbd>⌃⌘F</kbd> and <kbd>F11</kbd> on Mac, only <kbd>F11</kbd> on others ([#4081])
* Fix detection of keyboard shortcuts generated by <kbd>AltGr</kbd> key on Windows ([#4096])
* Fix for "entity not found" errors on due to Chrome bug ([#3973], thanks [@tyrasd])
* Improved keyboard shortcut key detection ([#3572], thanks [@tyrasd])
* Improved wiki documentation lookup for certain presets ([#4059])

[#4099]: https://github.com/openstreetmap/iD/issues/4099
[#4104]: https://github.com/openstreetmap/iD/issues/4104
[#4081]: https://github.com/openstreetmap/iD/issues/4081
[#4096]: https://github.com/openstreetmap/iD/issues/4096
[#3973]: https://github.com/openstreetmap/iD/issues/3973
[#3572]: https://github.com/openstreetmap/iD/issues/3572
[#4059]: https://github.com/openstreetmap/iD/issues/4059

[@tyrasd]: https://github.com/tyrasd

#### :rocket: Presets

* Add preset for `craft=distillery` ([#4085], thanks [@JamesKingdom])
* Add preset for `highway=elevator` ([#4068])
* Add preset for `craft=electronics_repair` ([#4049])
* Add preset for `shop=appliance`
* Adding "football" terms to soccer pitch ([#4052], thanks [@JamesKingdom])
* Rename "Curb Ramp" to "Curb"

[#4085]: https://github.com/openstreetmap/iD/issues/4085
[#4068]: https://github.com/openstreetmap/iD/issues/4068
[#4049]: https://github.com/openstreetmap/iD/issues/4049
[#4052]: https://github.com/openstreetmap/iD/issues/4052

[@JamesKingdom]: https://github.com/JamesKingdom


# 2.2.1
##### May 12, 2017

#### :bug: Bugfixes

* Allow right-click and contextmenu events to work on the sidebar ([#4036])
* Omit global search UI when no geocoder ([#4032], thanks [@mojodna])
* Don't replace spaces with underscores in `opening_hours` field ([#4030])

[#4036]: https://github.com/openstreetmap/iD/issues/4036
[#4030]: https://github.com/openstreetmap/iD/issues/4030
[#4032]: https://github.com/openstreetmap/iD/issues/4032

[@mojodna]: https://github.com/mojodna


# 2.2.0
##### May 9, 2017

#### :mega: Release Highlights

* :artificial_satellite: Two **new global satellite imagery layers**: DigitalGlobe Premium and DigitalGlobe Standard!<br/>
These new layers cover many parts of the world that previously had no usable imagery.<br/>
_Check out the new imagery by opening the Background pane (shortcut <kbd>B</kbd>)_

* :point_right: A new **right-click editing menu** replaces the old radial menu.<br/>
The new editing menu gives iD room to grow and won't get in the way of your editing.<br/>
_Remember: Right-click on map features to use the new menu._

* :woman_student: The **introductory walkthrough** has been completely revised, covering
more OpenStreetMap concepts and common editing tasks using the new right-click menu.
Users can explore and practice editing in the example town - now much
better mapped than before and completely localizable. Even long time iD users should give it a try!<br/>
_Replay the walkthrough from the Help pane (shortcut <kbd>H</kbd>)._

* :vertical_traffic_light: Big refresh of icons!  You'll see **a lot more icons** for
commonly mapped features.<br/>
_Map traffic signals, stop signs, benches, crossings, street lamps, fountains, towers, and many more._

* :writing_hand: You can now **see and edit changeset tags** before uploading to OpenStreetMap.

#### :tada: New Features
* Features for detecting and cleaning up old-style multipolygons
  * Add a validation warning when user creates old-style multipolygons ([#3933])
  * Render old-style multipolygons with small gaps along edge ([#3908])
  * Ignore uninteresting tags in old-style multipolygon code
* Expire saved changeset comment older than 2 days ([#3947])
* Update links to `preview.ideditor.com` mirrors ([#3912])
* Add ability for history to set named checkpoints and reset to them
* Add n-times argument to `history.pop()`
* Add type and layer subfields to `structure` radiobutton field ([#2087], [#3911])
* Add semiCombo field type for setting values in semicolon-delimited lists ([#3905])
* Allow users to add and edit changeset tags in a tag editor ([#2633], [#3898])
* Allow raw tag editor to have readonly tags (to restrict editing of certain changeset tags)
* Add "What's new in iD" notification when user sees a new version for the first time ([#1856])
* Always access OSM over https now
* Replace radial menu with a context menu ([#3671], [#3753], thanks [@kepta], [@rasagy], [@samanpwbb], [@slhh])
  * :warning: users may continue to use the radial menu by setting a flag in localStorage, but it is deprecated and will be removed eventually

[#3933]: https://github.com/openstreetmap/iD/issues/3933
[#3908]: https://github.com/openstreetmap/iD/issues/3908
[#3947]: https://github.com/openstreetmap/iD/issues/3947
[#3912]: https://github.com/openstreetmap/iD/issues/3912
[#2087]: https://github.com/openstreetmap/iD/issues/2087
[#3911]: https://github.com/openstreetmap/iD/issues/3911
[#3905]: https://github.com/openstreetmap/iD/issues/3905
[#2633]: https://github.com/openstreetmap/iD/issues/2633
[#3898]: https://github.com/openstreetmap/iD/issues/3898
[#1856]: https://github.com/openstreetmap/iD/issues/1856
[#3671]: https://github.com/openstreetmap/iD/issues/3671
[#3753]: https://github.com/openstreetmap/iD/issues/3753

[@kepta]: https://github.com/kepta
[@rasagy]: https://github.com/rasagy
[@samanpwbb]: https://github.com/samanpwbb
[@slhh]: https://github.com/slhh

#### :sparkles: Usability
* Swap position of increment/decrement buttons ([#4027], thanks [@willemarcel])
* Add ability to specify better reference lookups for presets ([#3227])
* Undo/Redo while drawing line/area should keep the user in drawing mode ([#3530])
* Make "Add field" dropdown wider ([#3993])
* Add an ellipse to resolve point ambiguity when dragging ([#3536])
* Allow all nodes and vertices to be dragged ([#3824] - revert of [#3739])
* Don't hover sidebar or vertices when alt key disables snapping
* Raw Tag Editor: Keep track of new row and keep it sorted last ([#3960])
* Smaller nudge regions in drag_node and move ([#3956])
* Draw selected items last, so halos are more visible ([#2914])
* Show tooltip for long background imagery names ([#3448])
* Fix text padding around caret in combo fields ([#3894], thanks [@51114u9])
* Prevent delete of objects when not 80% visible ([#3700])
* Added many new icons, and improve styling of vertex presets ([#3569])
* One way field now includes button to change way direction, supports -1 and 1 values ([#3060], [#3910])
* Normalize mousewheel zooming across browsers ([#3029])
* Add `utilNoAuto` to remove autocorrect/spellcheck features from inputs ([#3839])
* Show flash messages on bottom bar when user performs key shortcuts ([#1734], [#3753])

[#4027]: https://github.com/openstreetmap/iD/issues/4027
[#3227]: https://github.com/openstreetmap/iD/issues/3227
[#3530]: https://github.com/openstreetmap/iD/issues/3530
[#3993]: https://github.com/openstreetmap/iD/issues/3993
[#3536]: https://github.com/openstreetmap/iD/issues/3536
[#3824]: https://github.com/openstreetmap/iD/issues/3824
[#3739]: https://github.com/openstreetmap/iD/issues/3739
[#3960]: https://github.com/openstreetmap/iD/issues/3960
[#3956]: https://github.com/openstreetmap/iD/issues/3956
[#2914]: https://github.com/openstreetmap/iD/issues/2914
[#3448]: https://github.com/openstreetmap/iD/issues/3448
[#3894]: https://github.com/openstreetmap/iD/issues/3894
[#3700]: https://github.com/openstreetmap/iD/issues/3700
[#3569]: https://github.com/openstreetmap/iD/issues/3569
[#3060]: https://github.com/openstreetmap/iD/issues/3060
[#3910]: https://github.com/openstreetmap/iD/issues/3910
[#3029]: https://github.com/openstreetmap/iD/issues/3029
[#3839]: https://github.com/openstreetmap/iD/issues/3839
[#1734]: https://github.com/openstreetmap/iD/issues/1734
[#3753]: https://github.com/openstreetmap/iD/issues/3753

[@willemarcel]: https://github.com/willemarcel
[@51114u9]: https://github.com/51114u9

#### :bug: Bugfixes
* Fix field reference buttons ([#4008])
* Don't let window.location changes occur during draw modes ([#3996])
* Don't redo into un-annotated edit states ([#4006])
* Add `-ms-user-select` rules to prevent shift-click from extending selection on IE/Edge ([#2921])
* Fix combobox accept on click in IE11 ([#3991])
* Fix css font specification on IE11
* Limit members editor and memberships editor to 1000 entrires to prevent crash on coastlines ([#3737])
* Correct lodash `_.omit` usage ([#3965])
* Use `window.top.location` instead of `window.location` ([#3950])
* Fix wikipedia field link button ([#2024])
* Fix `dist:min` build script on Windows ([#3899], thanks [@slibby])
* Force inspector to recreate all of its content after a save ([#3844])
* Fix bug causing combo placeholders to sometimes not appear ([#3874])
* Avoid adding an unneeded `area=yes` after geometry merge, rematch preset ([#3851])
* Fix child-parent order of relations when uploading changeset to avoid server error ([#3871], [#3208], thanks [@mstn])
* Fix gitignore from ignoring new images in `/dist/img` ([#3854], thanks [@MindFreeze])

[#4008]: https://github.com/openstreetmap/iD/issues/4008
[#3996]: https://github.com/openstreetmap/iD/issues/3996
[#4006]: https://github.com/openstreetmap/iD/issues/4006
[#2921]: https://github.com/openstreetmap/iD/issues/2921
[#3991]: https://github.com/openstreetmap/iD/issues/3991
[#3737]: https://github.com/openstreetmap/iD/issues/3737
[#3965]: https://github.com/openstreetmap/iD/issues/3965
[#3950]: https://github.com/openstreetmap/iD/issues/3950
[#2024]: https://github.com/openstreetmap/iD/issues/2024
[#3899]: https://github.com/openstreetmap/iD/issues/3899
[#3844]: https://github.com/openstreetmap/iD/issues/3844
[#3874]: https://github.com/openstreetmap/iD/issues/3874
[#3851]: https://github.com/openstreetmap/iD/issues/3851
[#3871]: https://github.com/openstreetmap/iD/issues/3871
[#3208]: https://github.com/openstreetmap/iD/issues/3208
[#3854]: https://github.com/openstreetmap/iD/issues/3854

[@MindFreeze]: https://github.com/MindFreeze
[@mstn]: https://github.com/mstn
[@slibby]: https://github.com/slibby

#### :earth_asia: Localization
* Add Chinese (PRC) Address and Phone Number formats ([#4024], [#4025], thanks [@Stenive])
* Add Ukraine Address and Phone Number formats ([#3995], [#3997], thanks [@Andygol])
* Many RTL improvements throughout code
* Support Arabic vowel signs, include Thaana and Hebrew in generic RTL fix ([#3923], thanks [@mapmeld])
* Better detection of culture-specific locale in language list ([#3842])

[#4024]: https://github.com/openstreetmap/iD/issues/4024
[#4025]: https://github.com/openstreetmap/iD/issues/4025
[#3995]: https://github.com/openstreetmap/iD/issues/3995
[#3997]: https://github.com/openstreetmap/iD/issues/3997
[#3923]: https://github.com/openstreetmap/iD/issues/3923
[#3842]: https://github.com/openstreetmap/iD/issues/3842

[@Stenive]: https://github.com/Stenive
[@Andygol]: https://github.com/Andygol
[@mapmeld]: https://github.com/mapmeld

#### :hourglass: Performance
* Taginfo performance improvements ([#3955], [#3975])
* Only draw midpoints in select mode

[#3955]: https://github.com/openstreetmap/iD/issues/3955
[#3975]: https://github.com/openstreetmap/iD/issues/3975

#### :mortar_board: Walkthrough - major updates! ([#3921])
* Add training for modifiying geometry, moving nodes, reshaping ways ([#2381])
* Add training for new right-click context menu
* Allow user to freeform play and explore ([#3067])
* Refresh walkthrough data with POIs, Buildings, Addresses ([#3068])
* Add training for drawing square and circular buildings ([#3085])
* Add training for Undo ([#3680])
* Improve RTL tooltip and curtain placement ([#3925], [#2386])
* Walkthrough is now fully localizable, including addresses!
* More gentle introduction to jargon

[#3921]: https://github.com/openstreetmap/iD/issues/3921
[#2381]: https://github.com/openstreetmap/iD/issues/2381
[#3067]: https://github.com/openstreetmap/iD/issues/3067
[#3068]: https://github.com/openstreetmap/iD/issues/3068
[#3085]: https://github.com/openstreetmap/iD/issues/3085
[#3680]: https://github.com/openstreetmap/iD/issues/3680
[#3925]: https://github.com/openstreetmap/iD/issues/3925
[#2386]: https://github.com/openstreetmap/iD/issues/2386

#### :rocket: Presets
* Adjust field ordering of highway preset fields, move surface and lanes up ([#4026], thanks [@willemarcel])
* Add preset for beach volleyball pitch ([#3983])
* Make opening_hours a combo ([#974-comment])
* Don't try to force opening-hours value lookups to lowercase ([#3629])
* Add inscription field to historic presets ([#3949])
* Add pavilion preset ([#3962], thanks [@JamesKingdom])
* Add preset for club=* ([#3651])
* Add preset for place=quarter ([#3651])
* Add preset for amenity=watering_place ([#3651])
* Add presets for Animal Boarding, Animal Breeding, Animal Shelter ([#3651])
* Add preset for amenity=driving_school ([#3651])
* Add presets for shop=gas, shop=perfumery ([#3651])
* Add preset for leisure=pitch+sport=equestrian ([#3833])
* Change leisure=track preset to work for line or area, update racing sport presets ([#3890])
* Add ref and operator fields to fire hydrant preset ([#3900], thanks [@ToastHawaii])
* New support for multivalues in semicolon lists: cuisine, animal boarding, crop, produce, trees, etc.
* Adjust matchScores so Parking Lot sorts before Parking Vending Machine, Parking Space, etc.
* Add covered=* field to Drive-through preset
* Add preset for highway=speed_camera ([#3809])
* Add start_date universal field ([#3439])
* Add historic:civilization field to some historic presets ([#3439])
* Add historic=tomb preset and tomb=* field ([#3439])
* Add service_times field to all amenity=place_of_worship presets ([#3439])
* Add service:vehicle:* multiselect to shop=car and shop=car_repair ([#3535])
* Add preset for leisure=pitch+sport=cricket, leisure=pitch+sport=table_tennis ([#3864])
* Add preset for railway=tram_stop ([#3677])
* Add communication types multiselect to man_made=mast preset ([#3630])
* Add preset for landuse=railway ([#3853])
* Add preset for landuse=harbour ([#3653])

[#4026]: https://github.com/openstreetmap/iD/issues/4026
[#3983]: https://github.com/openstreetmap/iD/issues/3983
[#974-comment]: https://github.com/openstreetmap/iD/issues/974#issuecomment-296665907
[#3629]: https://github.com/openstreetmap/iD/issues/3629
[#3949]: https://github.com/openstreetmap/iD/issues/3949
[#3962]: https://github.com/openstreetmap/iD/issues/3962
[#3651]: https://github.com/openstreetmap/iD/issues/3651
[#3833]: https://github.com/openstreetmap/iD/issues/3833
[#3890]: https://github.com/openstreetmap/iD/issues/3890
[#3900]: https://github.com/openstreetmap/iD/issues/3900
[#3809]: https://github.com/openstreetmap/iD/issues/3809
[#3439]: https://github.com/openstreetmap/iD/issues/3439
[#3535]: https://github.com/openstreetmap/iD/issues/3535
[#3864]: https://github.com/openstreetmap/iD/issues/3864
[#3677]: https://github.com/openstreetmap/iD/issues/3677
[#3630]: https://github.com/openstreetmap/iD/issues/3630
[#3853]: https://github.com/openstreetmap/iD/issues/3853
[#3653]: https://github.com/openstreetmap/iD/issues/3653

[@willemarcel]: https://github.com/willemarcel
[@ToastHawaii]: https://github.com/ToastHawaii
[@JamesKingdom]: https://github.com/JamesKingdom


# 2.1.3
##### Feb 24, 2017

#### :bug: Bugfixes
* Check all blacklist regexs in API imagery blacklist ([#3858], thanks [@tyrasd])
* Remove autocorrect/spellcheck features from inputs ([#3839])
* Better detection of culture-specific locale in language list ([#3842])

[#3858]: https://github.com/openstreetmap/iD/issues/3858
[#3839]: https://github.com/openstreetmap/iD/issues/3839
[#3842]: https://github.com/openstreetmap/iD/issues/3842

[@tyrasd]: https://github.com/tyrasd

#### :rocket: Presets
* Adjust aeroway runway, taxiway, apron styles for visibility ([#3845])
* Add preset for landuse=aquaculture ([#3849], thanks [@willemarcel])
* Update UK/IE placeholders ([#3837], thanks [@boothym])
* Add social_facility=nursing_home preset

[#3845]: https://github.com/openstreetmap/iD/issues/3845
[#3849]: https://github.com/openstreetmap/iD/issues/3849
[#3837]: https://github.com/openstreetmap/iD/issues/3837

[@willemarcel]: https://github.com/willemarcel
[@boothym]: https://github.com/boothym


# 2.1.2
##### Feb 7, 2017

#### :bug: Bugfixes
* Fix point dragging regression ([#3829])

[#3829]: https://github.com/openstreetmap/iD/issues/3829


# 2.1.1
##### Feb 6, 2017

#### :bug: Bugfixes
* Fix issues with dragging sibling nodes of a selected way ([#3824])
* Fix map centering for custom KML and GeoJSON layers ([#3826], thanks [@tyrasd])
* Fix regression in GPX layer loading from URL ([#3820], thanks [@tyrasd])

[#3824]: https://github.com/openstreetmap/iD/issues/3824
[#3826]: https://github.com/openstreetmap/iD/issues/3826
[#3820]: https://github.com/openstreetmap/iD/issues/3820

[@tyrasd]: https://github.com/tyrasd

#### :rocket: Presets
* Add presets NoExit, Watch Shop, add Living Street to Road category ([#3821], thanks [@willemarcel])

[#3821]: https://github.com/openstreetmap/iD/issues/3821

[@willemarcel]: https://github.com/willemarcel


# 2.1.0
##### Feb 4, 2017

#### :tada: New Features
* Add KML and GeoJSON support to GPX layer ([#3811], thanks [@mertemin])
* Add language debugging mode that shows translation keys ([#3755])
* Upgrade to MapillaryJS viewer v2.4
* Add ability to restart ui and change locale on the fly ([#3764], thanks [@kepta])
* Upgrade to latest maki icons ([#3024], [#3756], thanks [@ajithranka])
  * Includes icon for tourism information objects ([#3573])
  * Includes icon for subway_entrance ([#3255])
* Support replacing the geocoder service ([#3754], thanks [@kepta])
  * :warning: `iD.services.nominatim` is now `iD.services.geocoder`
* Support smoothly transitioned actions ([#3659])
* Add Reflect Long / Reflect Short operations ([#3555], [#3375], thanks [@Psigio])
* Improved address field customization, allow country-specific placeholders ([#3643], thanks [@Natsuyasumi])

[#3811]: https://github.com/openstreetmap/iD/issues/3811
[#3755]: https://github.com/openstreetmap/iD/issues/3755
[#3764]: https://github.com/openstreetmap/iD/issues/3764
[#3024]: https://github.com/openstreetmap/iD/issues/3024
[#3756]: https://github.com/openstreetmap/iD/issues/3756
[#3573]: https://github.com/openstreetmap/iD/issues/3573
[#3255]: https://github.com/openstreetmap/iD/issues/3255
[#3754]: https://github.com/openstreetmap/iD/issues/3754
[#3659]: https://github.com/openstreetmap/iD/issues/3659
[#3555]: https://github.com/openstreetmap/iD/issues/3555
[#3375]: https://github.com/openstreetmap/iD/issues/3375
[#3643]: https://github.com/openstreetmap/iD/issues/3643

[@mertemin]: https://github.com/mertemin
[@kepta]: https://github.com/kepta
[@ajithranka]: https://github.com/ajithranka
[@Psigio]: https://github.com/Psigio
[@Natsuyasumi]: https://github.com/Natsuyasumi

#### :sparkles: Usability
* Warn if user creates an untagged relation ([#3812])
* Improve save flow so user knows there is more to do after clicking Save ([#3777], [#2378])
  * Desaturate the map, to call attention to upload pane
  * Don't show two save buttons, rename one to Upload
  * Show icon with the Save button
* Warn if user creates an unconneted highway ([#3786])
* Draw slightly larger circles for unconneted vertices ([#3775])
* Use 'pt' wiki pages in 'pt-BR' iD localization ([#3776])
* User must select nodes before dragging them ([#3739], thanks [@edpop])

[#3812]: https://github.com/openstreetmap/iD/issues/3812
[#3777]: https://github.com/openstreetmap/iD/issues/3777
[#2378]: https://github.com/openstreetmap/iD/issues/2378
[#3786]: https://github.com/openstreetmap/iD/issues/3786
[#3775]: https://github.com/openstreetmap/iD/issues/3775
[#3776]: https://github.com/openstreetmap/iD/issues/3776
[#3739]: https://github.com/openstreetmap/iD/issues/3739

[@edpop]: https://github.com/edpop

#### :bug: Bugfixes
* Improve tests for line joins in walkthrough ([#3695])
* Fix country code lookup / address,phone fields on IE11 (Object.assign issue)
* Show "You have unsaved changes" message also in save mode ([#3788], thanks [@tyrasd])
* Eliminate duplicates from commit message dropdown ([#3759], thanks [@Abbe98])
* Don't create extra combobox caret divs in the address field ([#3715])
* Fix issue with mouse coordinates while dragging and nudging/zooming ([#3594])
* Fix for lasso behavior missing mouseup event ([#3800])
* Fix spinner position when UI is RTL ([#3794])
* Don't write history while user is in draw_line/draw_way, etc. ([#3750])
* Don't show radial menu when selecting entity from member/membership editor
* More checks to prevent duplicate consecutive nodes ([#3676], [#1296], thanks [@slhh])
* Fix RTL languages along linestring paths on Chrome and Safari ([#3707], thanks [@miladkdz])
* When merging node to area, preserve original node if possible ([#3683])
* Allow double-clicking on midpoints to create vertex ([#3687], thanks [@edpop])
* Don't jump cursor to end of line when editing housenumber ([#3650])

[#3695]: https://github.com/openstreetmap/iD/issues/3695
[#3788]: https://github.com/openstreetmap/iD/issues/3788
[#3759]: https://github.com/openstreetmap/iD/issues/3759
[#3715]: https://github.com/openstreetmap/iD/issues/3715
[#3594]: https://github.com/openstreetmap/iD/issues/3594
[#3800]: https://github.com/openstreetmap/iD/issues/3800
[#3794]: https://github.com/openstreetmap/iD/issues/3794
[#3750]: https://github.com/openstreetmap/iD/issues/3750
[#3676]: https://github.com/openstreetmap/iD/issues/3676
[#1296]: https://github.com/openstreetmap/iD/issues/1296
[#3707]: https://github.com/openstreetmap/iD/issues/3707
[#3683]: https://github.com/openstreetmap/iD/issues/3683
[#3687]: https://github.com/openstreetmap/iD/issues/3687
[#3650]: https://github.com/openstreetmap/iD/issues/3650

[@tyrasd]: https://github.com/tyrasd
[@Abbe98]: https://github.com/Abbe98
[@slhh]: https://github.com/slhh
[@miladkdz]: https://github.com/miladkdz
[@edpop]: https://github.com/edpop

#### :hourglass: Performance
* Use the same ids for temporary nodes and ways created in draw modes ([#1369])

[#1369]: https://github.com/openstreetmap/iD/issues/1369

#### :rocket: Presets
* Add Notary preset ([#3813], thanks [@Zverik])
* Add additional aerialway presets ([#3733], thanks [@ajithranka])
* Add natural features category ([#2843], thanks [@ajithranka])
* Add step_count field to Steps preset ([#3740], thanks [@boothym])
* Add universal email and fax fields ([#3735], thanks [@M1dgard])
* Show tracktype as first field for Track preset ([#3718])
* Add preset for place=square ([#3658])
* Add preset for leisure=horse_riding ([#3619])
* Add presets for barrier=toll_booth, barrier=border_control ([#3719])
* Improve Social Facility presets ([#3702])
* Improve military presets ([#3663])
* Add presets for natural Bare Rock, Ridge, Sand ([#3646])
* Add outdoor_seating checkbox ([#3730], thanks [@mertemin])
* Improve Turkish address scheme ([#3729], thanks [@mertemin])
* Prefer office=coworking over amenity=coworking_space ([#3714], thanks [@iandees])
* Improve Japanese address scheme ([#3712], thanks [@Natsuyasumi])
* Add fire_hydrant:position field to presets ([#3708], thanks [@wopfel])
* Add Castle Type field to Castle preset ([#3685], thanks [@abdeldjalil09])
* Add Taiwan phone format ([#3655], thanks [@Supaplextw])

[#3813]: https://github.com/openstreetmap/iD/issues/3813
[#3733]: https://github.com/openstreetmap/iD/issues/3733
[#2843]: https://github.com/openstreetmap/iD/issues/2843
[#3740]: https://github.com/openstreetmap/iD/issues/3740
[#3735]: https://github.com/openstreetmap/iD/issues/3735
[#3718]: https://github.com/openstreetmap/iD/issues/3718
[#3658]: https://github.com/openstreetmap/iD/issues/3658
[#3619]: https://github.com/openstreetmap/iD/issues/3619
[#3719]: https://github.com/openstreetmap/iD/issues/3719
[#3702]: https://github.com/openstreetmap/iD/issues/3702
[#3663]: https://github.com/openstreetmap/iD/issues/3663
[#3646]: https://github.com/openstreetmap/iD/issues/3646
[#3730]: https://github.com/openstreetmap/iD/issues/3730
[#3729]: https://github.com/openstreetmap/iD/issues/3729
[#3714]: https://github.com/openstreetmap/iD/issues/3714
[#3712]: https://github.com/openstreetmap/iD/issues/3712
[#3708]: https://github.com/openstreetmap/iD/issues/3708
[#3685]: https://github.com/openstreetmap/iD/issues/3685
[#3655]: https://github.com/openstreetmap/iD/issues/3655

[@Zverik]: https://github.com/Zverik
[@ajithranka]: https://github.com/ajithranka
[@boothym]: https://github.com/boothym
[@M1dgard]: https://github.com/M1dgard
[@mertemin]: https://github.com/mertemin
[@iandees]: https://github.com/iandees
[@Natsuyasumi]: https://github.com/Natsuyasumi
[@wopfel]: https://github.com/wopfel
[@abdeldjalil09]: https://github.com/abdeldjalil09


# 2.0.2
##### Dec 22, 2016

#### :tada: New Features
* Pull LTR/RTL list from Transifex instead of hardcoding it ([#3489])
* Refocus map and selectedIDs on undo/redo ([#2204])
* Display labels for vertices ([#2709])

[#3489]: https://github.com/openstreetmap/iD/issues/3489
[#2204]: https://github.com/openstreetmap/iD/issues/2204
[#2709]: https://github.com/openstreetmap/iD/issues/2709

#### :bug: Bugfixes
* Update imageryBlacklists function to use blacklists from OSM API ([#3623])
* Better checks for invalid ids in Select mode ([#3640])
* Unable to toggle oneway=yes on highways ([#3638])
* Hide labels along selected ways or near selected vertices ([#3636])
* Windows/Chrome bug: missing mouseup was getting users stuck and unable to select features ([#2151])
* Fix map moving with middle mouse click ([#3612])

[#3623]: https://github.com/openstreetmap/iD/issues/3623
[#3640]: https://github.com/openstreetmap/iD/issues/3640
[#3638]: https://github.com/openstreetmap/iD/issues/3638
[#3636]: https://github.com/openstreetmap/iD/issues/3636
[#2151]: https://github.com/openstreetmap/iD/issues/2151
[#3612]: https://github.com/openstreetmap/iD/issues/3612

#### :rocket: Presets
* Add Waterfall Preset ([#3608])
* Adjust matchscores so that barrier doesn't take priority over other features ([#3647])
* Add Public Bath Preset ([#3642], thanks [@Natsuyasumi])
* Remove "Covered" field from Bus Stop preset ([#3627])
* Add surveillance and camera related presets ([#3599], thanks [@bkil])
* Add amenity=food_court and amenity=crematorium ([#3621], thanks [@samely])
* Add maxheight field and add it to many highway presets ([#3605])
* Add fence and wall type fields, add height field to some barriers ([#3602])
* Add presets for Aquarium, Resort, Dance Hall ([#3579])
* Add Internet Access fields to many presets ([#3568], thanks [@bkil])
* Add highway=traffic_mirror preset ([#3568], thanks [@bkil])
* Improvements to Mast/Tower presets ([#3561], thanks [@bkil])

[#3608]: https://github.com/openstreetmap/iD/issues/3608
[#3647]: https://github.com/openstreetmap/iD/issues/3647
[#3642]: https://github.com/openstreetmap/iD/issues/3642
[#3627]: https://github.com/openstreetmap/iD/issues/3627
[#3599]: https://github.com/openstreetmap/iD/issues/3599
[#3621]: https://github.com/openstreetmap/iD/issues/3621
[#3605]: https://github.com/openstreetmap/iD/issues/3605
[#3602]: https://github.com/openstreetmap/iD/issues/3602
[#3579]: https://github.com/openstreetmap/iD/issues/3579
[#3568]: https://github.com/openstreetmap/iD/issues/3568
[#3568]: https://github.com/openstreetmap/iD/issues/3568
[#3561]: https://github.com/openstreetmap/iD/issues/3561

[@Natsuyasumi]: https://github.com/Natsuyasumi
[@bkil]: https://github.com/bkil
[@samely]: https://github.com/samely


# 2.0.1
##### Nov 17, 2016

#### :bug: Bugfixes
* When starting iD with an object selected, the map should focus on that object ([#3588], thanks [@tyrasd])
* Fix for "Best" imagery not being automatically selected ([#3586])

[#3588]: https://github.com/openstreetmap/iD/issues/3588
[#3586]: https://github.com/openstreetmap/iD/issues/3586

[@tyrasd]: https://github.com/tyrasd

#### :hourglass: Performance
* Adjust max Mapillary pages fetched per zoom, adjust min viewfield zoom


# 2.0.0
##### Nov 15, 2016

#### :boom: Breaking Changes
* :warning: iD is now written in a modular code style using ES6 `import`/`export` and [rollup.js](http://rollupjs.org/) as a build tool (#3118, #3179, #3180)
  * Many thanks to @tmcw, @kepta, @tyrasd, @beaugunderson, @davidchouse
* :warning: Flattened namespace means that all functions have changed names (#3479)
  * e.g. `iD.actions.Move` -> `iD.actionMove`, `iD.geo.Extent` -> `iD.geoExtent`
  * Many deprecated names are still exported as symbols, e.g. `iD.Context` - we will remove these eventually
* :warning: Customized iD deployments can manipulate live objects, rather than iD.Context accessors
  * No longer need to call things like `presets()`, `imagery()`, `taginfo()` when creating `iD.Context`
  * See [API.md](https://github.com/openstreetmap/iD/blob/master/API.md#customized-deployments) for details on customized deployments
* :warning: iD has upgraded to the latest released versions of d3, lodash, rbush, etc.
  * d3 no longer adds itself to the global namespace, but can now be accessed via `iD.d3`
* :warning: iD now uses `npm` scripts for all build processes
  * iD requires Node v4 or higher, but does not require `make` anymore
  * Update install instructions and prerequisites (#3466, thanks @tyrasd)
* :warning: iD url hash map order has changed to `zoom/latitude/longitude` to match OSM and others (#3554)
* :warning: Authentication methods like `context.preauth`, `connection.switch`, `iD.uiSourceSwitch.keys` options have changed
  * `url` option has been renamed to `urlroot`

#### :tada: New Features
* `ui()` initializer now accepts a callback that will be called when loadLocale is finished (#3550)
* Vertex keyboard navigation (#1917, #3539)
  * `[` or `pageup` - jump to previous vertex
  * `]` or `pagedown` - jump to next vertex
  * `⌘[` or `home` - jump to first vertex
  * `⌘]` or `end` - jump to last vertex
  * `\` or `pause-break` - select next parent, if at intersection
* OSM API calls are now authenticated for logged in users (helps with (#3519, #2262)
* When reversing a way, reverse tags on its child nodes (#3076, thanks @Psigio)
* Allow user to click an 'X' to remove an item from the selection list (#2950, thanks @ebrelsford)
* Bundled Mapillary JS plugin upgraded to v2.0 (#3496)
* Allow `Del` key as a without modifier as a Delete shortcut (#3455)

#### :bug: Bugfixes
* Prevent imagery offset nudging buttons from getting stuck if user clicks again (#3576)
* Don't include terms for non-searchable presets in translation source (#3323)
* Let user know if the documentation points to a redirect page (#3337)
* Fix line labeling placement for IE11, Edge (#3020)
* Better label placement, use smaller collision boxes (#1645)
* Allow "network", "genus", "taxon", "species" taginfo lookups to expect uppercase values (#3377)
* Fix way disappearing due to invalid "layer" tag (#3405, thanks @edpop)
* Add radix parameter for all `parseInt` calls (#3399, thanks @HolgerJeromin)
* Don't limit movement of vertex that combines two endpoints (#2731)
* Don't use checks in walkthrough navigation (#3247)
* Default Wikipedia language field to user's language, not English (#3265)

#### :earth_asia: Localization
* Address field improvements - eliminate duplicates, more dropdowns for address fields (#3553)
* Support Right to Left interface for some languages 'ar', 'fa', 'iw', 'dv' (#3007, #3087, thanks @mapmeld)
* Remove diacritics (accented chars) when doing fuzzy searches (#3159)

#### :hourglass: Performance
* Clip area polygons and clippaths to padded viewport (#3529)
* Throttled redrawing (#3360, thanks @guillaume)
* Use fewer steps for interpolated breathe behavior (#2911)

#### :rocket: Presets
* Add Construction and Tower Type fields to Mast and Tower presets (#3561, thanks @bkil)
* Add Turning Loop (Island) preset, adjust icons for traversable/nontraversable features (#3557)
* Add Internet Cafe preset (#3559)
* Improve styling of Farmyards (#3556, thanks @Thue)
* Add Guest Apartment / Condo preset (#3548)
* Add Waste Transfer preset (#3387)
* Add Billboard preset (#3386)
* Improve traffic calming presets (#3218)
* Improve waste and recycling presets (#2689)
* Rename Camp Site to Campground, and add preset for individual camp pitches (#3385)
* Multiselect field for Bike Shop services (#3517, thanks @willemarcel)
* Add presets for Nail Salon, Tanning Salon (#3516, thanks @skorasaurus)
* Split golf water_hazard presets into separate line and area presets (#3483)
* Update terms lists for Anime preset (#3478, thanks @mbrickn)
* Add Pastry Shop preset (#3444, thanks @Dgleish)
* Add maxspeed field to Railway preset (#3458, thanks @boothym)
* Add E-Cigarette Shop preset (#3457, thanks @boothym)
* Add capacity field to Charging Station preset (#3458, thanks @boothym)
* Add Pumping Station preset (#3384, thanks @kepta)
* Improve Railway crossing presets (#3395, thanks @boothym)
* Improve Gym and Sports Center presets (#3352, thanks @boothym)
* Add Coworking Space preset (#3381, thanks @willemarcel)
* Add access_simple field for Basketball, Tennis, Garden presets (#3336, thanks @Psigio)
* Add icon to fire hydrant preset (#3380, thanks @bagage)
* Add Yoga Studio preset (#3352, thanks @Psigio)
* Add Bowling Green preset (#3363, thanks @boothym)
* Add more fields ("support", "display", "visibility", "date") to Clock preset (#3318, thanks @HolgerJeromin)
* Add more values to the speed limit field (#3316, thanks @1ec5)
* Add network combo field for route relations (#3302, thanks @1ec5)
* Add Blood Donor Center preset (#3285, thanks @M1dgard)
* Add indoor yes/no field for Defibrillator preset (#3284, thanks @M1dgard)
* Add Miniature Golf preset (#3279, thanks @boothym)
* Add second_hand field for shop=car preset (#3274, thanks @skorasaurus)
* Add Planetarium preset (#3268, thanks @willemarcel)
* Add Ice Cream Shop preset (#3253, thanks @ankit-m)
* Add Taiwan address format to Address field (#3261, thanks @david082321)


# 1.9.7
##### Jul 16, 2016
* Treat features on `addr:interpolation` lines as points, not vertices (#3241)
* Add ref field to `amenity=post_box` preset (#3232, thanks @boothym)
* Fix crash calling `_.all` when moving multiple features (#3155, thanks @tyrasd)
* Add `emergency=defibrillator` preset (#3202, thanks @ramyaragupathy)
* Add `man_made=bridge` preset (#3183, thanks @SatyaSudheer)
* Switch from `sloped_curb=*` to `kerb=*` (#3210)
* Rename "Chemist" preset label to "Drugstore" for en_US (#3201)
* Exclude imagery sources more than 20 years old (#3190)
* Add `highway=give_way` preset for yield signs
* Add stars, rooms, internet access fee fields for hotel presets (#3144, thanks @homersimpsons)
* Add stop type, direction forward/backward fields for stop sign preset (#3115, thanks @homersimpsons)
* When setting form's background color also set field color (#3100 thanks @jonnybarnes)
* Add sidewalk preset to Path presets category (#3181, thanks @willemarcel)
* Fix mph/kph imperial units test in maxspeed (#3156)
* Fix d3 bug causing map to translate far away when zooming under heavy load (#2773, thanks @kepta)


# 1.9.6
##### Jun 7, 2016
* Embed interactive Mapillary JS viewer instead of static image (#3128, thanks @kepta, @peterneubauer)
* Add "grill" as search term for `amenity=bbq` preset (#3139, thanks @manfredbrandl)
* When setting Wikipedia value, also set corresponding Wikidata tag (#2732, thanks @1ec5)


# 1.9.5
##### May 25, 2016
* Clean translated combo value when comparing to display value (#3129)
* Change color of Save button as user edits increase (#2749, thanks @tanerochris)
* Migrate to lodash v4 (#3107, thanks @kepta)
* Don't try to snap new ways to offscreen areas (#3114)
* Prevent keypress handlers from being called extra times (#3111)
* Add spacebar click for efficient way drawing (#2784, thanks @brandonreavis)
* Rename `barrier=ditch` preset to "Trench", leave `waterway=ditch` preset as "Ditch"
* Use prison icon for gate-like barriers, roadblock icon for other barriers
* Add Barrier category: wall, fence, ditch (#2344, thanks @Wikiwide)
* Add slight fill to the area icon (#3109)
* Localize phone placeholder for country being edited (#3084, thanks @dobratzp)
* Clicking on scale bar will toggle units from imperial/metric (#2351)
* Use ⌘B for quick background switching, add tooltip, style (#2854, thanks @RoPP)
* Fix greediness of autocompletion (#3077, #3106, thanks @kepta)
* Add preset for `route=horse` relations (#3057, thanks @kepta)
* Keep "move" cursor while adjusting imagery offset (#3101)
* Move generic Building preset to top of Building category list (#3102)
* Update Wikipedia list (#3098, thanks @1ec5)


# 1.9.4
##### May 3, 2016
* Fix bug causing save button to remain disabled even when changeset comment is entered (#3096)
* Support setting imagery offset via url hash parameter (#3093)
* Don't allow user to straighten a line if start/end nodes are at the same location (#2792)
* Add `fee` and `bin` fields to some presets (#2872)
* Add multiCombo field type selecting multiple items from a list (#3034, #3080, thanks @kepta)
  * Support `payment:` tagging, add to vending machine presets (#2872)
  * Support `currency:` tagging, add to vending machine, money exchange, ATM presets (#2872)
  * Support `fuel:` tagging, add to fuel station presets (#1987)
  * Support `recycling:` tagging, add to recycling presets (#2873)
* Improve tabbing and keyboard navigation in the entity editor
* Exclude `name` tag when validating whether a feature has tags (#3091)
* Add taginfo typeahead behavior to combo fields (#3089)
* Lower popularity thresholds for taginfo lookups
* Support looking up languages by English or local names (#3023, thanks @mapmeld)


# 1.9.3
##### Apr 25, 2016
* Display "Choose language" placeholder value for Wikipedia language field (#3071)
* Add prison preset (#3070, thanks @kepta)
* Improve `studio=*` tagging (#3061, thanks @kepta)
* Dedupe relations with same calculated name so they will appear in relation picker (#2891)
* Modal Dialog and Save/Restore improvements (#3036)
* Use case sensitive combo for changeset autocompletion (#3039)
* Add a warning to the changeset page if a user mentions Google (#3063, thanks @tmcw)
* Fix bug when manually assigning a role to a relation member (#2739)
* Imagery offset control now allows dragging or typing to adjust offsets (#1340, thanks @kepta)
* Support terrain imagery backgrounds: Stamen Terrain, Thunderforest Landscape
* Don't fetch overlay tiles or Mapillary data around Null Island (#2751)
* Show values as hover tooltips when field is too narrow to display full value (#3054)
* Don't clean fields (trim whitespace) on every input event (#3045)
* Improve usability of Save and Cancel buttons (#3040)
* Close seams in imagery tiles (#3053)
* Improve instructions for building on Windows (#2574)
* Add Code of Conduct (#3051)
* Add nutrition supplements store preset (#3043)
* Add coffee shop preset (#3042)


# 1.9.2
##### Mar 18, 2016
* Avoid jumpiness when dragging node markers (#3003)
* Rename "Dock" -> "Wet Dock / Dry Dock" (#3030)
* Refresh lables when switching to a new GPX file (#3032)
* Fix bug where adding a space to a name would undo a previous edit (#3035)
* Display GPX tracks immediately when loaded or toggled (#3027)
* Include "Local GPX" in imagery used list when GPX loaded via url parameter (#2804)
* Add Bird Hide preset (#3026)
* Exclude from areaKeys blacklist presets that are point/vertex only (#3009)
* Return to browse mode and block ui while geolocating (#3016)
* Restore highway=unclassified to thick line rendering and rename as "Minor/Unclassified Road" (#3015)
* Allow drawing of freeform shapes when using the shift-click-drag lasso selection tool (#2937, thanks @kepta)
* Rename "Major Roads" -> "Traffic Roads", "Minor Roads" -> "Service Roads" in feature filter list


# 1.9.1
##### Mar 3, 2016
* Add context.asset for building asset filenames, use for Mapillary Traffico files (#3011)
* Fix crash in starting tutorial, bad selector for .layer-background opacity (#3010)


# 1.9.0
##### Mar 1, 2016
* Fix rendering of modified/moved multipolygons (#3008)
* Preserve connectivity when pasting (#2584, thanks @jfirebaugh)
* Fix rendering of bumpy surfaces in turn restriction editor (#3004)
* Draw radial menu on top of data layers (#2994)
* Move data layers out of `iD.Background` (#3001)
* Disambiguate art store, art gallery, etc. (#2999, thanks @harry-wood)
* Post office should have opening_hours instead collection_times (#2996, thanks @HolgerJeromin)
* Improved abandoned/disused railway icons (#2967, thanks @kepta)
* Use access=yes instead of access=public for toilets (#2576, thanks @gileri)
* Rename "Track" -> "Unmaintained Track Road" and add terms (#2982, thanks @brianreavis)
* Mapillary improvements
  * Add support for street signs layer (#2720)
  * Show Mapillary thumbnail on opposite side of map from marker (#2775)
  * Fetch all available Mapillary data, but cull based on density (#2794)
  * Display Mapillary data out to zoom level 12 (#2468, #2675)
  * Add ability to remove/disable Mapillary layers (#2722)
* Add expansion arrows to category presets for better usability (#2972, thanks @kepta)
* Refactor services into iD.services namespace
  * :warning: This means that `iD.taginfo` is now `iD.serviceTaginfo`
* Disallow disconnecting that would damage relations (#1714, thanks @jfirebaugh)
* Allow escape to cancel ⌘-V paste (#2889)
* Enter should accept input and return to browse mode only on preset input fields (#2912, #2957, #2380)
* No need to make FAQ link translatable (#2973)
* Display star for "best" imagery, add link to imagery info (#2902, thanks @kepta)
* Use HTTPS for Nominatim and other services if available (#2960, thanks @kepta)
* Add `shop=storage_rental` preset (#2943, thanks @kepta)
* Add site relation preset (#2930, thanks @kepta)
* Improvements to swimming pool, water park presets (#2927, thanks @kepta)
* Ensure that boundary relation members look like boundaries (thanks, @jfirebaugh)
* Add 'building' combo field for ice rink and swim facility
* Building field should be combo not typeCombo (because `building=yes` is a valid tag)
* Link to wiki for guidance on good changeset comments (#2923, thanks @kepta)
* Make preset fields section collapsable (#2894)
* Make sure DrawLine mode is called with a clean pre-operation graph (#2303, thanks @tyrasd)
* Default to user's language when localizing names (#2882, thanks @kepta)
* Autocomplete changeset comments from previous changeset comments (#2002, thanks @jfirebaugh)
* Add universal multiline text field for description, fixme (#1518)
* Fix crash when selecting a category preset with enter button
* Remove overly agressive regexes for cleaning up websites and emails (#2892, thanks @kepta)
* Correct typo "Platic" -> "Plastic" (#2925, thanks @M1dgard)
* Rename "Unclassified Road" to "Minor Road" (#2916)


# 1.8.5
##### Jan 18, 2016
* Fix address field to not lose focus while typing (#2903, #2320)
* Bugfixes for Internet Explorer (classList #2909, parentElement #2910)
* Presets for various man_made tags (#2893, thanks @manfredbrandl)


# 1.8.4
##### Jan 6, 2016
* Block UI, disable draws while fetching missing childnodes when user restores saved work
* Add iD.Map#redrawEnable to enable/disable redraws
* Don't select filtered hidden vertices with the lasso
* Adjust matching rules for multipolygon members (#2887)
* Add Diaper Changing field to amenity toilets (#2890, thanks @morray)
* Add rendering for tag-crossing pedestrian crosswalks
* Fix rendering of highway=pedestrian, highway=crossing preset icon
* Waterway presets - dock, boatyard, water point (#2863, thanks @arunasank)
* Amenity presets - hunting stand, parking space, ferry terminal (#2883, thanks @arunasank)
* More search terms for several amenity presets (#2880)
* Disambiguate shop=bicycle and amenity=bicycle_repair_station presets (#2845)
* Cancel debounced history saves in flush() and clearSaved()
* Cancel throttled hash updates in hash.off()
* Several fixes for "Entity Not Found" errors (#2736)
* Don't call childNodes unless necessary (avoid extra _childNodes caching)
* Clear search results pane when changing modes
* Center map on feature when selecting feature from search results
* Suppress radial menu when selecting feature from search results
* Rename doctor.json -> doctors.json (#2869)
* Add Breathe behavior for colorblind-friendly interpolated select halos (#1814)
* Many usability improvements to entity editor sidebar:
  * In Taginfo results sort keys with ':' below keys without ':' (#2376)
  * Add back button for feature type reselection (#2453)
  * Return should accept input and return to browse mode (#2380)
  * Enable save as soon as user starts typing (#2342)
  * Change feature editor close X to check mark (#2384)
* Many improvements to the intro walkthrough:
  * Prevent most keyboard shortcuts during walkthrough
  * Prevent user from editing during pause before restarting failed task
  * Shrink introGraph (#1336)
  * Localize some of the features in the walkthrough (#2881)
  * Add search task to walkthrough (#2363)
  * Add button images to walkthrough text (#2404)
  * Better save blocking in intro (#1795)
  * Display Help button in walkthrough, stay on it longer (#2364)
* Set 'Content-Type': 'text/xml' when closing changeset (fix for IE auth warning) (#2874)


# 1.8.3
##### Dec 11, 2015
* Replace nonstandard Array `find` with `_.find` for IE11 (#2871)


# 1.8.2
##### Dec 10, 2015
* Better save and restore map state when entering walkthrough
* Add maxstay field for amenity=parking preset (#2851)
* Add presets for popular vending machines (#2827, thanks @henningvs)
* Fix turn restriction rendering under Firefox (#2860)
* Handle situation when user closes oauth dialog window (#2858)
* Don't set `building=yes` for `amenity=fuel` preset (#2857)
* Eliminate rounding causing jumpiness and loss of precision (#2849)


# 1.8.1
##### Dec 2, 2015
* Fix tag help lookup (#2844)
* Support Internet Explorer 11 and Edge browsers (#2571)
* New road styling for bumpy/unpaved roads (#2564, #2750, #2847)
* Disambiguate building/office presets (#2793, #2799)
* Add handrail field to steps preset (#2815)
* Choose "best" imagery by default (#2826)
* Fix language detection when `navigator.languages` is empty (#2838) (thanks @jleedev)
* Support multiple overlays and fix alignment of minimap (#2813) (thanks @brianreavis)


# 1.8.0
##### Nov 7, 2015
* Don't update the urlhash during the walkthrough (#1795)
* Add surface type to parking preset (#2816)
* Make 100% background brightness the default (#2824)
* Use SVG for preset and feature icons (#2785)
  * :warning: Projects that have customized the icon spritesheet may need to upgrade their custom icons
* Add "Help Translate" icon next to "Report a Bug" (#2766)
* Update highway colors to match openstreetmap-carto (#2764)
* Prefer suggested capitalization in autocomplete box (#2791)
* Better support for browser language preferences (#2810) (Thanks @kriscarle)
* Disallow joining ways with conflicting tags (#2358) (Thanks @jfirebaugh)
* Add rugby union and rugby league presets (#2808) (Thanks @bagage)
* Add military presets (#2177) (Thanks @arunasank)
* Discard yh:WIDTH tags (#2806)
* Fetch proper tag references for relation types (#2797) (Thanks @tyrasd)
* Proper perimeter calculation in infobox (#2789)
* Fix bug creating points at edge of screen when panning (#2758)
* Add motorcycle parking preset (#2787)
* Better autocomplete suggestions in taginfo-sourced dropdowns (#2748)
* Add traffic signal type preset
* Fix bug where pressing '1' triggered fullscreen (#2786)
* Improvements to translated preset terms (#2777, #2756) (Thanks @bagage)
* Disable save button when changeset comment is empty (#1488)
* Better handling of multilingual `alt_name`, `old_name`, etc (#2658)
* Add preset for Semi-Detached House (#2776)

# 1.7.5
##### Sep 28, 2015
* Relicense iD with ISC license


# 1.7.4
##### Sep 15, 2015
* Show docs for the selected value in raw tag editor (#2754) (Thanks @M1dgard)
* Improve display of implied values in access UI field (#2763)
* Better handling of preset search terms (#2756) (Thanks @M1dgard)
* Support cross-browser fullscreen display mode with F11 / ⌘⇧F (#2755) (Thanks @PaulAnnekov)
* Fix performance issue with multipolygon outer test (#2755)
* Change caption "Access" -> "Allowed Access" (#2761)
* Fix broken link and other help improvements (#2760)
* Fix bug with displaying label when centroid undefined (#2757) (Thanks @tyrasd)
* Replace close 'X' with Cancel button on save panel (#2378)
* Add `recycling:glass_bottles`, `recycling:plastic` (#2730)
* Add preset for `leisure=bowling_alley` (#2734)
* Render `highway=road` differently from `highway=unclassified` (#2742)
* Improve rendering of `highway=track` - dashed casing now more visible on dark backgrounds (#657)
* Change `highway=path` rendering to be more like `highway=footway` to avoid new user errors (#2327)
* Prevent users from accidentally adding `highway=yes` (#2744)
* Better styling for ephemeral tags (e.g. razed/abandoned/construction/proposed) (#2740, #1893)
* Add `bicycle=dismount` access option (#2726)
* Add support for Irish postcodes in address field (#2729) (Thanks @rory)
* Add "Road Surface" preset for `area:highway=*` (#2627)
* Add presets for Casino and Adult Gaming Center (#2684)
* Restore complete list of `address:` keys for address UI field (#2698)
* Preset searching should consider tag values (#2719)
* Add `highway=corridor` preset and universal `level` field for indoor mapping (#2687, #2218)
* Use space key to toggle radial menu (#2706)
* Add presets (`volcano`, `saddle`, `adit`, `tree_row`, `plant_nursery`) (Thanks @jmespadero)
* Use HTTPS if location protocol is HTTPS in `iD.Connection` (#2681) (Thanks @frewsxcv)
* Don't write unsavable changes to `localStorage` (#2705)
* Add recycling_type preset field (#2689) (Thanks @ebrelsford)
* Fast zoom and pan with Cmd/Control modifier key (#2691) (Thanks @rowanhogan)
* Improve handling of Wikipedia URLs (#2694) (Thanks @1ec5)
* Add minimap toggle to background menu, show GPX layer in minimap (#2693) (Thanks @rowanhogan)
* Add cycleway UI field for highways with bike lanes (#2686) (Thanks @ebrelsford)
* Improve appearance of Mapillary markers (#2690) (Thanks @pgiraud)


# 1.7.3
##### Jun 10, 2015
* Add fee field to toilet preset (#2639) (Thanks @alexandrz)
* Several improvements for more reliable save and post-save data fetch (#2667)
* Use locale passed in from container iframe instead of detected locale (#2672)
* Allow html entities in translated documentation titles (#2674)
* Add presets for `man_made=storage_tank` and `man_made=silo` (#2662)
* Add presets for RV/Marine toilet disposal and related fields (#2623)
* Add preset for `waterway=fuel` (#2589)
* Add preset for `amenity=biergarten` (#2641)
* Infobox for distance/area measurement and more info, hotkey Cmd-I (#2573)
* Fallback to 'en-US' when no language detected (#2650)
* Don't clean description/note/fixme values (#2659)
* Only urlencode tag values that start with http (#2657)
* Remove `platform` and `browser` from changeset tags (#2643)
* Clip oneway markers to viewport (#2638)
* Performance improvements for iD.Difference
* Fix error restoring changes after deleting a node (#2637)


# 1.7.2
##### May 3, 2015
* Fix for 404 Error caused by duplicates in multi-fetch node request (#2626)
* Fix oil well preset (#2621) (Thanks @1ec5)


# 1.7.1
##### Apr 30, 2015
* Add oil well preset (#2618) (Thanks @1ec5)
* Add radio mast preset (#2613) (Thanks @1ec5)
* Don't commit empty changesets (#1483)
* Add place=farm preset (#2604) (Thanks @Stalfur)
* Cleanup strings for website and email tags (#2323)
* Use semicolon-space as separator for opening_hours tags (#2301)
* Clear cached userDetails when auth events occur (#2588)
* New styling for barriers (#2592)
* In wireframe mode, draw all points (#2591)
* Invert background opacity widget display values (#2595)
* Save custom background imagery layer to localstorage (#2566)
* Better introductory help text (#2504) (Thanks @hkirat)
* Smarter way movement - avoid zorroing connected ways (#2516, #729)
* Add basic browser and platform info to changeset tags (#2559, #2449)
* Add drive_through preset to fast_food, atm, etc (#2459) (Thanks @brianegge)
* Use combo not checkbox for building field (#2553)
* Fix bug with copy/paste when originals are deleted (#2557)
* Tag motorway_link with explicit oneway=yes (#2555)
* Map-In-Map locator (toggle with '/' key) (#2554)
* Add service field for railways (#2552)
* Feature filtering: don't match multipolygon lines as 'Others' (#2548)
* Add network=* tag to public transport presets (#2549) (Thanks @gileri)
* Add incline field for highway=steps preset (#2456)
* Support node v0.12 (#2535)
* Resolve editing conflicts before saving (#2525, #1053)
* Don't delete ways from route, boundary, multipolygon relations (#2526, #1461) (Thanks @systemed)


# 1.7.0
##### Feb 12, 2015
* Fix typo in smoothness field - should be "impassable" (#2523)
* Update to Mapillary API v2 calls (#2522) (Thanks @peterneubauer)
* Add Rounded tooltips (#2521) (Thanks @samanpwbb)
* Add gender field to amenity=toilets preset (#2422)
* Update landuse presets (no single nodes, and better descriptions) (#2518)
* Update tree and forest presets to use leaf_type and leaf_cycle fields (#2512)
* Add shop=houseware preset (#2509)
* Make "Yes" and "No" translatable (#2286)
* Fix group home preset (#2510)
* Add amenity=grit_bin preset (#2500)
* Prevent user from zooming out too far when drawing (#2499)
* Add amenity=bicycle_repair_station preset (#2497)
* Add leisure=nature_reserve preset (#2496)
* Support copy and paste of selected features with ⌘-C/⌘-V (#642)
* Add amenity=public_bookcase preset (#2507) (Thanks @guillaumep)
* Add substation type field (#2486)
* Add junction=yes preset (#2484)
* Add takeaway and delivery fields to food presets (#2483)
* Add levels field to building=commercial preset (#2454)
* Add amenity=register_office preset (#2431)
* Add landuse=garages preset (#2430)
* Add natural=cave_entrance preset (#2412)
* Add amenity=fast_food preset (#2446)
* Switch to landuse=farmland as preferred Farm preset (#2478)
* Add bench and covered fields to bus stop preset (#2451)
* Replace icon fields with dropdown (#2433)
* Add Map Data panel
  * Data Layers (GPX, Mapillary)
  * Area filling options (full, partial, wireframe) (#813)
  * Map Features filtering (#1299, #1871, #2033)
* Allow customization of presets, imagery, and taginfo
  * :warning: These _must_ be set when creating an`iD()` object - see `index.html` example


# 1.6.2
##### Oct 24, 2014
* Fix "TypeError: r is undefined" (#2421)


# 1.6.1
##### Oct 23, 2014
* Remember raw tag editor expansion state across sessions (#2416)
* Translate text in changes section on save panel (#2417)
* Encode URL hash correctly (#2406)
* Capture ⌘-S even in input fields (#2409)
* Added some traffic_calming=* presets
* Prefer power=substation to sub_station
* Include state/province in U.S. and Canadian address formats
* Improve the error message on saving when offline (#2373)


# 1.6.0
##### Oct 6, 2014
* Add network field to Road Route relation preset (#2372)
* Updated TIGER layer to use TIGER 2014
* Added support for street-level imagery from Mapillary
* Added support for taginfo projects data
* Better infer restriction for no_u_turn (#2345)
* Update to rbush 1.3.3
* Improved a variety of presets
* Added `comment` url param to prefill changeset comment (#2311)


# 1.5.4
##### Jul 29, 2014
* Do not fully fill certain landuse values, e.g. landuse=residential (#542)
* Class midpoints to match parent way and adjust styles
* Test visibility of gpx coords instead of just comparing extents


# 1.5.3
##### Jul 25, 2014
* When adding gpx, only rezoom map if gpx not in viewport (#2297)
* Workaround for Chrome crash (#2295)
* Add mtb fields (#2244)
* Support option strings for combo fields (#2296)
* Render triangular midpoints to show direction of any selected way (#2292)


# 1.5.2
##### Jul 15, 2014
* Fixed Chrome/Windows selection bug (#2151)
* Don't automatically tag motorways, etc. as oneway=yes
* Disable Move and Rotate operations if area < 80% contained in the viewport


# 1.5.1
##### Jul 10, 2014
* Fix mixed content errors on https osm.org (#2281)
* Fix suggested access values for parking (#2280)


# 1.5.0
##### Jul 8, 2014
* Add support for localized address fields (#2246)
* Rendering improvements for layers (#2250)
* Add a map scale (#2266)
* Fix preset buttons (#2247)
* Better midpoint rendering (#2257)


# 1.4.0
##### May 29, 2014
* Ensure combobox menus are closed on blur (#2207)
* Limit imagery_used tag to 255 characters (#2181)
* Simplify and fix midpoint drawing logic (#2136)
* Prefer more specific 'Crosswalk' preset over generic 'Crossing'
* Add amenity=dojo preset
* Correctly trim whitespace in semicolon-separated multivalues (#2236)
* oneway fields now show "Assumed to be No" or "Assumed to be Yes" instead of "Unknown" (#2220)
* Add turn restriction editor


# 1.3.10
##### May 21, 2014
* `oneway=no` overrides implicit oneways on junction=roundabout, etc. (#2220)
* Add presets for fords, parking_entrance, charging_station, compressed_air, churchyard, shop=wine
* Improve access placeholders (#2221)
* Trim tag keys, and prevent duplicate tag keys (#2043)
* Fix inline tag help for fields that handle multiple tags
* Add 'width', 'length', 'lit' for appropriate presets (cycleways, sidewalks, sports pitch, etc)
* Render embarkment/cutting with dashed casing
* Rendering fixes for buildings, tunnels
* Add population field for various place presets
* Improvements to circularize action (#2194)
* Building field is yes/no (fixes #2111)
* Area fill colors in preset icons match map fill colors
* Add fill style for landuse=military


# 1.3.9
##### Apr 9, 2014
* Prevent closed areas from invalid disconnection (#2178)
* Remove layer field from waterway=stream
* Add preset for place=suburb and shop=seafood
* Remember last custom tile layer (#2094)
* Mapbox Satellite now supports z17-z19


# 1.3.8
##### Mar 28, 2014
* Disable circularize and orthogonalize operations when way is <80% contained in the viewport
* Add place=neighbourhood preset
* Add denomination=* field for cemetary, graveyard, funeral home
* Add preset for shop=funeral_directors
* Add icon for public_transport=stop_position
* Support quartile scheme for any imagery source (#2112)
* Zoom to GPX after adding (#2144)
* Correctly update UI after choosing GPX file (#2144)
* Add preset for leisure=ice_rink
* Add picnic area stuff: firepit, picnic_table, bbq
* Add 35 as an option in the maxspeed dropdown
* Add religion to cemetery preset (#2164)
* Fix tag reference layout on FF (#2159)
* Add "crop" field for landuse=farm/farmland/farmyard (#2149)
* Add "trees" field for landuse=orchard
* Add landuse=landfill
* Add the hoops=* field to the basketball preset (#1984)
* Add amenity=nightclub
* Add smoking field for many presets under amenity, building, office, tourism (#1990)
* barrier=fence shouldn't be an area (fixes #2158)
* Remove building_area from hospital, school, kindergarden
* Fix recycling field keys (#2140)


# 1.3.7
##### Feb 25, 2014
* Added building presets
* Improve how tags are merged when merging to a multipolygon
* Disable merge operation if at least one relation is incomplete
* Add shop=bookmaker, shop=lottery, and shop=art presets
* Use https URLs where supported
* Fix duplicate/missing objects after restoring data from localStorage
* Remove addr:housename field from address preset


# 1.3.6
##### Feb 5, 2014
* More protection against relation loops (#2096)
* Fix freeze when using Clinic preset (#2102)
* Allow rotating closed multipolygon members (#1718)
* Bump threshold for Orthogonalize to 12 degrees
* Added social_facility presets (#2109)


# 1.3.5
##### Jan 8, 2014
* Smoother and faster panning, zooming, and tooltips
* Fix bug relating to deleted nodes outside the viewport (#2085)
* Ensure "New Relation..." is always available (#2066)
* Add area=yes when necessary (#2069)
* Suppress radial menu when clicking warning (#2035)
* Protect against relation loops (#2072)
* Correct arrow direction on drawn segment (#2078)
* Don't upload tags with empty values (#1894)
* Add support for ids and locations as search input (#2056)
* Sort relation suggestions most recent first (#2052)
* Fix for Safari selection bug in combo box (#2051)
* Fix midpoint missing after undoing split (#2040)
* Don't remove addr:housenumber when changing address preset (#2047)
* Many preset additions: clock, rest area, service area, veterinary, funiculars, narrow gauge railways,
  gauge field, electrified field, tunnel field, crafts, doctor, dentist, clinic, studio, aerialways,
  and pistes.


# 1.3.4
##### Nov 26, 2013
* Replace TIGER 2012 layer with next-generation TIGER 2013 layer (#2010)
* Add tooltips to "untagged feature" warnings
* Add pressets and category for golf features (#2013)
* Information and bike parking preset refinements
* Faster/smoother zooming and panning
* Add "quick add" presets for common proper names
* Fix zoom to feature when clicking search results (#2023)


# 1.3.3
##### Nov 22, 2013
* Support for loading GPX-files via url parameter (#1965)
* Update osm-auth (#1904)
* Update 3rd party dependencies (Lo-Dash, D3, RBush)
* Build iD.Way.areaKeys from presets
* Add public_transport, military, emankment presets
* Reverse cardinal directions for relation member roles
* Improved warning visibility (#1973)
* Fix undo-related bug (#1978)


# 1.3.2
##### Nov 14, 2013
* Update maki
* Fix Disconnect of way with multiple intersections (#1955)
* Fix unclosed area rendering (#1958)
* Add presets for amenity=shelter, footway=sidewalk, footway=crossing, and various office values
* Add area categories
* Full-height background settings pane
* Add suggestions of common shop and amenity names
* Handle https wikipedia URLs
* Use assumed values for access placeholders (#1924)
* Distinguish between power=line and power=minor_line
* Reset invalid opacity values to default (#1923)


# 1.3.1
##### Oct 26, 2013
* Fix misalignment -> Fix alignment (#1913)
* Update maki (#1916)
* Prioritize boundary tag to minimize area fills (#1920)
* Fix background defaulting to 0% brightness (#1923)


# 1.3.0
##### Oct 24, 2013
* Fix corner case that could cause getting stuck in drag mode (#1910)
* Improved display of changed objects in save screen
* Improved performance
* Show attribution for overlay layers (#1909)
* Add OpenStreetMap GPS traces layer
* Show a list of multiple selected features in the sidebar
* Autocomplete city and postcode values (#1753)
* Add a button to trigger file browser for GPX (#1758)
* Prevent 'zoom in to edit' from showing up during save success (#1792)
* Add delete button to all forms (#1492)
* Omit non-OSM features from search results (#1890)
* Add additional check to prevent snapping to area fills (#1887)
* Fix adding localized value before name (#1797)
* Disable removing incomplete relation members (#1768)
* Show all combobox entries when clicking the caret (#1755)
* Improvements and fixes to the behavior of multilingual name fields
* Don't show combobox menu with only one item
* Don't prevent following an existing way when drawing (#1430)
* Allow "yes" and "no" check values to be translated (#1819)
* Treat a sole area=yes tag as "untagged" (#1867)
* Special case 'yes' values for type fields (#1876)
* Don't add addr:housenumber=yes when applying Address preset (#1874)
* Ensure preset fields are consistently ordered (#1876)
* Preserve existing Wikipedia language (#1868)
* Don't allow dragging of the map when the click starts in a button (#1869)
* Prefer to render highway=* styles over railway=* (#1880)
* Workaround cosmetic issues caused by a Chrome regression (#1879)
* New presets: man_made=observation, shop=locksmith, leisure=common and more


# 1.2.1
##### Sep 30, 2013
* Split only the line of a node shared by a line and an area
* Handle multipolygon corner case when splitting (#1799)
* Don't automatically apply building tags to shop=car (#1813)
* Don't suggest adding a relation to itself (#1820)
* Fix restoring changes when something is selected (#1857)
* Use generic access value as placeholder (#1780)
* Filter on combobox value, not title (#1836)
* Show relation documentation for relation presets (#1862)
* Limit squaring to near square or near straight nodes (#1733)
* More clever splitting of closed ways
* Improve circularize action
* Add more tags to areas list


# 1.2.0
##### Sep 26, 2013
* Don't auto-save intro tutorial edits (#1745, #1795)
* Added waypoint display to GPX layer
* Added "Straighten" operation
* Improve "Orthogonalize" behavior, rename to "Square"
* Add and improve many presets
* Save commit messages on blur (#1783)
* Add KSJ2 tags to discard list (#1794)
* Fix display of labels with wide characters
* Catch localStorage quota exception (#1807)
* Avoid consecutive identical nodes when adding a midpoint (#1296)
* Stop nudge when exiting move mode (#1766)
* Add "Continue" operation
* Delete relations that become empty (#465, #1454)
* Support polygon imagery bounds (#768)
* Pull imagery from editor-imagery-index
* Insert areas in sorted order (#1693)
* Fix some walkthrough glitches (#1744)


# 1.1.6
##### Aug 24, 2013
* Fix walkthrough on Firefox (#1743)
* Fix icon at end of walkthough (#1740)
* Fix walkthrough (#1739)


# 1.1.5
##### Aug 23, 2013
* Add amenity=ranger_station preset (1723)
* Add terms for tourism=artwork (#1726)
* Reduce prominence of share links, add G+
* Default wildcard tag values to "yes" (#1715)
* Add help topic on relations (#1708)
* Add default "Locator Overlay" layer (#1301)
* Refine toilet preset (#1697)
* Change delete shortcut to ⌘⌫/Ctrl-Backspace (#1698)
* Fix close button event binding in save dialog (#1713)
* Fix error when deleting a triangle vertex (#1712)
* Add support for an externally provided asset map (#1699)


# 1.1.4
##### Aug 17, 2013
* Fix adding multilingual name (#1694)
* Fix social buttons (#1690)
* Work around a Firefox bug that sometimes caused elements to be unselectable or stuck dragging (#1691, #1692)


# 1.1.3
##### Aug 15, 2013
* Fix behavior of enter key in name field (#1681)
* Remove area=yes when choosing an area preset (#1684)
* Save history more frequently (#1345)
* Fix combobox menu scroll bar behavior (#963)
* After editing, give a sense when map is updated (#1660)
* Clarify undo/redo tooltips (#1670)
* Add emergency=fire_hydrant preset (#1674)
* Refine power=generator preset (#1675)
* Add leisure=track preset (#1683)


# 1.1.2
##### Aug 12, 2013
* Fix cursor offset when clicking/dragging after resizing the window (#1678)
* Include low-frequency tag values if they have a wiki entry
* Fix tag value suggestions in preset comboboxes (#1679, #1680)


# 1.1.1
##### Aug 9, 2013
* Improve performance when drawing
* Tail should appear only first time
* Fix radial menu tooltip positioning on Firefox


# 1.1.0
##### Aug 9, 2013
* Fix radial menu tooltip positioning


# 1.1.0rc1
* Custom layers support TMS-flipped Y coordinate with {ty} replacement.
* Allow to join more than two ways (#649)
* Many preset additions and improvements
* Fix Japanese language input (#1594)
* Prevent merging over restriction relations (#1512)
* Support multiple overlay layers
* Fix name field for suffixed ISO 639-1 codes (#1628)
* Add ability to create a new relation (#1576)
* Permit translating all preset term lists (#1633)
* Include GPX and overlay layers in imagery_used (#1463)
* Move sidebar to left, map controls to right
* Rework search UI and consolidate with geocoder
* More dramatic different between hover and active edit feature pane


# 1.1.0beta1
* Performance improvements
* Added a UI for multilingual name tags
* "Report a bug" in footer is now an icon
* New style for radio buttons and check boxes
* Incomplete relations can no longer be deleted (previously, attempting to do so would generate a JS error)
* Render bridge casing for bridge=viaduct, etc. (#1500)
* Only draw intersections for {high,water,rail,aero}way lines (#1471)
* Improve tag reference loading feedback (#1262)
* Added relation presets
* Display relation members and memberships in inspector
* The sidebar is now persistent, rather than sliding in and out
* The feature being hovered over is previewed in the sidebar
* Zoom to feature only if map parameter isn't also specified
* Don't zoom too far in (>z20) (#1511)
* Don't zoom too far out (<z16). (#1522)
* Added the ability to create multipolygons
* Fix URL template host rotation
* Fix strokes sometimes being clipped as polygons (#1527)
* Refine selection behavior when dragging a node:
  * Preserve the sidebar state (#1401)
  * Show vertices of selected way (#1478)
  * Reselect exact previous selection when finished
* Fix one way marker rendering (#1534)
* You can now click the preset icon to return to the preset list
* All preset fields now have placeholders
* The save dialog now appears in the sidebar
* Added Address preset (#1524)
* Shorten "Zoom in" text, don't hide it on narrow screens (#1477)
* Fix "View on OSM" in sidebar footer (#1473)
* When deleting a vertex, reselect another vertex if possible (#1457)
* The sidebar now has a searchable Feature List (#1545)
* You can add a member to a relation via the "All relations" section of the sidebar

# 1.0.1
##### May 10, 2013
* Test, imagery, translation, and preset updates
* Fix untranslatable strings
* Prefer to keep existing ways when joining
* Fix creating intersecting ways and cope with 0 and 1 node ways
* Fix IE detection in `dist`
* Fix GPX track display
* Fixes for Opera compatibility
* Update `osm-auth` to 0.2.1
* Fix the `note` functionality and textarea UI in presets
* Fix walkthrough translation issues

