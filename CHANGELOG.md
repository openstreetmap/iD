# What's New

Thanks to all our contributors, users, and the many people that make iD possible! :heart:

The iD map editor is an open source project. You can submit bug reports, help out,
or learn more by visiting our project page on GitHub:  :octocat: https://github.com/openstreetmap/iD

If you love iD, please star our project on GitHub to show your support! :star:

_Breaking changes, which may affect downstream projects or sites that embed iD, are marked with a_ :warning:

<!--
# A.B.C
##### YYYY-MMM-DD

#### :newspaper: News
#### :mega: Release Highlights
#### :boom: Breaking Changes
#### :tada: New Features
#### :sparkles: Usability
#### :white_check_mark: Validation
#### :bug: Bugfixes
#### :earth_asia: Localization
#### :hourglass: Performance
#### :mortar_board: Walkthrough / Help
#### :rocket: Presets

[#xxxx]: https://github.com/openstreetmap/iD/issues/xxxx
[@xxxx]: https://github.com/xxxx
-->

# 2.17.2
##### 2020-Feb-14

#### :tada: New Features
* Restore Maxar Imagery layers, using masked iD-specific connection keys ([#7355])

[#7355]: https://github.com/openstreetmap/iD/issues/7355


# 2.17.1
##### 2020-Jan-16

#### :boom: Breaking Changes
* Remove support for Node 8 (Node 10 or higher is now required)
  * :warning: If you are building the iD project, you may need to upgrade your node version.

#### :tada: New Features
* Enable drag-and-drop reordering in fields that allow multiple values ([#5728], [#7024], thanks [@TAQ2])

[#5728]: https://github.com/openstreetmap/iD/issues/5728
[#7024]: https://github.com/openstreetmap/iD/issues/7024

[@TAQ2]: https://github.com/TAQ2

#### :sparkles: Usability
* Don't show very low-usage tag values as field suggestions ([#7203])
* Use a lighter font weight for brand subtitles
* Don't autofocus the tag text editor when selecting a feature with the "Add fields" section closed ([#6685])

[#7203]: https://github.com/openstreetmap/iD/issues/7203
[#6685]: https://github.com/openstreetmap/iD/issues/6685

#### :white_check_mark: Validation
* Account for the type and angle of crossings when setting the length of bridge and tunnel fixes
* Don't join intersection nodes to bridge and tunnel fixes, where possible ([#7202])
* Don't flag blank names as mistaken ([#7153])
* Flag crossing and one-way issues for features with `waterway=tidal_channel`
* Deprecate various `building:levels` mistags ([#7212])
* Deprecate `clothes=second_hand`
* Deprecate various entrance, gambling, museum type, gender, operator type, and pump mistags
* Fix upgrade path of `railway=*` + `disused=yes` or `abandoned=yes` ([#7236])
* Don't offer to add `train=yes` to generic `railway=platform` features ([#7231])
* Offer to add `public_transport=stop_position` and `tram=yes` to `railway=tram_stop` features
* Make Churchyard preset unsearchable

[#7153]: https://github.com/openstreetmap/iD/issues/7153
[#7202]: https://github.com/openstreetmap/iD/issues/7202
[#7212]: https://github.com/openstreetmap/iD/issues/7212
[#7236]: https://github.com/openstreetmap/iD/issues/7236
[#7231]: https://github.com/openstreetmap/iD/issues/7231

#### :bug: Bugfixes
* Fix issue where validation warnings could appear unexpectedly ([#7166])

[#7166]: https://github.com/openstreetmap/iD/issues/7166

#### :earth_asia: Localization
* Add Peruvian address and phone number formats ([#7159], thanks [@sguinetti])
* Add Australian phone number format ([#7160], thanks [@tastrax])
* Correctly display labels with mixed Arabic and Latin characters ([#7104], [#7182], thanks [@mapmeld])
* Make privacy policy link text translatable ([#7171])
* Differentiate the "toggle issues pane" and "toggle preferences pane" hotkeys in the German localization ([#7181])

[#7159]: https://github.com/openstreetmap/iD/issues/7159
[#7160]: https://github.com/openstreetmap/iD/issues/7160
[#7104]: https://github.com/openstreetmap/iD/issues/7104
[#7182]: https://github.com/openstreetmap/iD/issues/7182
[#7171]: https://github.com/openstreetmap/iD/issues/7171
[#7181]: https://github.com/openstreetmap/iD/issues/7181

[@sguinetti]: https://github.com/sguinetti
[@tastrax]: https://github.com/tastrax
[@mapmeld]: https://github.com/mapmeld

#### :rocket: Presets
* Add Door Shop preset ([#7192], thanks [@hikemaniac])
* Add Emergency Landing Site preset ([#7237], thanks [@andrewharvey])
* Add Historic Building preset ([#7219])
* Add Swing Gate preset ([#7208])
* Add Tidal Channel preset ([#7232])
* Add Gambling Hall preset ([#7198])
* Add Secondhand Clothing Store preset ([#7164])
* Add Public Prosecutor's Office preset ([#7225])
* Add Speed Limit Enforcement preset ([#7234])
* Add presets: Emergency Exit, Geyser, Used Car Dealership, Wedding Clothes Store, Backcountry Camping Area, Group Camping Area, History Museum, Wind Farm, Solar Farm, Nuclear Power Plant, Hydroelectric Power Station, Coal-Fired Power Plant, Gas-Fired Power Plant
* Rename "Anime Shop" to "Anime / Manga Shop" ([#7223])
* Simplify the names of various Piste presets
* Update Arts & Crafts Store icon ([#7228])
* Update Dressmaker icon ([#7229])
* Update Water Well icon ([#7170])
* Update Butcher icon ([#7216])
* Update preset icons: Cathedral Building, Church Building, College Building, Hospital Building, Hotel Building, Preschool / Kindergarten Building, Mosque Building, School Building, University Building, Recently Demolished Building, Residential Area, Apartment Complex, Water Tap, Island, Islet, Kiosk, Fireworks Store, Row Houses, Houseboat, Tailor, Sewing Supply Shop, Aerialway Pylon, Mixed Lift, Drag Lift, Platter Lift, J-Bar Lift, T-Bar Lift
* Add Baby Nursing Area field ([#7152])
* Add Bicycle-Pedestrian Separation field to Cycle & Foot Path ([#7204], thanks [@hikemaniac])
* Add Wheelchair Access field to Entrance / Exit ([#7214])
* Add Bottle Filling field to Drinking Water
* Add Games field to gambling presets
* Add Hot Water field to Shower
* Add Type field to Museum
* Add Backcountry, Dogs, Groups Only, Hours, Showers, Stars, and Toilets fields to Campground ([#7169])
* Add Adjacent Walking Nodes and Adjacent Cycling Nodes fields to Recreational Network Node ([#7176])
* Add descriptive options for the Pump field
* Show the Website field by default on Restaurants ([#7226])
* Show the Hours field by default on Pharmacy Counters ([#7220])

[#7237]: https://github.com/openstreetmap/iD/issues/7237
[#7234]: https://github.com/openstreetmap/iD/issues/7234
[#7192]: https://github.com/openstreetmap/iD/issues/7192
[#7219]: https://github.com/openstreetmap/iD/issues/7219
[#7208]: https://github.com/openstreetmap/iD/issues/7208
[#7232]: https://github.com/openstreetmap/iD/issues/7232
[#7198]: https://github.com/openstreetmap/iD/issues/7198
[#7164]: https://github.com/openstreetmap/iD/issues/7164
[#7225]: https://github.com/openstreetmap/iD/issues/7225
[#7223]: https://github.com/openstreetmap/iD/issues/7223
[#7228]: https://github.com/openstreetmap/iD/issues/7228
[#7229]: https://github.com/openstreetmap/iD/issues/7229
[#7170]: https://github.com/openstreetmap/iD/issues/7170
[#7216]: https://github.com/openstreetmap/iD/issues/7216
[#7152]: https://github.com/openstreetmap/iD/issues/7152
[#7204]: https://github.com/openstreetmap/iD/issues/7204
[#7214]: https://github.com/openstreetmap/iD/issues/7214
[#7169]: https://github.com/openstreetmap/iD/issues/7169
[#7176]: https://github.com/openstreetmap/iD/issues/7176
[#7226]: https://github.com/openstreetmap/iD/issues/7226
[#7220]: https://github.com/openstreetmap/iD/issues/7220

[@hikemaniac]: https://github.com/hikemaniac
[@andrewharvey]: https://github.com/andrewharvey

# 2.17.0
##### 2019-Dec-23

#### :newspaper: News
* We've launched the [iD Blog](https://ideditor.blog) providing news and insights into the project from its maintainers and contributors ([#7045])

[#7045]: https://github.com/openstreetmap/iD/issues/7045

#### :mega: Release Highlights
* :metro: You can now add bridges and tunnels with a single click to fix crossing roads, rails, and waterways. Thanks to [@CarycaKatarzyna] for working on this!<br/>
_Find the "Add a bridge" and "Add a tunnel" fixes for each crossing in the Issues inspector._
* :earth_africa: Selected features now stay visible while zoomed out, plus you can zoom to multiple features together.<br/>
_Select a few large features and press <kbd>Z</kbd> to view their full extent, no matter how vast._
* :handshake: iD now has its own [Privacy Policy](https://github.com/openstreetmap/iD/blob/master/PRIVACY.md).<br/>
_Press <kbd>P</kbd> to view privacy preferences._

#### :boom: Breaking Changes
* Remove Maxar imagery layers due to [announced suspension of service](https://www.openstreetmap.org/user/@kevin_bullock/diary/391652)

#### :tada: New Features
* Display selected features at any zoom level ([#2962], [#5001])
* Add Privacy Policy and ability to opt-out of icons loaded from third-party sites ([#7040])

[#2962]: https://github.com/openstreetmap/iD/issues/2962
[#5001]: https://github.com/openstreetmap/iD/issues/5001
[#7040]: https://github.com/openstreetmap/iD/issues/7040

#### :sparkles: Usability
* Support squaring multiple selected features at the same time ([#6565])
* Support zooming to multiple selected features together with the <kbd>Z</kbd> shortcut ([#6696])
* Highlight the members of selected relations in yellow ([#5766])
* Return feature search results from all downloaded data, not just the visible area ([#6515])
* Show results for all three OpenStreetMap entity types when searching an ID without a prefix ([#7112])
* Style hotkeys in tooltips as keyboard keys ([#6574])
* Make the top toolbar horizontally-scrollable at narrow sizes ([#6755])
* Always show the Layer subfield of the Structure field when a value is present ([#6911])
* Disable the Circularize operation if the selected way is already circular ([#6816], [#6993], thanks [@CarycaKatarzyna])
* Fallback to a preset's vector icon if its image fails to load, e.g. due to content blockers ([#7028])
* Convert single-member multipolygons to basic areas when merging member lines ([#5085])
* Always show the currently selected background in the sources list ([#7061])
* Only show background sources with global coverage at low zooms ([#7062])
* Render features with a status-prefix tags with a dashed style, e.g. `demolished:building=yes`
* Add tooltips to Mapillary Map Features overlay icons ([#7079])
* Add button to manually retry connecting to the OpenStreetMap API upon a failure ([#6650])
* Clarify the OpenStreetMap API connection failure message ([#7021])
* Improve styling of points linked to Wikidata
* Render `landuse=village_green` areas in green ([#7011])
* Render Putting Greens and similar features in light green ([#7101])

[#6565]: https://github.com/openstreetmap/iD/issues/6565
[#6696]: https://github.com/openstreetmap/iD/issues/6696
[#5766]: https://github.com/openstreetmap/iD/issues/5766
[#6515]: https://github.com/openstreetmap/iD/issues/6515
[#7112]: https://github.com/openstreetmap/iD/issues/7112
[#6574]: https://github.com/openstreetmap/iD/issues/6574
[#6755]: https://github.com/openstreetmap/iD/issues/6755
[#6911]: https://github.com/openstreetmap/iD/issues/6911
[#6816]: https://github.com/openstreetmap/iD/issues/6816
[#6993]: https://github.com/openstreetmap/iD/issues/6993
[#7028]: https://github.com/openstreetmap/iD/issues/7028
[#5085]: https://github.com/openstreetmap/iD/issues/5085
[#7061]: https://github.com/openstreetmap/iD/issues/7061
[#7062]: https://github.com/openstreetmap/iD/issues/7062
[#7079]: https://github.com/openstreetmap/iD/issues/7079
[#6650]: https://github.com/openstreetmap/iD/issues/6650
[#7021]: https://github.com/openstreetmap/iD/issues/7021
[#7011]: https://github.com/openstreetmap/iD/issues/7011
[#7101]: https://github.com/openstreetmap/iD/issues/7101

[@CarycaKatarzyna]: https://github.com/CarycaKatarzyna

#### :white_check_mark: Validation
* For crossing ways issues, offer one-click "Add a bridge" and "Add a tunnel" fixes ([#6617], [#7055], thanks [@CarycaKatarzyna])
* For crossing way-building issues, offer one-click fixes that set higher or lower layers ([#5924], [#6911])
* Flag unclosed multipolgon parts ([#2223])
* Flag crossing and one-way issues for features with `waterway=fish_pass`
* Don't suggest upgrading to brands that don't exist in the feature's country ([#6513], [#6479])
* Don't flag very close points with differing house or unit numbers ([#6998])
* Allow the `not:brand:wikidata` tag to silence nonstandard brand warnings ([#6577])
* Include default field values when upgrading to a preset with a specific replacement ([#7033])
* Add tooltips to some disabled fix buttons
* Don't flag `natural=cape` or `amenity=vending_machine` on vertices as mismatched geometry ([#6982], [#6515])
* Don't add `oneway=yes` to `highway=motorway_link` by default ([#7013])
* Don't expect an arbitrary `junction` tag to imply a feature should be an area ([#6933])
* Prefer `aerialway=station` instead of `aerialway=yes` for aerialway stations ([#6994])
* Remove deprecation of `crossing=zebra` ([#6962])
* Remove deprecation of `amenity=social_club` and `leisure=social_club` ([#6252])
* Deprecate `agrarian=agrcultural_machinry` misspelling ([#7053])
* Deprecate `company=consulting`, `office=consultancy`, `office=consultant`, `shop=consulting`
* Deprecate `type=audio`, `type=video`, `type=caldera`, `type=extinct`, `type=scoria`, `type=shield`, `type=strato`, `type=extinct`
* Deprecate `amenity=research_institution`, `barrier=railing`, `craft=glass`, `man_made=gas_well`, `man_made=oil_well`, `man_made=village_pump`, `power=marker`

[#6617]: https://github.com/openstreetmap/iD/issues/6617
[#7055]: https://github.com/openstreetmap/iD/issues/7055
[#5924]: https://github.com/openstreetmap/iD/issues/5924
[#6911]: https://github.com/openstreetmap/iD/issues/6911
[#2223]: https://github.com/openstreetmap/iD/issues/2223
[#6513]: https://github.com/openstreetmap/iD/issues/6513
[#6479]: https://github.com/openstreetmap/iD/issues/6479
[#6998]: https://github.com/openstreetmap/iD/issues/6998
[#6577]: https://github.com/openstreetmap/iD/issues/6577
[#7033]: https://github.com/openstreetmap/iD/issues/7033
[#6982]: https://github.com/openstreetmap/iD/issues/6982
[#6515]: https://github.com/openstreetmap/iD/issues/6515
[#7013]: https://github.com/openstreetmap/iD/issues/7013
[#6933]: https://github.com/openstreetmap/iD/issues/6933
[#6994]: https://github.com/openstreetmap/iD/issues/6994
[#6962]: https://github.com/openstreetmap/iD/issues/6962
[#6252]: https://github.com/openstreetmap/iD/issues/6252
[#7053]: https://github.com/openstreetmap/iD/issues/7053

[@CarycaKatarzyna]: https://github.com/CarycaKatarzyna

#### :bug: Bugfixes
* Fix issue with rotating multiple points together ([#6977], [#6979], thanks [@hackily])
* Fix various instances where issue fixes might not get properly updated ([#6588], [#7037])
* Fix unexpected label offsets in Firefox 70 ([#7044])
* Don't move `area=yes` to nodes when using the Extract operation on areas ([#7057])
* Fix issue where the fills of unclosed multipolygon parts would not render entirely ([#2945])
* Prevent background tiles from appearing larger than expected ([#7070])
* Fix issue where additional fields would disappear immediately upon clearing their value ([#6580])
* Fix issue where adding a raw tag after deleting several would insert the blank row at the wrong index ([#7087])
* Fix issue where OpenStreetMap API error message would persist despite the download of new data ([#6650])
* Replace use of unsupported CSS property flagged by the OpenStreetMap website ([#7091])
* Fix issue where the selected Mapillary detection outline would not render in some browsers ([#6804])
* Fix issue where boundary relation members would not render correctly if they were also multipolygons members ([#6787])
* Fix issue where the Administrative Boundary preset was not properly overriding the Boundary preset ([#7118])
* Fix regression where the relation suggestion list could overflow the inspector ([#7115])
* Fix issue where the Unsquare Corners degree input could be too narrow in some browsers ([#7126], thanks [@iriman])
* Correct vertical centering of checkmark fields

[#6977]: https://github.com/openstreetmap/iD/issues/6977
[#6979]: https://github.com/openstreetmap/iD/issues/6979
[#6588]: https://github.com/openstreetmap/iD/issues/6588
[#7037]: https://github.com/openstreetmap/iD/issues/7037
[#7044]: https://github.com/openstreetmap/iD/issues/7044
[#7057]: https://github.com/openstreetmap/iD/issues/7057
[#2945]: https://github.com/openstreetmap/iD/issues/2945
[#7070]: https://github.com/openstreetmap/iD/issues/7070
[#6580]: https://github.com/openstreetmap/iD/issues/6580
[#7087]: https://github.com/openstreetmap/iD/issues/7087
[#6650]: https://github.com/openstreetmap/iD/issues/6650
[#7091]: https://github.com/openstreetmap/iD/issues/7091
[#6804]: https://github.com/openstreetmap/iD/issues/6804
[#6787]: https://github.com/openstreetmap/iD/issues/6787
[#7118]: https://github.com/openstreetmap/iD/issues/7118
[#7115]: https://github.com/openstreetmap/iD/issues/7115
[#7126]: https://github.com/openstreetmap/iD/issues/7126

[@hackily]: https://github.com/hackily
[@iriman]: https://github.com/iriman

#### :earth_asia: Localization
* Differentiate the "wireframe mode" and "highlight changes" hotkeys in the German localization ([#6972], thanks [@manfredbrandl])
* Improve Chinese address field ([#7075], thanks [@koaber])
* Add Bolivia-specific address and phone number formats ([#7147], thanks [@51114u9])
* Add the Occitan language to the Multilingual Name field ([#7156])

[#6972]: https://github.com/openstreetmap/iD/issues/6972
[#7075]: https://github.com/openstreetmap/iD/issues/7075
[#7147]: https://github.com/openstreetmap/iD/issues/7147
[#7156]: https://github.com/openstreetmap/iD/issues/7156

[@manfredbrandl]: https://github.com/manfredbrandl
[@koaber]: https://github.com/koaber
[@51114u9]: https://github.com/51114u9

#### :hourglass: Performance
* Determine locations' country codes without calling out to a geocoding server ([#6941])
* Reduce rendering lag considerably when many features are selected at once ([#3571])

[#6941]: https://github.com/openstreetmap/iD/issues/6941
[#3571]: https://github.com/openstreetmap/iD/issues/3571

#### :mortar_board: Walkthrough / Help
* Update links in the README to avoid http-to-https redirects ([#6984], thanks [@mbrickn])
* Add the <kbd>I</kbd> hotkey to the Keyboard Shortcuts list ([#6997])

[#6984]: https://github.com/openstreetmap/iD/issues/6984
[#6997]: https://github.com/openstreetmap/iD/issues/6997

[@mbrickn]: https://github.com/mbrickn

#### :rocket: Presets
* Add Notice Board, Poster Box, and Advertising Totem presets ([#6965], thanks [@hikemaniac])
* Add Kiddie Ride, Log Flume, and Swing Carousel presets ([#7039], thanks [@hikemaniac])
* Add Spice Shop preset ([#7031], thanks [@scaidermern])
* Add Giant Chess Board preset ([#7059], thanks [@ToastHawaii])
* Add Marker, Utility Marker, and Power Marker presets ([#6978])
* Add Access Aisle preset and style ([#7083])
* Add Research Institute preset and style ([#7078])
* Add Advanced Stop Line preset ([#7014])
* Add Lane Connectivity relation preset ([#7105])
* Add Water Tap preset ([#7066])
* Add Rail Yard preset ([#7119])
* Add unsearchable Disused Railway Feature preset ([#7119])
* Add Recently Demolished Building preset and render them as areas ([#7098])
* Add Recreational Network Node preset for Belgium, Germany, Luxembourg, and The Netherlands ([#6992])
* Add presets for new brands: Consultancy Office, Cleaning Service, Camera Equipment Store, Flooring Supply Shop, Pottery Store, Tool Rental
* Add Fish Pass preset
* Append "Area" to the names of linear area presets: Bridge, Tunnel, Road, River, Stream, Canal ([#7015])
* Append "Feature" to the names of various generic presets, e.g. "Tourism Feature"
* Append "Ride" to the names of some attraction presets, e.g "Pirate Ship Ride"
* Rename "Wood" preset to "Natural Wood"
* Rename "Car Pooling" and "Car Sharing" presets to "Car Pooling Station" and "Car Sharing Station"
* Rename "Pottery" craft preset to "Pottery Maker"
* Correct "Firepit" preset name to "Fire Pit"
* Correct capitalization of "J-Bar Lift" and "T-Bar Lift" preset names
* Update icons for Mast, Communication Mast, and Communication Tower ([#6985])
* Update icons for Gate, Kissing Gate, and Cattle Grid ([#6814], [#6489])
* Update icon for Park to be different from Tree ([#6633])
* Update icons for Bunker and Military Bunker ([#7139])
* Update icons for presets: diplomatic offices, marked crossings, transit platforms, buoys, Billboard, Jet Bridge, Scrap Yard, Bicycle Parking Garage, Bicycle Lockers, Bicycle Rental, Bicycle Repair Tool Stand, Boat Rental, Car Pooling Station, Car Sharing Station, Parking Lot, Multilevel Parking Garage, Underground Parking, Park & Ride Lot, Lean-To, Picnic Shelter, Transit Shelter, Block, Chain, Height Restrictor, Turnstile, Barn, Stable, Basket Maker, Boar Builder, Handicraft, Pottery, Indoor Corridor, Cycle & Foot Path, Street Lamp, Commemorative Plaque, Fire Pit, Pier, Floating Pier, Minaret, Tunnel Area, Water Tower, Grassland, Grass, Tree Row, Energy Supplier Office, Insurance Office, Slide, Water Slide, Play Structure, Underground Power Cable, Chocolate Store, Lighting Store, Motorcycle Repair Shop, Storage Rental, Art Installation, Sculpture, Statue, Coastline, Boat Store, Boatyard, Cabin, Holiday Cottage, Alpine Hut, Wilderness Hut, Hostel, Blacksmith
* Add "tree" as a search term for Natural Wood and Managed Forest ([#7097])
* Add "packstation" as a search term for package pickup and dropoff lockers ([#7052])
* Add "pilates" as a search term for Gym / Fitness Center ([#7137])
* Support limiting fields to specific countries ([#7085])
* Add GNIS Feature ID field to various preset for the United States ([#7086])
* Add VAT ID Number field to business presets for countries where VAT numbers are issued ([#6880])
* Add Wikimedia Commons Page field with link to view the page
* Add Mapillary ID field with link to view the image on the Mapillary website ([#7064])
* Add Internet Access, SMS, and Video Calls fields to the Telephone preset ([#7010])
* Add Tactile Paving field to the Steps preset ([#7082], thanks [@stragu])
* Add Reference Code field to Vending Machine presets ([#7002])
* Add Drinks field to the Drink Vending Machine preset
* Add Drinkable field to various water source presets
* Add Type field to Fountain preset
* Add Pump field to Water Well preset
* Add Utilities field to Utility Pole and Street Cabinet presets
* Add Brand field to more presets that could have brand tags
* Rename "Network Type" field for `network` to "Network Class"
* Add Network Type field for `network:type` to Route presets with a `network` value
* Rename "Suggested Hashtags" changeset field to just "Hashtags"
* Only show the Country field on Flagpole features with `flag:type=national` ([#7099])
* Don't show the Denomination field on features with `religion=none` ([#7135])

[#7139]: https://github.com/openstreetmap/iD/issues/7139
[#6965]: https://github.com/openstreetmap/iD/issues/6965
[#7039]: https://github.com/openstreetmap/iD/issues/7039
[#7031]: https://github.com/openstreetmap/iD/issues/7031
[#7059]: https://github.com/openstreetmap/iD/issues/7059
[#6978]: https://github.com/openstreetmap/iD/issues/6978
[#7083]: https://github.com/openstreetmap/iD/issues/7083
[#7078]: https://github.com/openstreetmap/iD/issues/7078
[#7014]: https://github.com/openstreetmap/iD/issues/7014
[#7105]: https://github.com/openstreetmap/iD/issues/7105
[#7066]: https://github.com/openstreetmap/iD/issues/7066
[#7119]: https://github.com/openstreetmap/iD/issues/7119
[#7098]: https://github.com/openstreetmap/iD/issues/7098
[#6992]: https://github.com/openstreetmap/iD/issues/6992
[#7015]: https://github.com/openstreetmap/iD/issues/7015
[#6985]: https://github.com/openstreetmap/iD/issues/6985
[#6814]: https://github.com/openstreetmap/iD/issues/6814
[#6489]: https://github.com/openstreetmap/iD/issues/6489
[#6633]: https://github.com/openstreetmap/iD/issues/6633
[#7097]: https://github.com/openstreetmap/iD/issues/7097
[#7052]: https://github.com/openstreetmap/iD/issues/7052
[#7137]: https://github.com/openstreetmap/iD/issues/7137
[#7085]: https://github.com/openstreetmap/iD/issues/7085
[#7086]: https://github.com/openstreetmap/iD/issues/7086
[#6880]: https://github.com/openstreetmap/iD/issues/6880
[#7064]: https://github.com/openstreetmap/iD/issues/7064
[#7010]: https://github.com/openstreetmap/iD/issues/7010
[#7082]: https://github.com/openstreetmap/iD/issues/7082
[#7002]: https://github.com/openstreetmap/iD/issues/7002
[#7099]: https://github.com/openstreetmap/iD/issues/7099
[#7135]: https://github.com/openstreetmap/iD/issues/7135

[@hikemaniac]: https://github.com/hikemaniac
[@scaidermern]: https://github.com/scaidermern
[@ToastHawaii]: https://github.com/ToastHawaii
[@stragu]: https://github.com/stragu

# 2.16.0
##### 2019-Oct-23

#### :mega: Release Highlights
* :vertical_traffic_light: We've added support for showing objects detected in Mapillary images. Detections include traffic signals, storm drains, trash cans, street lamps, crosswalks, fire hydrants, power poles, and more. Shout out to [@kratico] for adding this feature!<br/>
_Open the Map Data pane and enable the Map Features layer to see what has been detected. (shortcut <kbd>F</kbd>)_
* :bookmark_tabs: You can now track changes that you've made while editing. Changed features will be highlighted green for additions, yellow for tag changes, and orange for geometry changes. Thanks [@Bonkles] for your work on this!<br/>
_Press <kbd>G</kbd> to toggle change highlighting._

#### :tada: New Features
* Add Map Features layer showing objects detected in Mapillary images ([#5845], [#6792], thanks [@kratico])
* Add the option to highlight edited features directly on the map ([#6843], thanks [@Bonkles])
* Show the number of resolved and remaining issues in the bottom bar when validating everything ([#6935], [#6940])
* Allow reversing directional nodes via the Reverse menu item and keyboard shortcut ([#6850])
* Add link to the Achavi changeset viewer to the History panel ([#6855])

[#5845]: https://github.com/openstreetmap/iD/issues/5845
[#6792]: https://github.com/openstreetmap/iD/issues/6792
[#6843]: https://github.com/openstreetmap/iD/issues/6843
[#6935]: https://github.com/openstreetmap/iD/issues/6935
[#6940]: https://github.com/openstreetmap/iD/issues/6940
[#6850]: https://github.com/openstreetmap/iD/issues/6850
[#6855]: https://github.com/openstreetmap/iD/issues/6855

[@kratico]: https://github.com/kratico
[@Bonkles]: https://github.com/Bonkles

#### :sparkles: Usability
* Flash the feature type button when a feature's preset changes during editing ([#6764])
* Add button to toggle the Background info panel ([#6839])
* Support reversing multiple selected features at the same time ([#6810])
* Match the cliff directional arrow color to the line color ([#6918], [#6919], thanks [@huonw])
* Render walls as blockier than fences and other barriers ([#6865])
* Don't render barriers tagged on waterways ([#6887])
* Improve Mapillary traffic sign quality by only showing signs detected in two or more photos ([#6921], thanks [@cbeddow])
* Prevent zooming past the allowed zoom level range via scrolling or trackpad gestures ([#6851])
* Disable the zoom in/out buttons at the maximum/minimum zoom levels ([#6847])
* Allow tabbing past the last row in the All Tags table ([#4233])
* Replace hardcoded ranking of OpenStreetMap communities with granular upstream ordering ([#6752])
* Make the "Report an Imagery Problem" text clearer ([#6820])
* Open the Map Data pane when clicking the "hidden features" badge

[#6764]: https://github.com/openstreetmap/iD/issues/6764
[#6839]: https://github.com/openstreetmap/iD/issues/6839
[#6810]: https://github.com/openstreetmap/iD/issues/6810
[#6918]: https://github.com/openstreetmap/iD/issues/6918
[#6919]: https://github.com/openstreetmap/iD/issues/6919
[#6865]: https://github.com/openstreetmap/iD/issues/6865
[#6887]: https://github.com/openstreetmap/iD/issues/6887
[#6921]: https://github.com/openstreetmap/iD/issues/6921
[#6851]: https://github.com/openstreetmap/iD/issues/6851
[#6847]: https://github.com/openstreetmap/iD/issues/6847
[#4233]: https://github.com/openstreetmap/iD/issues/4233
[#6752]: https://github.com/openstreetmap/iD/issues/6752
[#6820]: https://github.com/openstreetmap/iD/issues/6820

[@huonw]: https://github.com/huonw
[@cbeddow]: https://github.com/cbeddow

#### :white_check_mark: Validation
* Only show the user issues their edits created, not preexisting issues with features they modified ([#6459])
* No longer flag websites missing `http://` or `https://` ([#6831])
* Flag disconnected `highway=elevator` as routing islands ([#6812])
* Flag points that should be attached or detached from ways ([#6319])
* Flag features with names matching a value in their `not:name` tag ([#6411])
* Flag generic multilingual feature names ([#6876])
* Rename '"Fix Me" Requests' validation rule to 'Help Requests'
* Issue clearer warning when brand tags are simply incomplete, not strictly "nonstandard" ([#6909])
* Add changeset tags for the number and type of issues resolved by the user's edits ([#6459])
* Always show the Reset Ignored button when there are ignored issues
* Deprecate `cycleway=track` on `highway=cycleway` ([#6705])
* Deprecate various `direction`, `embankment`, `golf`, and `weighbridge` tags
* Upgrade outdated golf and jet bridge presets in one step rather than two ([#6901], [#6912], thanks [@guylamar2006])
* Add documentation of all validation issue types, severities, and changeset tags ([#6100])

[#6459]: https://github.com/openstreetmap/iD/issues/6459
[#6831]: https://github.com/openstreetmap/iD/issues/6831
[#6812]: https://github.com/openstreetmap/iD/issues/6812
[#6319]: https://github.com/openstreetmap/iD/issues/6319
[#6411]: https://github.com/openstreetmap/iD/issues/6411
[#6876]: https://github.com/openstreetmap/iD/issues/6876
[#6909]: https://github.com/openstreetmap/iD/issues/6909
[#6705]: https://github.com/openstreetmap/iD/issues/6705
[#6901]: https://github.com/openstreetmap/iD/issues/6901
[#6912]: https://github.com/openstreetmap/iD/issues/6912
[#6100]: https://github.com/openstreetmap/iD/issues/6100

[@guylamar2006]: https://github.com/guylamar2006

#### :bug: Bugfixes
* Fix an issue where some Mapillary traffic signs would not appear ([#6510], [#6921], thanks [@cbeddow])
* Don't treat closed `highway=corridor` ways as areas ([#6800])
* Fix an issue where operations might not be correctly enabled or disabled while editing a feature
* Properly show uppercase suggestions in the Country, Target, and Draft Beers fields

[#6510]: https://github.com/openstreetmap/iD/issues/6510
[#6921]: https://github.com/openstreetmap/iD/issues/6921
[#6800]: https://github.com/openstreetmap/iD/issues/6800

[@cbeddow]: https://github.com/cbeddow

#### :earth_asia: Localization
* Add Seychelles and Pitcairn Islands to the list of places that drive on the left ([#6827], thanks [@leighghunt])
* Show Traditional Chinese language names in the Taiwan localization instead of Simplified Chinese ([#6815])
* Sort the "Add field" options in a locale-aware order ([#6937])
* Make the Wheelchair Access and Stroller Access field options translatable ([#6878])
* Let the <kbd>@</kbd> key on French/AZERTY keyboards also toggle the sidebar ([#6864])
* Update language data with Unicode CLDR 36

[#6827]: https://github.com/openstreetmap/iD/issues/6827
[#6937]: https://github.com/openstreetmap/iD/issues/6937
[#6815]: https://github.com/openstreetmap/iD/issues/6815
[#6878]: https://github.com/openstreetmap/iD/issues/6878
[#6864]: https://github.com/openstreetmap/iD/issues/6864

[@leighghunt]: https://github.com/leighghunt

#### :mortar_board: Walkthrough / Help
* Update the link to the Mapbox Imagery Request site ([#6874], thanks [@1ec5])
* Fix issue where walkthrough could not be completed if certain data layers were disabled ([#6634])

[#6874]: https://github.com/openstreetmap/iD/issues/6874
[#6634]: https://github.com/openstreetmap/iD/issues/6634

[@1ec5]: https://github.com/1ec5

#### :rocket: Presets
* Add Electrical Equipment Store and Telecom Retail Store presets
* Add Indoor Stairwell and Indoor Elevator Shaft presets ([#6863], thanks [@danielsjf])
* Add Loading Dock preset ([#6849])
* Add Utility Pole preset ([#6848])
* Add Karting Racetrack and Motocross Racetrack presets ([#6826])
* Add Noise Barrier preset ([#6949])
* Add Brewing Supply Store preset ([#6866], [#6955], thanks [@simonbilskyrollins])
* Add presets: Spaceport, Hot Dog Fast Food, Recording Studio, Film Studio, Radio Station, Television Station, Truck Scale, City Hall
* Update icons for presets including money-related presets, construction presets, utility presets, schools, vending machines, parcel pickups and drop-offs, manholes, Sushi Restaurant, Compressed Air, Psychic, Shower, Bumper Cars, Roller Coaster, Bollard, Lift Gate, Street Lamp, Bleachers, Oil Well, and Wastewater Plant
* Add Type and Material fields to the Stile preset ([#6857], thanks [@ewnh])
* Add Waste field to relevant presets ([#6821])
* Add Hours field to the Recycling Container preset ([#6861])
* Add Blind Person Access and Lockable fields
* Add Bollard Row preset and a bollard Type field
* Add Informal field and Informal Path preset
* No longer show Level field for every feature, just those that might be indoors
* Add Levels field for features that might cross multiple building floors
* Add Maximum Age field to features like schools and rides
* Add Minimum Age field to features like kindergartens, bars, and clubs
* Add Theme field for Playground and Playground Equipment presets
* Add Type field to the Residential Area preset
* Add Limited option to the Stroller Access field ([#6833])
* Add `notCountryCodes` preset property for blacklisting presets from being addable in certain places
* Don't show the Cycle & Foot Path preset in France, Lithuania, or Poland ([#6836], [#6882])
* Require only the primary tag for a feature to match a golf preset
* Rename Construction to Construction Area and render it with a yellow icon
* Improve searchability of cycle presets in English ([#6825])

[#6949]: https://github.com/openstreetmap/iD/issues/6949
[#6863]: https://github.com/openstreetmap/iD/issues/6863
[#6849]: https://github.com/openstreetmap/iD/issues/6849
[#6848]: https://github.com/openstreetmap/iD/issues/6848
[#6826]: https://github.com/openstreetmap/iD/issues/6826
[#6857]: https://github.com/openstreetmap/iD/issues/6857
[#6821]: https://github.com/openstreetmap/iD/issues/6821
[#6861]: https://github.com/openstreetmap/iD/issues/6861
[#6833]: https://github.com/openstreetmap/iD/issues/6833
[#6836]: https://github.com/openstreetmap/iD/issues/6836
[#6882]: https://github.com/openstreetmap/iD/issues/6882
[#6825]: https://github.com/openstreetmap/iD/issues/6825

[@simonbilskyrollins]: https://github.com/simonbilskyrollins
[@danielsjf]: https://github.com/danielsjf
[@ewnh]: https://github.com/ewnh

# 2.15.5
##### 2019-Aug-26

#### :boom: Breaking Changes
* Remove support for Node 6 (Node 8 or higher is now required)
  * :warning: If you are building the iD project, you will need to upgrade your node version.

#### :sparkles: Usability
* Make the UI more navigable by tabbing ([#6701], thanks [@Abbe98])
* Render Sidewalks in a different color than Foot Paths ([#6522])
* List the user's language and common nearby languages first in the Multilingual Name language list ([#6712])
* Add more language options to the Multilingual Name list
* Enable searching fields by tag and keyword ([#5763])
* Accept relation IDs in the "Choose a parent relation" dropdown ([#3487])
* Highlight relations in the map when hovering over them in the "Choose a parent relation" dropdown ([#2946])
* Show addable presets specified by the `presets` URL parameter in the default preset list ([#6703])
* Interpret the `º` and `˚` characters as degrees when searching coordinates
* Make the post-upload changeset number clickable ([#6644])
* Allow selecting and copying tags from Custom Map Data ([#6710])
* Select points after dragging them ([#5747])

[#2946]: https://github.com/openstreetmap/iD/issues/2946
[#3487]: https://github.com/openstreetmap/iD/issues/3487
[#5747]: https://github.com/openstreetmap/iD/issues/5747
[#5763]: https://github.com/openstreetmap/iD/issues/5763
[#6522]: https://github.com/openstreetmap/iD/issues/6522
[#6644]: https://github.com/openstreetmap/iD/issues/6644
[#6701]: https://github.com/openstreetmap/iD/issues/6701
[#6703]: https://github.com/openstreetmap/iD/issues/6703
[#6710]: https://github.com/openstreetmap/iD/issues/6710
[#6712]: https://github.com/openstreetmap/iD/issues/6712

[@Abbe98]: https://github.com/Abbe98

#### :white_check_mark: Validation
* Don't flag known brands for having generic names ([#6761], [#6754], thanks [@SilentSpike])
* Clarify that connecting a waterway crossing a highway will add a ford ([#6734])
* Lock the Name field of features with a `name:etymology:wikidata` tag ([#6683])
* Don't offer to add `highway=service` to demolished roads with `service` tags ([#6775])
* Upgrade `crossing=island` to `crossing:island=yes` ([#6748])
* Upgrade `diaper` to `changing_table` ([#6529])
* Upgrade `access=public` to `access=yes` ([#6716])
* Deprecate `tower:type=anchor` and `tower:type=suspension` ([#6762])
* Deprecate `landuse=garden` ([#6758])
* Deprecate `roof:shape=half_hipped` ([#6704])

[#6529]: https://github.com/openstreetmap/iD/issues/6529
[#6683]: https://github.com/openstreetmap/iD/issues/6683
[#6704]: https://github.com/openstreetmap/iD/issues/6704
[#6716]: https://github.com/openstreetmap/iD/issues/6716
[#6734]: https://github.com/openstreetmap/iD/issues/6734
[#6748]: https://github.com/openstreetmap/iD/issues/6748
[#6754]: https://github.com/openstreetmap/iD/issues/6754
[#6758]: https://github.com/openstreetmap/iD/issues/6758
[#6761]: https://github.com/openstreetmap/iD/issues/6761
[#6762]: https://github.com/openstreetmap/iD/issues/6762
[#6775]: https://github.com/openstreetmap/iD/issues/6775

[@SilentSpike]: https://github.com/SilentSpike

#### :bug: Bugfixes
* Boost preset matching score if match occurs in addTags ([#6802])
* Fix error upon changing the Unsquare Building threshold ([#6690])
* Don't hide all multilingual names upon deleting one ([#6491])
* Correctly populate the Bike Lanes field with existing values ([#6141])
* Show the correct location for coordinates in the `N DD° MM.MMM' W DD° MM.MMM'` format without a commma separator ([#6582])
* Don't treat platforms with a `kerb` tag as primarily curbs ([#6742])
* Remove deleted features from the map immediately when undoing or redoing ([#6480])
* Properly resize Mapillary and Bing Streetside photos when resizing the viewer ([#6286])
* Fix issue where the Background Offset field could not be focused ([#6698])

[#6141]: https://github.com/openstreetmap/iD/issues/6141
[#6286]: https://github.com/openstreetmap/iD/issues/6286
[#6480]: https://github.com/openstreetmap/iD/issues/6480
[#6491]: https://github.com/openstreetmap/iD/issues/6491
[#6582]: https://github.com/openstreetmap/iD/issues/6582
[#6690]: https://github.com/openstreetmap/iD/issues/6690
[#6698]: https://github.com/openstreetmap/iD/issues/6698
[#6742]: https://github.com/openstreetmap/iD/issues/6742
[#6802]: https://github.com/openstreetmap/iD/issues/6802

#### :earth_asia: Localization
* Display the languages for the Multilingual Name field in the user's language, if available ([#2457], [#6702])
* Translate language names in the post-upload community list ([#4990])

[#2457]: https://github.com/openstreetmap/iD/issues/2457
[#4990]: https://github.com/openstreetmap/iD/issues/4990
[#6702]: https://github.com/openstreetmap/iD/issues/6702

#### :rocket: Presets
* Add Rental Shop preset
* Remove standalone Tactile Paving preset ([#6490], [#6791])
* Add Bottle Return Machine preset ([#6725], thanks [@ENT8R])
* Add Letter Box preset with Delivery Address field ([#6718])
* Add Post Sorting Office preset ([#6773])
* Add E-Waste Container preset ([#6777])
* Add Obelisk preset ([#6790])
* Add Flowerbed and Green Waste Container presets
* Add Line Attachment field to Power Pole and Power Tower ([#6762])
* Add Species Wikidata field to Animal Enclosure and Tree ([#6652])
* Add Fee Amount an Toll Amount fields ([#6722])
* Add Stroller Access field ([#6739])
* Add Refuge Island field to crossings ([#6748])
* Add Incorrect Names field for common naming mistakes ([#6411])
* Update icons for Power Pole, Power Tower, and Power Line ([#6786])
* Update icon for cycle paths, crossings, and tracks
* Only allow `power=transformer` on nodes ([#6779])

[#6411]: https://github.com/openstreetmap/iD/issues/6411
[#6490]: https://github.com/openstreetmap/iD/issues/6490
[#6652]: https://github.com/openstreetmap/iD/issues/6652
[#6718]: https://github.com/openstreetmap/iD/issues/6718
[#6722]: https://github.com/openstreetmap/iD/issues/6722
[#6725]: https://github.com/openstreetmap/iD/issues/6725
[#6739]: https://github.com/openstreetmap/iD/issues/6739
[#6748]: https://github.com/openstreetmap/iD/issues/6748
[#6762]: https://github.com/openstreetmap/iD/issues/6762
[#6773]: https://github.com/openstreetmap/iD/issues/6773
[#6777]: https://github.com/openstreetmap/iD/issues/6777
[#6779]: https://github.com/openstreetmap/iD/issues/6779
[#6786]: https://github.com/openstreetmap/iD/issues/6786
[#6790]: https://github.com/openstreetmap/iD/issues/6790
[#6791]: https://github.com/openstreetmap/iD/issues/6791

[@ENT8R]: https://github.com/ENT8R

# 2.15.4
##### 2019-Jul-26

#### :tada: New Features
* Render side direction arrows on weirs ([#6615])

[#6615]: https://github.com/openstreetmap/iD/issues/6615

#### :sparkles: Usability
* Don't reuse the changeset comment, sources, and hashtags by default after uploading or discarding edits ([#6642])

[#6642]: https://github.com/openstreetmap/iD/issues/6642

#### :white_check_mark: Validation
* Don't flag very close points on different layers or levels ([#6612])
* Don't flag Google Books as a source ([#6556])
* Add `preschool=yes` when upgrading `amenity=preschool` ([#6636])

[#6612]: https://github.com/openstreetmap/iD/issues/6612
[#6556]: https://github.com/openstreetmap/iD/issues/6556
[#6636]: https://github.com/openstreetmap/iD/issues/6636

#### :bug: Bugfixes
* Fix issue where the info in the Background panel wouldn't update when switching backgrounds ([#6627])
* Fix issue where side direction arrows might not update when switching presets ([#6032])

[#6627]: https://github.com/openstreetmap/iD/issues/6627
[#6032]: https://github.com/openstreetmap/iD/issues/6032

#### :earth_asia: Localization
* Default speed limit units to miles per hour in Puerto Rico ([#6626])
* Fix issue where Arabic numerals would not render correctly on the map ([#6679], [#6682], thanks [@mapmeld])

[#6626]: https://github.com/openstreetmap/iD/issues/6626
[#6679]: https://github.com/openstreetmap/iD/issues/6679
[#6682]: https://github.com/openstreetmap/iD/issues/6682

#### :rocket: Presets
* Add Dressing Room preset ([#6643])
* Add Pool Supply Store preset ([#6599])
* Add Address Interpolation line preset ([#4220])
* Add Printer Ink Store, Park & Ride Lot, Aircraft Holding Position, and Aircraft Parking Position presets
* Add Type and Address fields to Public Bookcase preset ([#6564], thanks [@ToastHawaii])
* Add Underground Levels field to building presets ([#6628])
* Add more fields to the Kindergarten, Ferry Route, Ford, Dam, Weir, and Bridge Support presets
* Fix tag misspelling for the Camp Pitch preset ([#6608])
* Update icons for the Cairn, Sandwich Fast Food, Hifi Store, and Party Store presets

[#6643]: https://github.com/openstreetmap/iD/issues/6643
[#6564]: https://github.com/openstreetmap/iD/issues/6564
[#6628]: https://github.com/openstreetmap/iD/issues/6628
[#4220]: https://github.com/openstreetmap/iD/issues/4220
[#6599]: https://github.com/openstreetmap/iD/issues/6599
[#6608]: https://github.com/openstreetmap/iD/issues/6608

# 2.15.3
##### 2019-Jun-30

#### :tada: New Features
* Deprecate unsupported DigitalGlobe imagery sources ([editor-layer-index/#680])
* Limit addable presets via comma-separated IDs in the `presets` URL parameter ([#6553])

[editor-layer-index/#680]: https://github.com/osmlab/editor-layer-index/pull/680
[#6553]: https://github.com/openstreetmap/iD/issues/6553

#### :sparkles: Usability
* Add support for fords drawn as lines ([#6576])

[#6576]: https://github.com/openstreetmap/iD/issues/6576

#### :white_check_mark: Validation
* Allow for some tags (`takeaway`) to be kept when upgrading tags ([#6530], [#6581])
* Remove existing match keys before upgrading to a name-suggestion-index preset ([#6575])
* Deprecate `camp_site=camp_pitch`, prefer `tourism=camp_pitch` ([#6591])

[#6591]: https://github.com/openstreetmap/iD/issues/6591
[#6581]: https://github.com/openstreetmap/iD/issues/6581
[#6575]: https://github.com/openstreetmap/iD/issues/6575
[#6530]: https://github.com/openstreetmap/iD/issues/6530

#### :bug: Bugfixes
* Fix issue displaying preset name for suggestions with a '/' in name ([#6594])
* Fix crash when disabling the OSM layer while drawing ([#6584])

[#6594]: https://github.com/openstreetmap/iD/issues/6594
[#6584]: https://github.com/openstreetmap/iD/issues/6584

#### :rocket: Presets
* Update camera icon on surveillance presets
* Add preset for `shop=hobby`
* Add Cairn preset ([#6587], thanks [@SilentSpike])
* Add field for `operator:type` to various presets ([#6566])
* Render `waterway=dam` as lines as grey ([#6555])
* Add Karaoke Box preset ([#6538])
* Add Torii preset ([#6537])
* Add more fields to the Helipad preset
* Add Structure field to the Canal preset ([#6548])
* Add polling place presets and field ([#6542])

[#6587]: https://github.com/openstreetmap/iD/issues/6587
[#6566]: https://github.com/openstreetmap/iD/issues/6566
[#6555]: https://github.com/openstreetmap/iD/issues/6555
[#6548]: https://github.com/openstreetmap/iD/issues/6548
[#6542]: https://github.com/openstreetmap/iD/issues/6542
[#6538]: https://github.com/openstreetmap/iD/issues/6538
[#6537]: https://github.com/openstreetmap/iD/issues/6537
[@SilentSpike]: https://github.com/SilentSpike


# 2.15.2
##### 2019-Jun-17

#### :sparkles: Usability
* Prefer a Wikipedia commons logo over social media logo in some situations ([#6361])

[#6361]: https://github.com/openstreetmap/iD/issues/6361

#### :white_check_mark: Validation
* Remove issue "autofix" buttons
* Don't suggest adding `nonsquare=yes` to physically unsquare buildings ([#6332])
* Stop suggesting adding highway=footway to piers, platforms, and tracks ([#6229], [#6409], [#6042])
* Fix some situations where iD should not suggest adding `highway=crossing` ([#6508])
* Avoid stale "connect endpoints" fix for "tags imply area" that could cause invalid areas ([#6525])
* Remove `barrier=entrance` deprecation ([#6506])
* Improve warning message when updating brand tags ([#6443])
* Improve checks for valid email and website values ([#6494], thanks [@SilentSpike])
* Fix issue where crossings with kerb tags were treated primarily as kerbs ([#6440])
* Fix issue where upgrading `office=administrative` could also remove `building=yes` ([#6466])
* Fix issue where cuisine -> diet upgrades could overwrite existing values ([#6462])

[#6525]: https://github.com/openstreetmap/iD/issues/6525
[#6508]: https://github.com/openstreetmap/iD/issues/6508
[#6506]: https://github.com/openstreetmap/iD/issues/6506
[#6494]: https://github.com/openstreetmap/iD/issues/6494
[#6466]: https://github.com/openstreetmap/iD/issues/6466
[#6462]: https://github.com/openstreetmap/iD/issues/6462
[#6443]: https://github.com/openstreetmap/iD/issues/6443
[#6440]: https://github.com/openstreetmap/iD/issues/6440
[#6409]: https://github.com/openstreetmap/iD/issues/6409
[#6332]: https://github.com/openstreetmap/iD/issues/6332
[#6229]: https://github.com/openstreetmap/iD/issues/6229
[#6042]: https://github.com/openstreetmap/iD/issues/6042
[@SilentSpike]: https://github.com/SilentSpike


#### :bug: Bugfixes
* Fix issue with deleting a member from a relation with a duplicate entity but different roles ([#6504])
* Fix issue where iD could crash upon save if user had edits stored before iD 2.15 ([#6496])

[#6504]: https://github.com/openstreetmap/iD/issues/6504
[#6496]: https://github.com/openstreetmap/iD/issues/6496

#### :rocket: Presets
* Add presets for `craft=signmaker`, `healthcare=counselling`, `shop=fashion_accessories`
* Remove unnecessary `landuse=military` added on `military=bunker` ([#6509], [#6518], thanks [@matkoniecz])
* Add Pipeline Valve preset ([#6393])
* Add Diameter field to Pipeline and Tree presets
* Add additional terms for Mailbox preset ([#6535])
* Improve public bookcase preset ([#6503], thanks [@ToastHawaii])
* Deprecate `wifi=yes` and `wifi=free` ([#6524])
* Lower match score for man_made/bridge preset
* Add presets for Christian places of worship that do not use a cross icon or are not called churches ([#6512])
* Add preset for `shop=military_surplus` ([#6470])
* Deprecate various maxspeed mistags ([#6478])
* Add preset for `office=bail_bond_agent` and deprecate various mistags ([#6472])
* Deprecate "FIXME" -> "fixme", "NOTE" -> "note" ([#6477])
* Deprecate some "sustenance" tags
* Change the label "Direction" to "Direction Affected" for vertex fields ([#6469], thanks [@BjornRasmussen])
* Remove the search term "garage" from parking preset ([#6455], thanks [@BjornRasmussen])
* Add preset for `military=trench` ([#6474])
* Add preset for `leisure=escape_game` ([#6447])
* Update Hackerspace fields

[#6535]: https://github.com/openstreetmap/iD/issues/6535
[#6524]: https://github.com/openstreetmap/iD/issues/6524
[#6518]: https://github.com/openstreetmap/iD/issues/6518
[#6512]: https://github.com/openstreetmap/iD/issues/6512
[#6509]: https://github.com/openstreetmap/iD/issues/6509
[#6503]: https://github.com/openstreetmap/iD/issues/6503
[#6478]: https://github.com/openstreetmap/iD/issues/6478
[#6477]: https://github.com/openstreetmap/iD/issues/6477
[#6474]: https://github.com/openstreetmap/iD/issues/6474
[#6472]: https://github.com/openstreetmap/iD/issues/6472
[#6470]: https://github.com/openstreetmap/iD/issues/6470
[#6469]: https://github.com/openstreetmap/iD/issues/6469
[#6455]: https://github.com/openstreetmap/iD/issues/6455
[#6447]: https://github.com/openstreetmap/iD/issues/6447
[#6393]: https://github.com/openstreetmap/iD/issues/6393
[@matkoniecz]: https://github.com/matkoniecz
[@ToastHawaii]: https://github.com/ToastHawaii
[@BjornRasmussen]: https://github.com/BjornRasmussen


# 2.15.1
##### 2019-May-24

#### :tada: New Features
* Add Maxar-Standard and Maxar-Premium Imagery Layers ([editor-layer-index#668])
* Add feature filters for pistes and aerialways
* Add ability to hide indoor areas and building part areas ([#6352])

[#6352]: https://github.com/openstreetmap/iD/issues/6352
[editor-layer-index#668]: https://github.com/osmlab/editor-layer-index/pull/668

#### :sparkles: Usability
* Prevent Chrome autofill of recent values in the Allowed Access inputs ([#6414])
* Improve visual padding of multiselect fields
* Make unsquare threshold field wider to account for stepper control in Firefox ([#6418])
* Add "Disable All" and "Enable All" buttons for the Map Features list ([#5234])

[#6418]: https://github.com/openstreetmap/iD/issues/6418
[#6414]: https://github.com/openstreetmap/iD/issues/6414
[#5234]: https://github.com/openstreetmap/iD/issues/5234

#### :white_check_mark: Validation
* Swap `wikidata`/`wikipedia` for `brand:` tags if possible ([#6416])
* Suggest adding `indoor=yes` to `highway=corridor` to explicitly specify these as indoor features
* Flag detached points that are very close together ([#6394])
* Flag almost junctions between highways and themselves ([#6373])
* Deprecate various old storage tank tags
* Show better warning message if tags and incomplete rather than deprecated ([#6410])
* Don't flag private data only buildings that are also offices ([#6404])
* Flag private data on `building=houseboat`
* Add ability to upgrade a tag value within a semicolon-delimited list

[#6373]: https://github.com/openstreetmap/iD/issues/6373
[#6394]: https://github.com/openstreetmap/iD/issues/6394
[#6404]: https://github.com/openstreetmap/iD/issues/6404
[#6410]: https://github.com/openstreetmap/iD/issues/6410
[#6416]: https://github.com/openstreetmap/iD/issues/6416

#### :bug: Bugfixes
* Fix raw tag editor styling for custom data editor ([#6427])
* Fix bug centering map when clicking on an issue in the Issues pane ([#6384])
* Fix vector tile layers ([#6426])
* Fix bug causing new data to be discarded when running fixes to upgrade tags or remove private data ([#6407])
* Fix issue causing duplicate expanded community entries to appear ([#6422])
* Fix bug where iD could add empty source tag to changesets ([#6405])

[#6384]: https://github.com/openstreetmap/iD/issues/6384
[#6405]: https://github.com/openstreetmap/iD/issues/6405
[#6407]: https://github.com/openstreetmap/iD/issues/6407
[#6422]: https://github.com/openstreetmap/iD/issues/6422
[#6426]: https://github.com/openstreetmap/iD/issues/6426
[#6427]: https://github.com/openstreetmap/iD/issues/6427

#### :hourglass: Performance
* Prevent iD from loading too many off screen tiles ([#6417])
* Switch Bing Imagery Key to avoid overages ([#5833])

[#6417]: https://github.com/openstreetmap/iD/issues/6417
[#5833]: https://github.com/openstreetmap/iD/issues/5833

#### :rocket: Presets
* Update several preset icons (dry cleaning, disc golf, shuffleboard, horseshoes pit)
* Add Disc Golf Course preset
* For ice rinks, prefer the `sport` values `ice_hockey`/`ice_skating` over `hockey`/`skating`
* Add Field Hockey Pitch preset
* Add Indoor and Covered fields to more presets
* Add Allowed Access field to piers, platforms, and tracks
* Add Covered field to Subway preset
* Add Water Tank preset
* Add preset for `landuse=winter_sports` ([#6403])
* Add Type field to Resort preset Add more terms and fields to the Resort preset
* Add layer field to aerialway presets
* Improve search terms to Cycle & Foot Path preset ([#6406])

[#6406]: https://github.com/openstreetmap/iD/issues/6406
[#6403]: https://github.com/openstreetmap/iD/issues/6403


# 2.15.0
##### 2019-May-21

#### :mega: Release Highlights
* :wrench: We've made a lot of improvements to iD's validator!  It's a lot faster than before,
and can now optionally validate everything downloaded OpenStreetMap.  We have added rules for validating highway
connectivity, outdated tags, very close nodes, and nonsquare buildings.<br/>
_Open the Issues pane to see what the new validator can do! (shortcut <kbd>I</kbd>)_
* :triangular_ruler: Squaring used to be just for closed lines, but now the squaring
tool can be used to square unclosed lines and individual corners.  **Importantly, we've changed the keyboard shortcut from
<kbd>S</kbd> to <kbd>Q</kbd>.**  This is because lines can be both straightened or squared now,
and <kbd>Q</kbd> matches the shortcut used by the JOSM editor.<br/>
_Try squaring some lines, or corner nodes (but remember, the shortcut is now <kbd>Q</kbd>:exclamation:)_
* :straight_ruler: Straightening used to be just for unclosed lines, but now the straightening
tool can be used on sub-sections of lines, on multiple connected lines, and on individual points.<br/>
_Try straightening points to make them line up perfectly (keyboard shortcut <kbd>S</kbd>)_
* :ok_hand: The extraction tool got an upgrade as well.  Before you could detach points from lines, now
the tool is named "extract" and you can extract points from areas too.<br/>
_Try extracting features from areas when they are better mapped as points (keyboard shortcut <kbd>E</kbd>)_
* :memo: We've made the raw tag editor even _raw-er_.  You can now toggle between list and text views when editing
tags.  The text view is especially useful for copying and pasting tags!<br/>
_Click the icons above the "All tags" section to toggle between list and text views._
* :fries: The [name-suggestion-index](http://osmlab.github.io/name-suggestion-index/brands/) project that powers iD's brand search got a big upgrade too!  You can now find more brands than before, and brand logos will appear in the preset search results and in the feature editor.<br/>
_Map all the branded businesses in your town!_


#### :boom: Breaking Changes
- Change the Square shortcut from <kbd>S</kbd> to <kbd>Q</kbd> since lines can now be both straightened and squared
- Merge the generic presets for the `point` and `vertex` geometries
- Removed `utilIdleWorker` and `utilCallWhenIdle` ([#6299])
  -  :warning: Code refactor: use `window.requestIdleCallback` instead

#### :tada: New Features
- Add raw text tag editor with copy-and-paste support ([#839], [#6185], [#6302])
- Add drag-and-drop reordering of relation members ([#2283])
- Add controls to filter between panoramic vs. flat photos ([#5433])
- Include street-level photo sources used during editing in the `source` changeset tag ([#6279])
- Add Downgrade operation that removes all tags except for addresses and building info ([#6103])
- Allow extracting points of interest from buildings and other areas ([#6203])
- Allow squaring unclosed lines ([#5093], [#5999])
- Allow squaring individual corners ([#2205], [#5999])
- Allow straightening multiple connected lines together ([#5740], thanks [@jguthrie100])
- Allow straightening just selected points within a line ([#2058], [#5740], thanks [@jguthrie100])
- Allow straightening multiple selected points that are independent of lines ([#6217])
- Allow disconnecting entire lines or areas at once ([#4245])
- Allow disconnecting multiple selected points at once ([#6164])
- Allow disconnecting closed lines at their endpoint node ([#6149], [#6161], thanks [@jguthrie100])
- Add YouthMappers chapters to the community entries that appear after saving

[#6279]: https://github.com/openstreetmap/iD/issues/6279
[#6302]: https://github.com/openstreetmap/iD/issues/6302
[#6299]: https://github.com/openstreetmap/iD/issues/6299
[#6279]: https://github.com/openstreetmap/iD/issues/6279
[#6217]: https://github.com/openstreetmap/iD/issues/6217
[#6203]: https://github.com/openstreetmap/iD/issues/6203
[#6185]: https://github.com/openstreetmap/iD/issues/6185
[#6164]: https://github.com/openstreetmap/iD/issues/6164
[#6161]: https://github.com/openstreetmap/iD/issues/6161
[#6149]: https://github.com/openstreetmap/iD/issues/6149
[#5999]: https://github.com/openstreetmap/iD/issues/5999
[#5740]: https://github.com/openstreetmap/iD/issues/5740
[#5433]: https://github.com/openstreetmap/iD/issues/5433
[#5093]: https://github.com/openstreetmap/iD/issues/5093
[#4245]: https://github.com/openstreetmap/iD/issues/4245
[#2283]: https://github.com/openstreetmap/iD/issues/2283
[#2205]: https://github.com/openstreetmap/iD/issues/2205
[#2058]: https://github.com/openstreetmap/iD/issues/2058
[#839]: https://github.com/openstreetmap/iD/issues/839

[@jguthrie100]: https://github.com/jguthrie100

#### :sparkles: Usability
- Improved marker styling and lock icon for protected fields on Wikidata-tagged features ([#6389])
- Trim the user's string when preset searching ([#6383])
- Don't render deprecated tagged features the same as their modern counterparts
- Add "Reset All" button for Display Options in the Background pane ([#5503], [#5994], thanks [@alphagamer7])
- Add link to the PeWu entity history viewer to the History panel ([#6202])
- Persist recent presets across sessions ([#6022])
- Add labels beneath buttons in the top toolbar
- Move the loading indicator from the top toolbar to the bottom corner of the map ([#5889])
- Move photo overlay controls to their own section within the Map Data pane ([#5913])
- Rename "Detach" operation to "Extract"
- Improve results when squaring ([#2472], [#5999])
- Show better feedback when trying to square something that is already square ([#5967], [#5999])
- Convert comma-separated values to semicolon-separated when entering a value in a multicombo field ([#6013])
- Autocomplete labels when typing in the Wikidata field ([#5544])
- Update the Wikipedia field when changing the Wikidata field ([#5543])
- Don't remove the `wikidata` tag when removing the Wikipedia field value ([#4322])
- Add a tooltip to the button for adding a feature to a relation ([#3812])
- Discard `osmarender` tags when saving features ([#6091])
- Add a keyboard shortcut to toggle the OpenStreetMap data layer ([#6104])
- Avoid damaging any relation with `from`, `via`, or `to` members, not just turn restrictions ([#6221])
- Don't reorder tag rows when editing keys in the raw tag editor ([#5927])
- Allow scrolling in textarea fields ([#6306])
- Prevent deleting features with `wikidata` tags ([#5853])
- Add `photo_overlay` API parameter to show default photo overlays and persist them between sessions ([#5813])

[#6389]: https://github.com/openstreetmap/iD/issues/6389
[#6383]: https://github.com/openstreetmap/iD/issues/6383
[#6306]: https://github.com/openstreetmap/iD/issues/6306
[#6221]: https://github.com/openstreetmap/iD/issues/6221
[#6202]: https://github.com/openstreetmap/iD/issues/6202
[#6104]: https://github.com/openstreetmap/iD/issues/6104
[#6103]: https://github.com/openstreetmap/iD/issues/6103
[#6091]: https://github.com/openstreetmap/iD/issues/6091
[#6022]: https://github.com/openstreetmap/iD/issues/6022
[#6013]: https://github.com/openstreetmap/iD/issues/6013
[#5994]: https://github.com/openstreetmap/iD/issues/5994
[#5967]: https://github.com/openstreetmap/iD/issues/5967
[#5927]: https://github.com/openstreetmap/iD/issues/5927
[#5913]: https://github.com/openstreetmap/iD/issues/5913
[#5889]: https://github.com/openstreetmap/iD/issues/5889
[#5853]: https://github.com/openstreetmap/iD/issues/5853
[#5813]: https://github.com/openstreetmap/iD/issues/5813
[#5544]: https://github.com/openstreetmap/iD/issues/5544
[#5543]: https://github.com/openstreetmap/iD/issues/5543
[#5503]: https://github.com/openstreetmap/iD/issues/5503
[#4322]: https://github.com/openstreetmap/iD/issues/4322
[#3812]: https://github.com/openstreetmap/iD/issues/3812
[#2472]: https://github.com/openstreetmap/iD/issues/2472

[@alphagamer7]: https://github.com/alphagamer7


#### :white_check_mark: Validation
- Allow user to change the threshold for nonsquare building detection ([#6386])
- Don't consider `highway=raceway` as routable ([#6385])
- Offer tag upgrades to branded features from name-suggestion-index
- Improve validation of disconnected ways to detect routing islands ([#6376])
- Add fix to tag real nonsquare buildings with `nonsquare=yes` tag ([#6332])
- Remove the "many deletions" validation issue ([#6140])
- Add "quick fix" option to several issue fix types ([#6140])
- Add option to browse issues with all loaded data, not just edited features ([#5906], [#6140])
- Add option to filter issues to just the ones nearby ([#6140])
- Show info about any hidden issues when all filtered issues are resolved ([#6224])
- Add option to manually ignore and hide specific issues ([#6242])
- Flag redundant points in lines and areas ([#6241], [#6326], [#6267], thanks [@gaoxm])
- Flag features with `fixme` tags ([#6214])
- Flag simple buildings that aren't quite square ([#6215], [#6234])
- Flag lines with `highway=road` as unclassified ([#5998])
- Flag phone numbers on residential buildings as potential privacy violations ([#5850])
- Flag suspicious data sources like "Google" given in features' `source` tags ([#6135])
- Flag unreachable one-way highways and waterways flowing against each other ([#6216])
- Flag disconnected area and multipolygon highways ([#6075])
- Flag new highways disconnected from the larger road network ([#6284], thanks [@Bonkles], [@gaoxm])
- Don't flag highways connected to ferry routes as disconnected ([#6287])
- Flag disconnected ferry routes
- Flag deprecated values among semicolon-delimited tags ([#6038])
- Add quick fixes for setting the `layer` to resolve certain Crossing Ways issues ([#5943])
- Rename "Generic Names" validation rule to "Suspicious Names"
- Be more lenient when flagging generic names ([#5930])
- Recommend converting combinations like `highway=footway` and `foot=no` to `highway=path` ([#6070])
- Deprecate `cuisine` values like `vegan` in favor of `diet:*` tags like `diet:vegan` ([#5993])
- Deprecate `todo` in favor of `fixme` ([#6214])
- Deprecate `barrier=embankment` in favor of `man_made=embankment` ([#6236])
- Apply more checks before letting users delete features via quick-fixes ([#6062])
- Don't suggest deprecated tag values when editing fields ([#6084])
- Don't flag disconnected highways that overlap unloaded regions ([#5938], [#6140])
- Don't flag almost junctions between features on different layers or levels ([#6355])
- Discard untagged relations that appear to have been created accidentally ([#3812])
- Include the number and type of warnings ignored by the user in the changset tags ([#6123])
- Recommend adding `highway` tags to piers, racetracks, and transit platforms for routing purposes ([#6042])
- Indicate iD's tag deprecations on Taginfo ([#5995])
- When connecting crossing paths and roads, don't automatically set the `crossing` tag of the connection node if it is ambiguous ([#6244])

[#6386]: https://github.com/openstreetmap/iD/issues/6386
[#6385]: https://github.com/openstreetmap/iD/issues/6385
[#6376]: https://github.com/openstreetmap/iD/issues/6376
[#6355]: https://github.com/openstreetmap/iD/issues/6355
[#6332]: https://github.com/openstreetmap/iD/issues/6332
[#6326]: https://github.com/openstreetmap/iD/issues/6326
[#6287]: https://github.com/openstreetmap/iD/issues/6287
[#6284]: https://github.com/openstreetmap/iD/issues/6284
[#6267]: https://github.com/openstreetmap/iD/issues/6267
[#6244]: https://github.com/openstreetmap/iD/issues/6244
[#6242]: https://github.com/openstreetmap/iD/issues/6242
[#6241]: https://github.com/openstreetmap/iD/issues/6241
[#6236]: https://github.com/openstreetmap/iD/issues/6236
[#6234]: https://github.com/openstreetmap/iD/issues/6234
[#6224]: https://github.com/openstreetmap/iD/issues/6224
[#6216]: https://github.com/openstreetmap/iD/issues/6216
[#6215]: https://github.com/openstreetmap/iD/issues/6215
[#6214]: https://github.com/openstreetmap/iD/issues/6214
[#6140]: https://github.com/openstreetmap/iD/issues/6140
[#6135]: https://github.com/openstreetmap/iD/issues/6135
[#6123]: https://github.com/openstreetmap/iD/issues/6123
[#6084]: https://github.com/openstreetmap/iD/issues/6084
[#6075]: https://github.com/openstreetmap/iD/issues/6075
[#6070]: https://github.com/openstreetmap/iD/issues/6070
[#6062]: https://github.com/openstreetmap/iD/issues/6062
[#6042]: https://github.com/openstreetmap/iD/issues/6042
[#6038]: https://github.com/openstreetmap/iD/issues/6038
[#5998]: https://github.com/openstreetmap/iD/issues/5998
[#5995]: https://github.com/openstreetmap/iD/issues/5995
[#5993]: https://github.com/openstreetmap/iD/issues/5993
[#5943]: https://github.com/openstreetmap/iD/issues/5943
[#5938]: https://github.com/openstreetmap/iD/issues/5938
[#5930]: https://github.com/openstreetmap/iD/issues/5930
[#5906]: https://github.com/openstreetmap/iD/issues/5906
[#5850]: https://github.com/openstreetmap/iD/issues/5850

[@gaoxm]: https://github.com/gaoxm
[@Bonkles]: https://github.com/Bonkles

#### :bug: Bugfixes
- Don't move connected ways when squaring ([#1979], [#5999])
- Ensure that relation members and child nodes of selected features are displayed even when features of those types are disabled ([#6220], [#6328])
- Maintain directionality when merging a directional line with a non-directional line ([#6033])
- Fix crash when drawing an area in a particular manner ([#5996])
- Fix bug where straightening long ways could disconnect junctions ([#2248])
- Fix bug where editing a tag in the "All tags" section and then selecting another feature could apply the change to the second features ([#6028])
- Unhighlight relations and relation members when removing them ([#5612])
- Display the undo and redo buttons as disabled when zoomed out beyond the editable zoom level ([#6105])
- Don't overlap the information panels, slideout panes, and photo viewer ([#4733], [#5212])
- Don't let mobile Safari force rounded corners on all search fields ([#6034])
- Pan to location of the undone edit when undoing, not the edit prior to that ([#5831])
- Prevent long multicombo field values from overflowing their container ([#6201])
- Correctly reverse complex tags with `left` and `right` when reversing highways ([#6235])
- Prevent upload error when setting the Wikipedia field to a page with special characters ([#6232])
- Remove unused Google Analytics code ([#6295])
- Fix issue where some operations could be unexpectedly disallowed ([#6296])
- Don't show gaps in the stroke where multipolygon member lines connect ([#6336])
- Fix layout issue with the Label field ([#6344])
- Fix issue where lines could have unexpected styling when first added to multipolygons ([#3613])

[#6344]: https://github.com/openstreetmap/iD/issues/6344
[#6336]: https://github.com/openstreetmap/iD/issues/6336
[#6328]: https://github.com/openstreetmap/iD/issues/6328
[#6296]: https://github.com/openstreetmap/iD/issues/6296
[#6295]: https://github.com/openstreetmap/iD/issues/6295
[#6235]: https://github.com/openstreetmap/iD/issues/6235
[#6232]: https://github.com/openstreetmap/iD/issues/6232
[#6220]: https://github.com/openstreetmap/iD/issues/6220
[#6201]: https://github.com/openstreetmap/iD/issues/6201
[#6105]: https://github.com/openstreetmap/iD/issues/6105
[#6034]: https://github.com/openstreetmap/iD/issues/6034
[#6033]: https://github.com/openstreetmap/iD/issues/6033
[#6028]: https://github.com/openstreetmap/iD/issues/6028
[#5996]: https://github.com/openstreetmap/iD/issues/5996
[#5831]: https://github.com/openstreetmap/iD/issues/5831
[#5612]: https://github.com/openstreetmap/iD/issues/5612
[#5212]: https://github.com/openstreetmap/iD/issues/5212
[#4733]: https://github.com/openstreetmap/iD/issues/4733
[#3613]: https://github.com/openstreetmap/iD/issues/3613
[#2248]: https://github.com/openstreetmap/iD/issues/2248
[#1979]: https://github.com/openstreetmap/iD/issues/1979

#### :earth_asia: Localization
- Make the place format in the contribution thank-you message localizable ([#6269])
- Add Papiamento localization ([#6222])

[#6269]: https://github.com/openstreetmap/iD/issues/6269
[#6222]: https://github.com/openstreetmap/iD/issues/6222

#### :hourglass: Performance
- Significantly improve validation performance ([#6054], [#5901], [#6140])
- Improve performance when typing changeset comments ([#6249])
- Avoid reloading the inspector sidebar for geometry-only changes ([#6086], [#6140])
- Reduce circular file dependencies ([#6237])
- Update to D3 v5 ([#6245])
- Replace the `ecstastic` development dependency with `static-server` ([#6342])

[#6342]: https://github.com/openstreetmap/iD/issues/6342
[#6249]: https://github.com/openstreetmap/iD/issues/6249
[#6245]: https://github.com/openstreetmap/iD/issues/6245
[#6237]: https://github.com/openstreetmap/iD/issues/6237
[#6086]: https://github.com/openstreetmap/iD/issues/6086
[#6054]: https://github.com/openstreetmap/iD/issues/6054
[#5901]: https://github.com/openstreetmap/iD/issues/5901

#### :mortar_board: Walkthrough / Help
- Make the keyboard shorcuts viewable on narrow window sizes ([#6174])

[#6174]: https://github.com/openstreetmap/iD/issues/6174

#### :rocket: Presets
- Add presets for Test Prep School, Financial Advisor
- Add more terms to Transit Shelter preset ([#6381])
- Add preset for Online Retailer Outpost `shop=outpost`
- Support `natural=bay` on lines ([#6379])
- Show the wheelchair and curb fields for all curb presets, improve icons ([#6360])
- Add preset for Chain barrier ([#6340], thanks [@westnordost])
- Add preset for Height Restrictor ([#6339], thanks [@westnordost])
- Add preset for Emergency Stopping Place ([#6337], thanks [@westnordost])
- Add presets for common castle types ([#6321], thanks [@westnordost])
- Add Petting Zoo, Wildlife Park, and Safari Park presets ([#6317], thanks [@westnordost])
- Add Agricultural Engines Mechanic, Floorer, Joiner, and Parquet Layer presets ([#6316], thanks [@westnordost])
- Add Ambulatory Care preset ([#6315], thanks [@westnordost])
- Add Fire Hose preset ([#6314], thanks [@westnordost])
- Add Wastewater Basin ([#6313], thanks [@westnordost])
- Add presets for `natural=rock`, `natural=stone`, with boulder icons ([#6311], thanks [@westnordost])
- Display logos of brand presets ([#5167])
- Only show brand presets in their relevant countries ([#6124])
- Add presets for indoor mapping ([#6082])
- Add Building Part preset ([#6114])
- Add LGBTQ+ venue presets ([#5940], thanks [@rory])
- Add more fields to public transport route presets ([#6036], thanks [@nlehuby])
- Add Self-Service field and Self-Service Laundry preset ([#6260], thanks [@westnordost])
- Add Bicycle Parking Garage, Bicycle Lockers, and Bicycle Shed presets ([#6259], thanks [@westnordost])
- Add Bust, Graffiti, and Art Installation presets ([#6275], thanks [@westnordost])
- Add cycleway crossing presets ([#6065])
- Add standalone Tactile Paving presets ([#6015])
- Add Toy Library preset ([#5390])
- Add Social Center preset ([#6077])
- Add Raised Curb and Rolled Curb ([#6080])
- Add Cycle & Foot Path preset ([#6070])
- Add Railway Under Construction preset ([#6151])
- Add Underwear Store preset ([#6152])
- Add Cannabis Shop preset ([#6301])
- Add Turnstile, Monorail Route, and Stop Area Group presets ([#5757])
- Add Shingle preset ([#6155])
- Add presets: Zip Line, Jet Bridge, Windsock, Convention Center, Events Venue, Underground Parking, Ambulatory Care, Chain, Height Restrictor, Houseboat, Hangar Building, Fire Hose, Emergency Stopping Bay, Trailhead, Commemorative Plaque, Horseshoes Pit, Shuffleboard Court, Natural Swimming Area, Cycling Track, Beacon, Beehive, Summit Cross, Levee, Mineshaft, Underground Pipeline, Street Cabinet, Tunnel, Cape, Valley, Wastewater Basin, Water Turbine, Boat Store, Tabletop Game Store, General Store, Lighting Store, Data Center, Trail Marker, Information Terminal, Canal Lock, Lock Gate
- Update Embassy and add Consulate, Liaison Office, and Diplomatic Office presets ([#6144])
- Update golf path presets to use highway tags ([#6165])
- Add Flood Prone field to minor roads ([#6117])
- Add Operator field to Car Wash preset ([#6233])
- Add Building Height and Building Levels fields to some presets when they are buildings ([#6238])
- Display Internet Access Fee field directly after setting Internet Access in more cases ([#6265])
- Add Floating field to piers and Floating Pier preset
- Add Fishing field to water presets
- Add Air Conditioning field to some points of interest
- Add Type field to Guest House preset
- Add High-Speed Rail field and preset
- Add Manufacturer field to some infrastructure presets
- Add Max Weight field to roads and paths that are bridges
- Add Microbrewery field and Brewpub preset
- Add Payment Types field to some presets when a fee is specified
- Add generic Playground Equipment and Emergency Feature presets with Type fields
- Add Reservations field to some amenities
- Add Screens field to cinemas
- Add Pit Latrine and Flush Toilet presets
- Add Handwashing and Positions fields to toilet presets
- Add Oneway field to some Aerialway presets
- Add Overhead Trolley Wires field to some highway presets
- Remove Curb field from crossings to encourage mapping curbs as nodes ([#6078])
- Use a less-confusing placeholder for the Hours field ([#6207])
- Add support for public domain icons from The Noun Project ([#5691])
- Improve the icon for Unmaintained Track Road ([#6088])
- Return missing icon to the old Train Platform preset ([#6020])
- Update icons for various presets such as Childcare, Photo Booth, Shower, Studio, and Garbage Dumpster
- Render route preset icons dynamically, indicating what line types are common members ([#5926])
- Change the swimmer icon so its head will not be missing when the icon is displayed on point markers ([#6307])
- Add more search terms to the Road Surface preset ([#6309])

[#6381]: https://github.com/openstreetmap/iD/issues/6381
[#6379]: https://github.com/openstreetmap/iD/issues/6379
[#6360]: https://github.com/openstreetmap/iD/issues/6360
[#6340]: https://github.com/openstreetmap/iD/issues/6340
[#6339]: https://github.com/openstreetmap/iD/issues/6339
[#6337]: https://github.com/openstreetmap/iD/issues/6337
[#6321]: https://github.com/openstreetmap/iD/issues/6321
[#6317]: https://github.com/openstreetmap/iD/issues/6317
[#6316]: https://github.com/openstreetmap/iD/issues/6316
[#6315]: https://github.com/openstreetmap/iD/issues/6315
[#6314]: https://github.com/openstreetmap/iD/issues/6314
[#6313]: https://github.com/openstreetmap/iD/issues/6313
[#6311]: https://github.com/openstreetmap/iD/issues/6311
[#6309]: https://github.com/openstreetmap/iD/issues/6309
[#6307]: https://github.com/openstreetmap/iD/issues/6307
[#6301]: https://github.com/openstreetmap/iD/issues/6301
[#6275]: https://github.com/openstreetmap/iD/issues/6275
[#6265]: https://github.com/openstreetmap/iD/issues/6265
[#6260]: https://github.com/openstreetmap/iD/issues/6260
[#6259]: https://github.com/openstreetmap/iD/issues/6259
[#6238]: https://github.com/openstreetmap/iD/issues/6238
[#6233]: https://github.com/openstreetmap/iD/issues/6233
[#6207]: https://github.com/openstreetmap/iD/issues/6207
[#6165]: https://github.com/openstreetmap/iD/issues/6165
[#6155]: https://github.com/openstreetmap/iD/issues/6155
[#6152]: https://github.com/openstreetmap/iD/issues/6152
[#6151]: https://github.com/openstreetmap/iD/issues/6151
[#6144]: https://github.com/openstreetmap/iD/issues/6144
[#6124]: https://github.com/openstreetmap/iD/issues/6124
[#6117]: https://github.com/openstreetmap/iD/issues/6117
[#6114]: https://github.com/openstreetmap/iD/issues/6114
[#6088]: https://github.com/openstreetmap/iD/issues/6088
[#6082]: https://github.com/openstreetmap/iD/issues/6082
[#6080]: https://github.com/openstreetmap/iD/issues/6080
[#6078]: https://github.com/openstreetmap/iD/issues/6078
[#6077]: https://github.com/openstreetmap/iD/issues/6077
[#6065]: https://github.com/openstreetmap/iD/issues/6065
[#6036]: https://github.com/openstreetmap/iD/issues/6036
[#6020]: https://github.com/openstreetmap/iD/issues/6020
[#6015]: https://github.com/openstreetmap/iD/issues/6015
[#5940]: https://github.com/openstreetmap/iD/issues/5940
[#5926]: https://github.com/openstreetmap/iD/issues/5926
[#5757]: https://github.com/openstreetmap/iD/issues/5757
[#5691]: https://github.com/openstreetmap/iD/issues/5691
[#5390]: https://github.com/openstreetmap/iD/issues/5390
[#5167]: https://github.com/openstreetmap/iD/issues/5167

[@rory]: https://github.com/rory
[@nlehuby]: https://github.com/nlehuby
[@westnordost]: https://github.com/westnordost

# 2.14.3
##### 2019-Feb-26

#### :tada: New Features
* Add a Rules section to the Issues pane where all validation types are listed and can be toggled on or off ([#5979])

[#5979]: https://github.com/openstreetmap/iD/issues/5979

#### :white_check_mark: Validation
* Flag multipolygon members without roles ([#5851])
* Don't flag lines tagged as areas if the tag is also allowed on lines ([#5933])
* Don't automatically add "highway=crossing" tag when connecting paths to Unmaintained Track Roads
* Deprecate "amenity=toilet" ([#5953]), "landuse=conservation" ([#5957]) and "building:color" ([#5956], thanks [@matkoniecz])
* Deprecate various "footway" ([#5935]) and "wood" ([#5958]) values
* Deprecate "highway=abandoned" ([#5968]), "natural=waterfall" ([#5972]), and "postcode" ([#5959])

[#5972]: https://github.com/openstreetmap/iD/issues/5972
[#5968]: https://github.com/openstreetmap/iD/issues/5968
[#5959]: https://github.com/openstreetmap/iD/issues/5959
[#5958]: https://github.com/openstreetmap/iD/issues/5958
[#5957]: https://github.com/openstreetmap/iD/issues/5957
[#5956]: https://github.com/openstreetmap/iD/issues/5956
[#5953]: https://github.com/openstreetmap/iD/issues/5953
[#5935]: https://github.com/openstreetmap/iD/issues/5935
[#5933]: https://github.com/openstreetmap/iD/issues/5933
[#5851]: https://github.com/openstreetmap/iD/issues/5851

[@matkoniecz]: https://github.com/matkoniecz

#### :bug: Bugfixes
* Fix error upon pressing escape when drawing an area  with only one point ([#5941], [#5950], thanks [@jguthrie100])
* Fix an issue where vertices would not snap to some nodes that could be vertices ([#5942])
* Fix an issue where pressing enter during feature type search would not select the first item ([#5921])
* Fix an issue where all feature types would be disabled if Other Features were hidden ([#5934])
* Fix an issue where the sidebar UI would flash when adding a node while drawing an area

[#5950]: https://github.com/openstreetmap/iD/issues/5950
[#5942]: https://github.com/openstreetmap/iD/issues/5942
[#5941]: https://github.com/openstreetmap/iD/issues/5941
[#5934]: https://github.com/openstreetmap/iD/issues/5934
[#5921]: https://github.com/openstreetmap/iD/issues/5921

[@jguthrie100]: https://github.com/jguthrie100

#### :hourglass: Performance
* Add option to turn off specific validation rules if they are slowing down iD ([#5979])

[#5979]: https://github.com/openstreetmap/iD/issues/5979

#### :rocket: Presets
* Add Bar field to Restuarant, Cafe, and Hotel ([#5947], [#5970], thanks [@alphagamer7])
* Rename Jeweler to Jewelry Store ([#5948])
* Add unsearchable generic Boundary preset ([#5975])
* Don't render roads with a "footway" tag too thin ([#5936])
* Allow Traffic Islands to be drawn as lines ([#5945])

[#5975]: https://github.com/openstreetmap/iD/issues/5975
[#5970]: https://github.com/openstreetmap/iD/issues/5970
[#5948]: https://github.com/openstreetmap/iD/issues/5948
[#5947]: https://github.com/openstreetmap/iD/issues/5947
[#5945]: https://github.com/openstreetmap/iD/issues/5945
[#5936]: https://github.com/openstreetmap/iD/issues/5936

[@alphagamer7]: https://github.com/alphagamer7


# 2.14.2
##### 2019-Feb-21

#### :white_check_mark: Validation
* Don't flag crossing way issues for proposed, razed, or abandoned features ([#5922])
* Don't flag lines or areas as untagged while they are being drawn
* Deprecate "amenity=public_building" tag ([#5916])

[#5922]: https://github.com/openstreetmap/iD/issues/5922
[#5916]: https://github.com/openstreetmap/iD/issues/5916

#### :bug: Bugfixes
* Fix an issue where all map data would be removed upon switching modes while drawing a line or area ([#5917])
* Fix an issue where cancelling line or area drawing could leave an extra error ([#5918])
* Show all warnings and errors in the save sidebar

[#5917]: https://github.com/openstreetmap/iD/issues/5917
[#5918]: https://github.com/openstreetmap/iD/issues/5918

#### :hourglass: Performance
* Speed up validation, particularly the crossing ways check ([#5923])

[#5923]: https://github.com/openstreetmap/iD/issues/5923

#### :rocket: Presets
* Rename Excrement Bag Vending Machine to Excrement Bag Dispenser ([#5920], thanks [@SelfishSeahorse])
* Add Covered field to waterway presets

[#5920]: https://github.com/openstreetmap/iD/issues/5920

[@SelfishSeahorse]: https://github.com/SelfishSeahorse


# 2.14.1
##### 2019-Feb-20

#### :bug: Bugfixes
* Fix an issue where ImproveOSM would not load due to non-HTTPS endpoints

# 2.14.0
##### 2019-Feb-20

#### :mega: Release Highlights
* :exclamation: iD now validates features while you edit! Select a feature to see its issues and access quick fixes.<br/>
_Open the new Issues pane (shortcut <kbd>I</kbd>) to browse all errors and warnings._
* :detective: You can now browse missing road data detected by [ImproveOSM](https://improveosm.org) from Telenav. Shoutout to [@SilentSpike] for working on this!<br/>
_Open the Map Data pane (shortcut <kbd>F</kbd>) and select "ImproveOSM Issues" to view detected data._

#### :tada: New Features
* Upgrade the validation system ([#5830], a group effort by [@quincylvania], [@bhousel], [@gaoxm], [@wonga00], [@chrisklaiber], [@abalosc1], [@maxgrossman], [@brianhatchl])
    * Update and show issues live during editing
    * Add an Issues pane
    * List issues in the feature sidebar
    * Recommend fixes
    * View more details below in the new :white_check_mark: **Validation** section of this changelog
* Integrate ImproveOSM data detection tools ([#5683], [#5739], thanks [@SilentSpike])

[#5830]: https://github.com/openstreetmap/iD/issues/5830
[#5683]: https://github.com/openstreetmap/iD/issues/5683
[#5739]: https://github.com/openstreetmap/iD/issues/5739

[@quincylvania]: https://github.com/quincylvania
[@bhousel]: https://github.com/bhousel
[@gaoxm]: https://github.com/gaoxm
[@wonga00]: https://github.com/wonga00
[@chrisklaiber]: https://github.com/chrisklaiber
[@abalosc1]: https://github.com/abalosc1
[@maxgrossman]: https://github.com/maxgrossman
[@brianhatchl]: https://github.com/brianhatchl
[@SilentSpike]: https://github.com/SilentSpike

#### :sparkles: Usability
* Don't close the open photo when toggling the photo overlay ([#5829], [#5836], thanks [@maxgrossman])
* Allow the up and down buttons to work on empty number fields ([#5844], [#5852], thanks [@AndreasHae])
* Render stroke previews for all line icons and don't show previews when line icons are used for areas ([#5839], [#5888])
* Open the area feature browser immediately after selecting the multipolygon relation type ([#5765])
* Render selected features on the map even if their layer is hidden ([#5880])
* When adding a duplicate tag, focus the existing key instead of adding a "_1" suffix ([#2896])
* Exclude tags already on object from auto-completion in the All tags list ([#3625])
* Allow tag values to be entered before keys ([#5872])
* Allow deletetion of tags while one is focused ([#5878])
* Make address field suggestions case sensitive ([#5887])
* Replace the "Edit or translate documentation" link text with a pencil icon ([#5753])
* When upload is disabled, show a tooltip on the button explaining the reason ([#5830])
* Don't squish the panes at narrow window widths ([#5890])

[#5829]: https://github.com/openstreetmap/iD/issues/5829
[#5836]: https://github.com/openstreetmap/iD/issues/5836
[#5844]: https://github.com/openstreetmap/iD/issues/5844
[#5852]: https://github.com/openstreetmap/iD/issues/5852
[#5839]: https://github.com/openstreetmap/iD/issues/5839
[#5888]: https://github.com/openstreetmap/iD/issues/5888
[#5765]: https://github.com/openstreetmap/iD/issues/5765
[#5880]: https://github.com/openstreetmap/iD/issues/5880
[#2896]: https://github.com/openstreetmap/iD/issues/2896
[#3625]: https://github.com/openstreetmap/iD/issues/3625
[#5872]: https://github.com/openstreetmap/iD/issues/5872
[#5878]: https://github.com/openstreetmap/iD/issues/5878
[#5887]: https://github.com/openstreetmap/iD/issues/5887
[#5753]: https://github.com/openstreetmap/iD/issues/5753
[#5830]: https://github.com/openstreetmap/iD/issues/5830
[#5890]: https://github.com/openstreetmap/iD/issues/5890

[@AndreasHae]: https://github.com/AndreasHae

#### :white_check_mark: Validation
* Flag crossing highways, railways, waterways, and buildings ([#1669], [#5217], [#5830], thanks [@gaoxm])
* Connect crossing lines with one click ([#5830])
* Flag highways that are very close but not connected to other highways ([#5830], thanks [@gaoxm])
* Connect very close highways with one click ([#5830])
* Prevent merging ways if it would cause self-intersection ([#5745], thanks [@jguthrie100])
* When drawing a way or dragging a vertex, don't snap to points that cannot be vertices ([#5811], [#5875], thanks [@maxgrossman])
* Flag more instances of lines tagged as areas ([#5830])
* Connect the endpoints of open areas with one click ([#5830])
* Flag more instances of deprecated tags ([#5830])
* Upgrade deprecated tags with one click ([#4591])
* Flag more instances of generic names ([#5830])
* Remove generic names with a single click ([#5830])
* Continue disconnected highways from the feature inspector ([#5830])
* Move a multipolygon's tags from its outer way to its relation with one click ([#5830])
* Flag relations without a "type" tag ([#5870], [#5830])
* Flag features with only meta tags like "source" or "created_by" ([#5830])
* Block the upload of untagged features ([#5830])
* Disable adding features of a hidden feature type to avoid redundant mapping ([#5876], [#5884])
* Don't count vertices when warning about many deletions ([#5830])

[#1669]: https://github.com/openstreetmap/iD/issues/1669
[#5217]: https://github.com/openstreetmap/iD/issues/5217
[#5745]: https://github.com/openstreetmap/iD/issues/5745
[#5811]: https://github.com/openstreetmap/iD/issues/5811
[#5875]: https://github.com/openstreetmap/iD/issues/5875
[#5870]: https://github.com/openstreetmap/iD/issues/5870
[#5876]: https://github.com/openstreetmap/iD/issues/5876
[#5884]: https://github.com/openstreetmap/iD/issues/5884
[#4591]: https://github.com/openstreetmap/iD/issues/4591
[#5830]: https://github.com/openstreetmap/iD/issues/5830

[@gaoxm]: https://github.com/gaoxm

#### :bug: Bugfixes
* Fix reversal of turn lanes when reversing a way ([#5674], [#5826], thanks [@SilentSpike])
* Fix photo overlay selection styling behavior ([#5494], [#5816], thanks [@SilentSpike])
* Add Junction field to highway presets ([#1264])
* Fix transit platforms drawn as areas turning into lines upon completion ([#5837])
* Don't replace spaces with underscores in Destinations and Destination Road Numbers fields ([#5842])
* Fix error upon deleting all tags and then adding one ([#5840])
* Fix issue where relation documentation could not be found ([#5860])
* Hide lines that are part of boundary relations when boundaries are hidden ([#5601])
* Fix mangling of the undo history when undoing while drawing a way  ([#5830])

[#5674]: https://github.com/openstreetmap/iD/issues/5674
[#5826]: https://github.com/openstreetmap/iD/issues/5826
[#5494]: https://github.com/openstreetmap/iD/issues/5494
[#5816]: https://github.com/openstreetmap/iD/issues/5816
[#1264]: https://github.com/openstreetmap/iD/issues/1264
[#5837]: https://github.com/openstreetmap/iD/issues/5837
[#5842]: https://github.com/openstreetmap/iD/issues/5842
[#5840]: https://github.com/openstreetmap/iD/issues/5840
[#5860]: https://github.com/openstreetmap/iD/issues/5860
[#5601]: https://github.com/openstreetmap/iD/issues/5601
[#5830]: https://github.com/openstreetmap/iD/issues/5830

[@SilentSpike]: https://github.com/SilentSpike

#### :earth_asia: Localization
* Update the Museum and Planetarium preset icons to not include the letter "M" ([#5751])
* Don't capitalize feature names in KeepRight messages in right-to-left layouts ([#5877])
* Keep the map still when resizing the sidebar in right-to-left layouts ([#5881])

[#5751]: https://github.com/openstreetmap/iD/issues/5751
[#5877]: https://github.com/openstreetmap/iD/issues/5877
[#5881]: https://github.com/openstreetmap/iD/issues/5881

#### :hourglass: Performance
* Optimize code tests by not reloading all presets for every test ([#5832])

[#5832]: https://github.com/openstreetmap/iD/issues/5832

#### :rocket: Presets
* Add Golf Cartpath, Golf Walking Path, and Driving Range presets ([#5859], [#5862], thanks [@chadrockey])
* Add Photo Booth preset ([#5892], [#5894], thanks [@danielwu830])
* Add Mexican Fast Food and Chess Table presets
* Add Climbing Gym, Bell Tower, Minaret, Sundial presets ([#5749], [#5772], [#5817], [#5771])
* Add Salt and Tidal fields to water presets ([#5822])
* Replace Passenger Information Display field with Departures Board field
* Add specialized rendering of Aerialways and Pistes ([#5843])
* Render Dam areas, Groynes, and Breakwaters as grey ([#5759])
* Render the borders of Construction areas as yellow
* Render barriers on area features again ([#5761])
* Improve Club icons ([#5854])
* Rename building=train_station preset to Train Station Building ([#5903])
* Make generic Land Use, Leisure, Amenity, Man Made, Natural, and Tourism presets unsearchable
* Add "box office" as a search term for Ticket Shop ([#5849])
* Add more search terms to various other Shops

[#5859]: https://github.com/openstreetmap/iD/issues/5859
[#5862]: https://github.com/openstreetmap/iD/issues/5862
[#5892]: https://github.com/openstreetmap/iD/issues/5892
[#5894]: https://github.com/openstreetmap/iD/issues/5894
[#5749]: https://github.com/openstreetmap/iD/issues/5749
[#5772]: https://github.com/openstreetmap/iD/issues/5772
[#5817]: https://github.com/openstreetmap/iD/issues/5817
[#5771]: https://github.com/openstreetmap/iD/issues/5771
[#5822]: https://github.com/openstreetmap/iD/issues/5822
[#5843]: https://github.com/openstreetmap/iD/issues/5843
[#5759]: https://github.com/openstreetmap/iD/issues/5759
[#5761]: https://github.com/openstreetmap/iD/issues/5761
[#5854]: https://github.com/openstreetmap/iD/issues/5854
[#5903]: https://github.com/openstreetmap/iD/issues/5903
[#5849]: https://github.com/openstreetmap/iD/issues/5849

[@chadrockey]: https://github.com/chadrockey
[@danielwu830]: https://github.com/danielwu830

# 2.13.1
##### 2019-Jan-28

#### :sparkles: Usability

* Activate combobox if user is switching from a different active combobox ([#5752])
* Prevent Chrome and Firefox autofill suggestions from appearing in fields like Address or Email  ([#5818])
* Restore the pointing hand cursor when hovering over combobox carets ([#5769])

[#5818]: https://github.com/openstreetmap/iD/issues/5818
[#5769]: https://github.com/openstreetmap/iD/issues/5769
[#5752]: https://github.com/openstreetmap/iD/issues/5752

#### :bug: Bugfixes

* Fix a few situations where user can leave a combobox but bad data remains ([#5825])
* Don't erase the Name field when tabbing from it ([#5760])
* Fix issue where the preset browser would appear after continuing an existing line ([#5770])
* Fix issue where optional Cycleway fields would not appear by default when the left and right lane values were equivalent ([#5756])
* Fix issue where optional `multiCombo` fields like Diet Types or Currency Types would not appear by default even if values existed ([#5764])

[#5825]: https://github.com/openstreetmap/iD/issues/5825
[#5756]: https://github.com/openstreetmap/iD/issues/5756
[#5760]: https://github.com/openstreetmap/iD/issues/5760
[#5764]: https://github.com/openstreetmap/iD/issues/5764
[#5770]: https://github.com/openstreetmap/iD/issues/5770

#### :mortar_board: Walkthrough / Help

* Show the left mouse icon where mentioned in the Background Imagery help

#### :rocket: Presets

* Restore the Basin preset ([#5758])
* Add Architect and Roof Color fields to Building presets
* Add Hours field to ATM ([#5750])
* Make the Hours field appear by default for Shop presets ([#5755])
* Add Hours field to Toilet
* Add Currency Type field to Shop
* Prevent the Name field from appearing by default on generic vertex features ([#5812])
* Make the Covered field appear by default for Drive-Through
* Add Covered field to various railway and amenity presets
* Add Building field to Carousel and Dark Ride area presets
* Add Name and Intermittent fields to Water
* Add Inscription field to Bench
* Add "water fountain" and its synonyms as search terms for Drinking Water
* Add "riverbank" as a search term for the River area preset
* Add additional search terms to Managed Forest

[#5750]: https://github.com/openstreetmap/iD/issues/5750
[#5755]: https://github.com/openstreetmap/iD/issues/5755
[#5758]: https://github.com/openstreetmap/iD/issues/5758
[#5812]: https://github.com/openstreetmap/iD/issues/5812

# 2.13.0
##### 2019-Jan-23

#### :mega: Release Highlights

* :zap: You can now browse and fix [KeepRight](https://wiki.openstreetmap.org/wiki/Keep_Right) data quality issues directly within iD. Many thanks to Thomas Hervey ([@thomas-hervey]) for his work on this!<br/>
_Open the Map Data pane (shortcut <kbd>F</kbd>) and select "KeepRight Issues" to view and fix map issues._
* :triangular_ruler: We've added support for [MapRules](https://github.com/radiant-maxar/maprules), an API service and web interface for creating and sharing reusable presets and validation rules.<br/>
_Check out the [maprules repo](https://github.com/radiant-maxar/maprules) for more info or watch Clarisse and Max's talk at SOTM-US [here](https://2018.stateofthemap.us/program/grossman-maprules.html)_
* :mag: You can now quickly center and zoom the map on any feature, note, or data issue!<br/>
_Click the new "zoom to" link on the sidebar under the preset icon, or press <kbd>Z</kbd> keyboard shortcut to focus on the selected feature._

[@thomas-hervey]: https://github.com/thomas-hervey

#### :tada: New Features

* Integrate with Keep Right QA tools ([#3452], [#5201], thanks [@thomas-hervey])
* Show the location when geolocating the user ([#5587], [#5629], thanks [@maxgrossman])
* Add MapRules service and parameters to use it ([#5617], thanks [@maxgrossman])
* Add button to zoom to the selected feature ([#5169])
* Display some preset fields conditionally based on tags ([#5581], [#5583])
* Add validation check for generic feature names ([#5590])
* Support `{wkid}`, `{w}`, `{s}`, `{n}`, and `{e}` tokens in WMS-style background imagery templates ([#5738], thanks [@1ec5])

[#3452]: https://github.com/openstreetmap/iD/issues/3452
[#5201]: https://github.com/openstreetmap/iD/issues/5201
[#5590]: https://github.com/openstreetmap/iD/issues/5590
[#5169]: https://github.com/openstreetmap/iD/issues/5169
[#5738]: https://github.com/openstreetmap/iD/issues/5738
[#5617]: https://github.com/openstreetmap/iD/issues/5617
[#5581]: https://github.com/openstreetmap/iD/issues/5581
[#5583]: https://github.com/openstreetmap/iD/issues/5583
[#5587]: https://github.com/openstreetmap/iD/issues/5587
[#5629]: https://github.com/openstreetmap/iD/issues/5629
[@maxgrossman]: https://github.com/maxgrossman
[@1ec5]: https://github.com/1ec5
[@thomas-hervey]: https://github.com/thomas-hervey

#### :sparkles: Usability

* Open the combobox when clicking anywhere in the text field ([#5596], [#5636], thanks [@maxgrossman])
* Add close buttom to the save sidebar ([#5614], [#5622], thanks [@maxgrossman])
* Render reservoirs and fountains with the water fill pattern ([#5606], thanks [@RudyTheDev])
* Render marine barriers with a blue stroke ([#5606], thanks [@RudyTheDev])
* Press enter to submit values in combo fields without deselecting the feature ([#5725])
* Hide combobox caret when there are no suggestions ([#5730])
* Show the editor instead of the preset browser when selecting untagged features ([#5632])
* Match the widths of the add tag and relation buttons to other controls ([#5729])
* Animate simultaneous zooming and positioning of the map in various cases ([#3967])
* Enforce stricter rules for line vs. area styles ([#5602])
* Don't style the active drawing vertex as a large endpoint when styling lines ([#5711])
* Render baseball fields, softball fields, and non-motorsport tracks in yellow
* Style multipolygons as areas instead of lines
* Style the icons of building-like presets like buildings

[#5730]: https://github.com/openstreetmap/iD/issues/5730
[#5729]: https://github.com/openstreetmap/iD/issues/5729
[#5725]: https://github.com/openstreetmap/iD/issues/5725
[#5711]: https://github.com/openstreetmap/iD/issues/5711
[#5602]: https://github.com/openstreetmap/iD/issues/5602
[#5596]: https://github.com/openstreetmap/iD/issues/5596
[#5636]: https://github.com/openstreetmap/iD/issues/5636
[#5622]: https://github.com/openstreetmap/iD/issues/5622
[#5614]: https://github.com/openstreetmap/iD/issues/5614
[#5606]: https://github.com/openstreetmap/iD/issues/5606
[#5632]: https://github.com/openstreetmap/iD/issues/5632
[#3967]: https://github.com/openstreetmap/iD/issues/3967
[@RudyTheDev]: https://github.com/RudyTheDev
[@maxgrossman]: https://github.com/maxgrossman

#### :bug: Bugfixes

* Remove highlight from relation member after it is deleted from relation ([#5612], [#5638], thanks [@maxgrossman])
* Fix an error where nodes could not be found after a data restore and the save interface would not appear ([#4108])
* Fix crash in the relation member editor when tabbing away from the role ([#5731])
* Fix an issue where sections of the Map Data and Background panes might not display ([#5743])
* Fix a visual glitch where the buttons in the top bar could wrap in an undesirable way ([#5746])

[#5746]: https://github.com/openstreetmap/iD/issues/5746
[#5743]: https://github.com/openstreetmap/iD/issues/5743
[#5731]: https://github.com/openstreetmap/iD/issues/5731
[#5612]: https://github.com/openstreetmap/iD/issues/5612
[#5638]: https://github.com/openstreetmap/iD/issues/5638
[#4108]: https://github.com/openstreetmap/iD/issues/4108
[@maxgrossman]: https://github.com/maxgrossman

#### :earth_asia: Localization

* Fetch multilingual tag descriptions and images from the OSM Wikibase ([#5647], thanks [@nyurik])
* Set the localization via a URL parameter ([#5644], [#5650], thanks [@tordans])
* Fix misaligned labels in the right-to-left layout ([#5687], [#5692], [#5699], [#5705], thanks [@iriman])
* Press <kbd>²</kbd> to toggle the sidebar on AZERTY keboards ([#5663])
* Press <kbd>?</kbd> to toggle the help pane regardless of the localization ([#5663])
* Display translated names and descriptions of more background sources ([#5737])

[#5737]: https://github.com/openstreetmap/iD/issues/5737
[#5663]: https://github.com/openstreetmap/iD/issues/5663
[#5647]: https://github.com/openstreetmap/iD/issues/5647
[#5644]: https://github.com/openstreetmap/iD/issues/5644
[#5650]: https://github.com/openstreetmap/iD/issues/5650
[#5687]: https://github.com/openstreetmap/iD/issues/5687
[#5692]: https://github.com/openstreetmap/iD/issues/5692
[#5699]: https://github.com/openstreetmap/iD/issues/5699
[#5705]: https://github.com/openstreetmap/iD/issues/5705
[@nyurik]: https://github.com/nyurik
[@tordans]: https://github.com/tordans
[@iriman]: https://github.com/iriman

#### :hourglass: Performance

* Don't update closed sections of the Map Data and Background panes

#### :rocket: Presets

* Add Frozen Food preset for `shop=frozen_food`
* Add Fuel, Fireplace, Fishing, Hunting, and Drinking Water Shop presets ([#5651], [#5653], thanks [@hikemaniac])
* Add Racetrack (Horse Racing) preset ([#5620])
* Add Enforcement relation preset ([#5610])
* Add Netball Court and Australian Football Field presets ([#5604], [#5605])
* Add RV Dealership preset for `shop=caravan`
* Change tags of Reservoir, replace Riverbank with River area preset, and add Canal and Stream area presets ([#5591])
* Add Destinations, Destination Road Numbers, Junction Number, and Destination Symbols fields to Link highways ([#4178])
* Add Diet Types field to Restaurant, Cafe, Fast Food, and Supermarket ([#5580])
* Add Minimum Speed Limit field to Motorway and Trunk Road
* Add Dogs field to Foot Path, Park, and more to specify if dogs are allowed
* Add One Way (Bicycle) field to roads to specify if bikes are exempt from one way restrictions
* Add Incline and Smoothness fields to Foot Path, Cycle Path, and more
* Embed name of religion in all Place of Worship labels ([#5611])
* Rename Forest to Managed Forest ([#5709])
* Update icons for Chair Lift, Plumber, Car Wash, Real Estate Agent, and more ([via `scottdejonge/map-icons`], thanks [@scottdejonge])
* Add "real estate" as a search term for Estate Agent ([#5724], thanks [@CloCkWeRX])
* Let presets inherit fields from other presets ([#5710], [#5712])
* Reduce the use of universal fields ([#5719])
* Add more fields to the `Add field:` dropdown of various presets

[via `scottdejonge/map-icons`]: https://github.com/bhousel/temaki/issues/2
[#5709]: https://github.com/openstreetmap/iD/issues/5709
[#5620]: https://github.com/openstreetmap/iD/issues/5620
[#5611]: https://github.com/openstreetmap/iD/issues/5611
[#5610]: https://github.com/openstreetmap/iD/issues/5610
[#5591]: https://github.com/openstreetmap/iD/issues/5591
[#5580]: https://github.com/openstreetmap/iD/issues/5580
[#5651]: https://github.com/openstreetmap/iD/issues/5651
[#5653]: https://github.com/openstreetmap/iD/issues/5653
[#5710]: https://github.com/openstreetmap/iD/issues/5710
[#5712]: https://github.com/openstreetmap/iD/issues/5712
[#5719]: https://github.com/openstreetmap/iD/issues/5719
[#5724]: https://github.com/openstreetmap/iD/issues/5724
[#4178]: https://github.com/openstreetmap/iD/issues/4178
[#5604]: https://github.com/openstreetmap/iD/issues/5604
[#5605]: https://github.com/openstreetmap/iD/issues/5605
[@scottdejonge]: https://github.com/scottdejonge
[@hikemaniac]: https://github.com/hikemaniac
[@CloCkWeRX]: https://github.com/CloCkWeRX


# 2.12.2
##### 2018-Dec-13

#### :tada: New Features
* Add `"moreFields"` property so a preset can control the fields shown in the "Add field" dropdown ([#4871], [#5582], thanks [@quincylvania])

[#5582]: https://github.com/openstreetmap/iD/issues/5582
[#4871]: https://github.com/openstreetmap/iD/issues/4871
[@quincylvania]: https://github.com/quincylvania

#### :sparkles: Usability
* Improve mousewheel scrolling speed on Windows/Linux Firefox ([#5512])
* Render grass surface on traffic calming areas ([#5584], thanks [@RudyTheDev])
* Always show save count 0. Makes responsivness easier ([#5576])
* Make sure sidebar is expanded before entering walkthrough or saving ([#5574])
* Disable autocomplete on the brand suggestion combo ([#5558])
* Don't automatically pop up the combobox when the field receives focus
  (User can click carat, press down arrow, or start typing to make it appear)
* Make sure combobox can always receive arrow and esc keyboard events

[#5584]: https://github.com/openstreetmap/iD/issues/5584
[#5576]: https://github.com/openstreetmap/iD/issues/5576
[#5574]: https://github.com/openstreetmap/iD/issues/5574
[#5558]: https://github.com/openstreetmap/iD/issues/5558
[#5512]: https://github.com/openstreetmap/iD/issues/5512
[@RudyTheDev]: https://github.com/RudyTheDev

#### :bug: Bugfixes
* Fix broken member role dropdown for members that are not downloaded ([#5592])
* Fix relation member role value not persisting in some situations ([#4900], [#5449])
* Fix rendering of raw membership editor new row ([#5589])
* Avoid leaving relations modified when modifications to them are undone ([#5458])
* Fix handling of semicolon delimited values in numeric field e.g. multiple `direction` ([#5438])
* If imagery becomes invalid, remove it from imagery_used ([#4827])
* Don't add "None" to `imagery_used` tag when other imagery was used ([#5565])
* Make sure dropdowns don't remain visible ([#5575])
* Make sure delete button can always delete all the brand suggestion tags ([#5573])
* Fix rendering of combobox near bottom of sidebar when using up/down arrows
  (Before, `scrollIntoView` would move the entire map container)

[#5592]: https://github.com/openstreetmap/iD/issues/5592
[#5589]: https://github.com/openstreetmap/iD/issues/5589
[#5575]: https://github.com/openstreetmap/iD/issues/5575
[#5573]: https://github.com/openstreetmap/iD/issues/5573
[#5565]: https://github.com/openstreetmap/iD/issues/5565
[#5458]: https://github.com/openstreetmap/iD/issues/5458
[#5449]: https://github.com/openstreetmap/iD/issues/5449
[#5438]: https://github.com/openstreetmap/iD/issues/5438
[#4900]: https://github.com/openstreetmap/iD/issues/4900
[#4827]: https://github.com/openstreetmap/iD/issues/4827

#### :earth_asia: Localization
* Use user's locale for fetching wikidata label/description ([#5563])

[#5563]: https://github.com/openstreetmap/iD/issues/5563

#### :hourglass: Performance
* Don't create hidden/universal fields until they are actually needed
* Don't render contents of collapsed sections (e.g. hidden raw tag editor)
* Don't recreate as many comboboxes on every render ([#5568])
  * :warning: Code refactor - Move lib/d3.combobox.js -> ui/combobox.js

[#5568]: https://github.com/openstreetmap/iD/issues/5568

#### :rocket: Presets
* Make separate presets for "Apartment Building" and "Apartment Complex" ([#5594], thanks [@kreed])
* Allow some kinds of traffic calmings to be mapped as areas ([#5562])
* Add `basin=*` Type and `intermittent` fields to Basin preset ([#5497])
* Add an icon for Grit Bin preset
* Lowered the match score for the Wi-Fi Hotspot preset ([#5560], [#5561], [@quincylvania])

[#5594]: https://github.com/openstreetmap/iD/issues/5594
[#5562]: https://github.com/openstreetmap/iD/issues/5562
[#5561]: https://github.com/openstreetmap/iD/issues/5561
[#5560]: https://github.com/openstreetmap/iD/issues/5560
[#5497]: https://github.com/openstreetmap/iD/issues/5497
[@kreed]: https://github.com/kreed
[@quincylvania]: https://github.com/quincylvania


# 2.12.1
##### 2018-Dec-05

#### :bug: Bugfixes
* Fix bug preventing walkthrough from starting ([#5553], [#5555], thanks [@quincylvania])
* Fix bug causing tooltips on background pane not to disappear ([#5551])

[#5555]: https://github.com/openstreetmap/iD/issues/5555
[#5553]: https://github.com/openstreetmap/iD/issues/5553
[#5551]: https://github.com/openstreetmap/iD/issues/5551
[@quincylvania]: https://github.com/quincylvania


# 2.12.0
##### 2018-Dec-03

#### :mega: Release Highlights
* :v: Mac users can now use 2 finger trackpad gestures to pan and zoom the map.<br/>
_Try swiping with 2 fingers to pan, or pinching out/in to zoom and unzoom. You'll be less likely to accidentally drag nodes!_
* :small_red_triangle_down: iD now draws triangular markers on the "down" side of ways where the direction matters.  Thanks, Huon Wilson [@huonw] for this feature!</br>
_Ways with a direction include cliffs, coastlines, retaining walls, kerbs, guard rails, embankments._
* :left_right_arrow: You can now resize the sidebar, or hide it completely. Shout out to Quincy Morgan [@quincylvania] for his work on this!</br>
_Try dragging the sidebar to resize it, or click the hide button in the top toolbar. The top bar buttons can also shrink on narrower screens._
* :hamburger: We've released a huge upgrade to the [brand name suggestions](https://github.com/osmlab/name-suggestion-index) in iD. Thank you to [everyone who volunteered](https://github.com/osmlab/name-suggestion-index/issues/2034) to match brand names to their proper OpenStreetMap tags.</br>
_Try adding some branded businesses to the map - `brand`, `brand:wikidata`, and other tags will be set for you._
* :paperclip: More Wikidata integration! iD now displays linked data if a feature has a `wikidata` tag, and will protect fields like `name` and `brand` from direct editing.<br/>
_Make sure prominent features have a Wikidata tag, for added protection against accidental changes._
* :high_brightness: More features for working with relations. Hovering over a relation or member in the sidebar will highlight it on the map. You can also download incomplete sections, and zoom to inspect relation children. Thanks, Quincy Morgan [@quincylvania]!<br/>
_Check out the "All Relations" and "All Members" sections of the sidebar to try out the new relation editing tools._
* :octocat: Hacktoberfest happened!  We merged 40 pull requests during the month of October.  Thank you to all of our new contributors!<br/>

[@huonw]: https://github.com/huonw
[@quincylvania]: https://github.com/quincylvania

#### :tada: New Features
* Make `name`, `brand` fields readonly when there is a `wikidata` or `brand:wikidata` tag ([#5515])
  (Users may still delete the name field or edit the tags manually)
* Add a Wikidata field ([#4382], [#5500], thanks [@quincylvania])
* Display triangular markers along ways with a "lower" direction (e.g. `natural=cliff`). ([#1475], [#5529], thanks [@huonw])
* Upgrade the brand name presets from new [name-suggestion-index](https://github.com/osmlab/name-suggestion-index):
  * Display name suggestion presets on 2 lines ([#5514])
  * Offer up to 10 brand name suggestions in the name field, show preset type alongside brand name
  * :warning: Code refactor - remove `dataSuggestions` and `utilSuggestNames` functions
* Add `context.keybinding` for keybindings that don't change ([#5487])
  * :warning: Code refactor - Move `lib/d3.keybinding.js` -> `util/keybinding.js`
* The sidebar can be now be resized by dragging the divider ([#3447], [#5443], thanks [@quincylvania])
  * There is also a new button in the top tool bar, and keyboard shortcut to toggle the sidebar
* Add hover-highlighting to the selected features list ([#5404], thanks [@quincylvania])
* Add hover-highlighting for relations in the raw membership list ([#2946], [#5402], [#5429], thanks [@quincylvania])
* Add a button to zoom to a relation child ([#5405], thanks [@quincylvania])
* Add a button to download an undownloaded relation child ([#2284], [#5396], thanks [@quincylvania])
* Display type (node, way, or relation) in the name of undownloaded relation children ([#5399], thanks [@quincylvania])

[#5529]: https://github.com/openstreetmap/iD/issues/5529
[#5515]: https://github.com/openstreetmap/iD/issues/5515
[#5514]: https://github.com/openstreetmap/iD/issues/5514
[#5500]: https://github.com/openstreetmap/iD/issues/5500
[#5487]: https://github.com/openstreetmap/iD/issues/5487
[#5443]: https://github.com/openstreetmap/iD/issues/5443
[#5429]: https://github.com/openstreetmap/iD/issues/5429
[#5405]: https://github.com/openstreetmap/iD/issues/5405
[#5404]: https://github.com/openstreetmap/iD/issues/5404
[#5402]: https://github.com/openstreetmap/iD/issues/5402
[#5399]: https://github.com/openstreetmap/iD/issues/5399
[#5396]: https://github.com/openstreetmap/iD/issues/5396
[#4382]: https://github.com/openstreetmap/iD/issues/4382
[#3447]: https://github.com/openstreetmap/iD/issues/3447
[#2946]: https://github.com/openstreetmap/iD/issues/2946
[#2284]: https://github.com/openstreetmap/iD/issues/2284
[#1475]: https://github.com/openstreetmap/iD/issues/1475
[@huonw]: https://github.com/huonw
[@quincylvania]: https://github.com/quincylvania

#### :sparkles: Usability
* Redraw restrictions editor when resizing sidebar ([#5474], [#5502], thanks [@jguthrie100])
* Add support for 2-finger pan and zoom gestures on Mac computers ([#5492])
* Improve rendering for more leisure objects (`track`, `golf_course`, `garden`) ([#5526], thanks [@hikemaniac])
* Improve rendering for `attraction=water_slide` ([#5522], thanks [@hikemaniac])
* Use green stroke to render `barrier=hedge` ([#5459], thanks [@quincylvania])
* More responsive sidebar and toolbar ([#4356], [#5455])
  * Adjusts save count padding slightly ([#5509],thanks [@quincylvania])
  * Display icons only (no labels) on very narrow width toolbar
  * Better management of button widths in the sidebar ([#5467], thanks [@quincylvania])
* Adds more fill patterns to areas ([#5489], [#5499], thanks [@RudyTheDev])
* Update Icons (Maki upgraded to v5, FontAwesome upgraded to v5.5)
* Preserve extra space at bottom of inspector to allow for dropdown options ([#5280])
* Better undo tooltips when connecting points ([#1252], [#5468], thanks [@quincylvania])
* Display ways with `location=underwater` same as `location=underground` ([#5442], thanks [@quincylvania])
* Improve rendering of `man_made=pipeline` ([#5392], thanks [@quincylvania])
* Improve rendering of ferry routes ([#5414], [#5416], thanks [@quincylvania])
* Improve keyboard navigation of the preset selection menu ([#5304], thanks [@quincylvania])
* Make "search worldwide" button look like a button ([#5386], thanks [@jguthrie100])
* Make OpenTopoMap imagery layer available ([#5277])

[#5526]: https://github.com/openstreetmap/iD/issues/5526
[#5522]: https://github.com/openstreetmap/iD/issues/5522
[#5509]: https://github.com/openstreetmap/iD/issues/5509
[#5502]: https://github.com/openstreetmap/iD/issues/5502
[#5499]: https://github.com/openstreetmap/iD/issues/5499
[#5492]: https://github.com/openstreetmap/iD/issues/5492
[#5489]: https://github.com/openstreetmap/iD/issues/5489
[#5474]: https://github.com/openstreetmap/iD/issues/5474
[#5468]: https://github.com/openstreetmap/iD/issues/5468
[#5467]: https://github.com/openstreetmap/iD/issues/5467
[#5459]: https://github.com/openstreetmap/iD/issues/5459
[#5455]: https://github.com/openstreetmap/iD/issues/5455
[#5442]: https://github.com/openstreetmap/iD/issues/5442
[#5416]: https://github.com/openstreetmap/iD/issues/5416
[#5414]: https://github.com/openstreetmap/iD/issues/5414
[#5392]: https://github.com/openstreetmap/iD/issues/5392
[#5386]: https://github.com/openstreetmap/iD/issues/5386
[#5304]: https://github.com/openstreetmap/iD/issues/5304
[#5280]: https://github.com/openstreetmap/iD/issues/5280
[#5277]: https://github.com/openstreetmap/iD/issues/5277
[#4356]: https://github.com/openstreetmap/iD/issues/4356
[#1252]: https://github.com/openstreetmap/iD/issues/1252
[@RudyTheDev]: https://github.com/RudyTheDev
[@jguthrie100]: https://github.com/jguthrie100
[@quincylvania]: https://github.com/quincylvania

#### :bug: Bugfixes
* Prevent Mapillary signs and markers from flickering as the user pans the map ([#4297])
* Don't snap notes to OSM elements ([#5191])
* Avoid requesting imagery and data from wrapped world past antimeridian ([#5485])
* Adjust layer ordering to draw touch targets above data layers ([#5257], [#5479])
* Fix background imagery with multiple outer rings ([#5264], [#5250], [#5272])
* Use new Mapillary API calls for features and signs ([#5374], [#5395], thanks [@cbeddow])
* Exclude non-searchable presets from the preset recently-used list ([#5450])
* Don't give boost to autocompleted tag values because they have a wiki page ([#5460], [#5461], thanks [@matkoniecz])
* Adding a new point on a way now adds a vertex, not a standalone point ([#5409], [#5413], thanks [@quincylvania])
* Treat multicombo values other than 'no' and '' as if they are set ([#5291])
* Fix bug preventing use of gpx files with an uppercase file extension ([#5266], thanks [@JamesKingdom])

[#5485]: https://github.com/openstreetmap/iD/issues/5485
[#5479]: https://github.com/openstreetmap/iD/issues/5479
[#5461]: https://github.com/openstreetmap/iD/issues/5461
[#5460]: https://github.com/openstreetmap/iD/issues/5460
[#5450]: https://github.com/openstreetmap/iD/issues/5450
[#5413]: https://github.com/openstreetmap/iD/issues/5413
[#5409]: https://github.com/openstreetmap/iD/issues/5409
[#5395]: https://github.com/openstreetmap/iD/issues/5395
[#5374]: https://github.com/openstreetmap/iD/issues/5374
[#5291]: https://github.com/openstreetmap/iD/issues/5291
[#5272]: https://github.com/openstreetmap/iD/issues/5272
[#5266]: https://github.com/openstreetmap/iD/issues/5266
[#5264]: https://github.com/openstreetmap/iD/issues/5264
[#5257]: https://github.com/openstreetmap/iD/issues/5257
[#5250]: https://github.com/openstreetmap/iD/issues/5250
[#5191]: https://github.com/openstreetmap/iD/issues/5191
[#4297]: https://github.com/openstreetmap/iD/issues/4297
[@cbeddow]: https://github.com/cbeddow
[@JamesKingdom]: https://github.com/JamesKingdom
[@matkoniecz]: https://github.com/matkoniecz
[@quincylvania]: https://github.com/quincylvania

#### :earth_asia: Localization
* Localize combo box tooltip descriptions ([#5523], [#5524], thanks [@jguthrie100])
* Switch parking icons from "P" to car icon ([#5341])

[#5524]: https://github.com/openstreetmap/iD/issues/5524
[#5523]: https://github.com/openstreetmap/iD/issues/5523
[#5341]: https://github.com/openstreetmap/iD/issues/5341
[@jguthrie100]: https://github.com/jguthrie100

#### :hourglass: Performance
* Avoid reflow caused by restriction editor checking its dimensions
* Memoize `preset.match` - this slightly speeds up some things, including label rendering
* Don't lookup or autocomplete `postal_code` values from taginfo

#### :mortar_board: Walkthrough / Help
* Setup data layers and sidebar before starting the walkthrough ([#5136])
* When switching chapters in Help, return to the top ([#5439], [#5441], thanks [@n42k])
* Fix crash if user cancels drawing of Tulip Road in walkthrough ([#5295])

[#5441]: https://github.com/openstreetmap/iD/issues/5441
[#5439]: https://github.com/openstreetmap/iD/issues/5439
[#5295]: https://github.com/openstreetmap/iD/issues/5295
[#5136]: https://github.com/openstreetmap/iD/issues/5136
[@n42k]: https://github.com/n42k

#### :rocket: Presets
* Add Flush Curb preset ([#5534], thanks [@quincylvania])
* Add Railing preset for `barrier=fence; fence_type=railing` ([#5532], thanks [@RudyTheDev])
* Add Guard Rail preset for `barrier=guard_rail` ([#5527], [#5528], thanks [@RudyTheDev])
* Update the Slipway preset with Name and Fee fields, allow vertex geometry, (thanks [@quincylvania])
* Add terms for the Parking Lot preset ([#5519], thanks [@quincylvania])
* Add missing presets for items in name-suggestion-index v1 ([#5510], [#5518], thanks [@quincylvania])
  * `amenity=money_transfer`
  * `amenity=payment_centre`
  * `amenity=payment_terminal`
  * `shop=catalogue`
  * `shop=country_store`
  * `shop=hairdresser_supply`
  * `shop=party`
* Add Communication, Mobile Phone, Television, and Radio Mast, Communication Tower presets ([#5486], thanks [@quincylvania])
* Add `office=religion` preset ([#5483], thanks [@Raubraupe])
* Add presets for common cuisines for `amenity=fast_food` and `amenity=restaurant` (thanks [@quincylvania])
* Add `leisure=fishing` preset ([#5469], [#5476], thanks [@xmile1])
* Switch embankment preset from `embankment=yes` to `man_made=embankment` ([#5344])
* Add `amenity=vehicle_inspection` preset ([#5453], thanks [@hikemaniac])
* Add `amenity=dive_centre` preset ([#5451], thanks [@hikemaniac])
* Add paved/unpaved surface style for `aeroway=taxiway` ([#5419], [#5422], thanks [@thefifthisa])
* Add preset and rendering for `attraction=summer_toboggan` ([#5447], thanks [@hikemaniac])
* Add `place=city_block` preset ([#5425], [#5432], thanks [@wvanderp])
* Add fields for To and From and add fields to all route presets ([#5408], [#5410], thanks [@castriganoj])
* Add `maxspeed` field to Speed Camera preset ([#5417], [#5421], thanks [@FrikanRw])
* Add takeaway field to cafe preset ([#5403], [#5418], thanks [@thefifthisa])
* Add "Garage" to the "Building Features" category ([#5375])
* Switch the generator/output/electricity field from text to typeCombo ([#5384], thanks [@quincylvania])
* Add Utility Infrastructure Category ([#5381], [#5382], thanks [@quincylvania])
* Add Underground Power Cable Preset ([#5380], [#5382], thanks [@quincylvania])
* Add Solar Panel Preset ([#5371], [#5372], thanks [@quincylvania])
* Add `backrest` `material` `seats` `colour` fields to Bench preset ([#5367], [#5387], thanks [@simonbilskyrollins])
* Adjust fields shown on piste presets, different types for "downhill" and "nordic" ([#5268], [#5368], [#5397], thanks [@yvecai])
* Add generic "Recycling" preset and field `recycling_type=container/center` ([#5363])
* Switch `crossing` presets to use `marked`/`unmarked`, retain `zebra` as unsearchable value
* Add escalator and moving walkway presets ([#5350], [#5365] thanks [@mchlp])
* Add Bridge Pier, Bridge Support presets ([#5337], [#5360], thanks [@nadyafebi])
* Add Amphitheatre preset ([#5349], [#5359], thanks [@enighter])
* Add Softball Field preset ([#5346], [#5357], thanks [@s-Hale])
* Rename Baseball Diamond to Baseball Field ([#5345], [#5357], thanks [@s-Hale])
* Add `design` field and improve search terms for `power=tower` preset ([#5334], [#5356], thanks [@hchho])
* Add Picnic Shelter preset ([#5347], [#5355], thanks [@programistka])
* Add Carport preset ([#5339], [#5353], thanks [@Stormheg])
* Add Multilevel Car Parking preset ([#5338], [#5352], thanks [@programistka])
* Add Transit Shelter preset ([#5348], [#5358], thanks [@enighter])
* Add presets for Traffic Sign, Speed Limit Sign, and City Limit Sign ([#5331], [#5333], thanks [@quincylvania])
* Add Lowered Curb preset ([#5327], [#5328], thanks [@quincylvania])
* Change "Pavilion" preset from an `amenity=shelter` to a `building=pavilion` ([#5292], [#5325])
* Add Operator, Country, Lit, Height, and Type fields to Flagpole preset ([#5315], [#5316], thanks [@quincylvania])
* Add Sculpture, Statue, and Mural presets, Material field ([#5309], [#5310], thanks [@quincylvania])
* Add Shipwreck preset for `historic=wreck`, also related fields ([#5302], [#5303], thanks [@quincylvania])
* Add Location, Length, Type fields to the Swimming Pool preset ([#5300], [#5301], thanks [@quincylvania])
* Add preset for Parcel Pickup Locker ([#5260])
* Add Lean-To and Gazebo presets, Fireplace checkbox field ([#5292], [#5293], thanks [@quincylvania])
* Add basic seamark presets and fields ([#5286], [#5297], thanks [@quincylvania])
  * Presets: Channel Buoy, Green Buoy, Red Buoy, Channel Beacon, Danger Beacon, Mooring
  * Fields: Category, Colour, Shape, and System, also universal Seamark field
* Add preset for `leisure=bandstand` ([#5259], [#5262], thanks [@AndreasHae])
* Add preset for `amenity=language_school` ([#5245], [#5261], thanks [@AndreasHae])
* Add preset for `shop=sewing` ([#5244], [#5267], thanks [@SilentSpike])
* Add presets for `highway=milestone` and `waterway=milestone` ([#5284])
* Add the Lit field to the Swimming Pool preset ([#5287], [#5288], thanks [@quincylvania])
* Add Advertising Column preset ([#5270], thanks [@tordans])
* Add WiFi Hotspot preset ([#5239], [#5251], thanks [@simonbilskyrollins])
* Add name, bridge type, layer and maxweight fields to Bridge preset ([#5269], thanks [@LaszloEr])

[#5534]: https://github.com/openstreetmap/iD/issues/5534
[#5532]: https://github.com/openstreetmap/iD/issues/5532
[#5528]: https://github.com/openstreetmap/iD/issues/5528
[#5527]: https://github.com/openstreetmap/iD/issues/5527
[#5519]: https://github.com/openstreetmap/iD/issues/5519
[#5518]: https://github.com/openstreetmap/iD/issues/5518
[#5510]: https://github.com/openstreetmap/iD/issues/5510
[#5486]: https://github.com/openstreetmap/iD/issues/5486
[#5483]: https://github.com/openstreetmap/iD/issues/5483
[#5476]: https://github.com/openstreetmap/iD/issues/5476
[#5469]: https://github.com/openstreetmap/iD/issues/5469
[#5453]: https://github.com/openstreetmap/iD/issues/5453
[#5451]: https://github.com/openstreetmap/iD/issues/5451
[#5447]: https://github.com/openstreetmap/iD/issues/5447
[#5432]: https://github.com/openstreetmap/iD/issues/5432
[#5425]: https://github.com/openstreetmap/iD/issues/5425
[#5422]: https://github.com/openstreetmap/iD/issues/5422
[#5421]: https://github.com/openstreetmap/iD/issues/5421
[#5419]: https://github.com/openstreetmap/iD/issues/5419
[#5418]: https://github.com/openstreetmap/iD/issues/5418
[#5417]: https://github.com/openstreetmap/iD/issues/5417
[#5410]: https://github.com/openstreetmap/iD/issues/5410
[#5408]: https://github.com/openstreetmap/iD/issues/5408
[#5403]: https://github.com/openstreetmap/iD/issues/5403
[#5397]: https://github.com/openstreetmap/iD/issues/5397
[#5387]: https://github.com/openstreetmap/iD/issues/5387
[#5384]: https://github.com/openstreetmap/iD/issues/5384
[#5382]: https://github.com/openstreetmap/iD/issues/5382
[#5381]: https://github.com/openstreetmap/iD/issues/5381
[#5380]: https://github.com/openstreetmap/iD/issues/5380
[#5375]: https://github.com/openstreetmap/iD/issues/5375
[#5372]: https://github.com/openstreetmap/iD/issues/5372
[#5371]: https://github.com/openstreetmap/iD/issues/5371
[#5368]: https://github.com/openstreetmap/iD/issues/5368
[#5367]: https://github.com/openstreetmap/iD/issues/5367
[#5365]: https://github.com/openstreetmap/iD/issues/5365
[#5363]: https://github.com/openstreetmap/iD/issues/5363
[#5360]: https://github.com/openstreetmap/iD/issues/5360
[#5359]: https://github.com/openstreetmap/iD/issues/5359
[#5358]: https://github.com/openstreetmap/iD/issues/5358
[#5357]: https://github.com/openstreetmap/iD/issues/5357
[#5356]: https://github.com/openstreetmap/iD/issues/5356
[#5355]: https://github.com/openstreetmap/iD/issues/5355
[#5353]: https://github.com/openstreetmap/iD/issues/5353
[#5352]: https://github.com/openstreetmap/iD/issues/5352
[#5350]: https://github.com/openstreetmap/iD/issues/5350
[#5349]: https://github.com/openstreetmap/iD/issues/5349
[#5348]: https://github.com/openstreetmap/iD/issues/5348
[#5347]: https://github.com/openstreetmap/iD/issues/5347
[#5346]: https://github.com/openstreetmap/iD/issues/5346
[#5345]: https://github.com/openstreetmap/iD/issues/5345
[#5344]: https://github.com/openstreetmap/iD/issues/5344
[#5339]: https://github.com/openstreetmap/iD/issues/5339
[#5338]: https://github.com/openstreetmap/iD/issues/5338
[#5337]: https://github.com/openstreetmap/iD/issues/5337
[#5334]: https://github.com/openstreetmap/iD/issues/5334
[#5333]: https://github.com/openstreetmap/iD/issues/5333
[#5331]: https://github.com/openstreetmap/iD/issues/5331
[#5328]: https://github.com/openstreetmap/iD/issues/5328
[#5327]: https://github.com/openstreetmap/iD/issues/5327
[#5325]: https://github.com/openstreetmap/iD/issues/5325
[#5316]: https://github.com/openstreetmap/iD/issues/5316
[#5315]: https://github.com/openstreetmap/iD/issues/5315
[#5310]: https://github.com/openstreetmap/iD/issues/5310
[#5309]: https://github.com/openstreetmap/iD/issues/5309
[#5303]: https://github.com/openstreetmap/iD/issues/5303
[#5302]: https://github.com/openstreetmap/iD/issues/5302
[#5301]: https://github.com/openstreetmap/iD/issues/5301
[#5300]: https://github.com/openstreetmap/iD/issues/5300
[#5297]: https://github.com/openstreetmap/iD/issues/5297
[#5293]: https://github.com/openstreetmap/iD/issues/5293
[#5292]: https://github.com/openstreetmap/iD/issues/5292
[#5288]: https://github.com/openstreetmap/iD/issues/5288
[#5287]: https://github.com/openstreetmap/iD/issues/5287
[#5286]: https://github.com/openstreetmap/iD/issues/5286
[#5284]: https://github.com/openstreetmap/iD/issues/5284
[#5270]: https://github.com/openstreetmap/iD/issues/5270
[#5269]: https://github.com/openstreetmap/iD/issues/5269
[#5268]: https://github.com/openstreetmap/iD/issues/5268
[#5267]: https://github.com/openstreetmap/iD/issues/5267
[#5262]: https://github.com/openstreetmap/iD/issues/5262
[#5261]: https://github.com/openstreetmap/iD/issues/5261
[#5260]: https://github.com/openstreetmap/iD/issues/5260
[#5259]: https://github.com/openstreetmap/iD/issues/5259
[#5251]: https://github.com/openstreetmap/iD/issues/5251
[#5245]: https://github.com/openstreetmap/iD/issues/5245
[#5244]: https://github.com/openstreetmap/iD/issues/5244
[#5239]: https://github.com/openstreetmap/iD/issues/5239
[@AndreasHae]: https://github.com/AndreasHae
[@castriganoj]: https://github.com/castriganoj
[@enighter]: https://github.com/enighter
[@FrikanRw]: https://github.com/FrikanRw
[@hchho]: https://github.com/hchho
[@hikemaniac]: https://github.com/hikemaniac
[@LaszloEr]: https://github.com/LaszloEr
[@mchlp]: https://github.com/mchlp
[@nadyafebi]: https://github.com/nadyafebi
[@programistka]: https://github.com/programistka
[@quincylvania]: https://github.com/quincylvania
[@Raubraupe]: https://github.com/Raubraupe
[@RudyTheDev]: https://github.com/RudyTheDev
[@s-Hale]: https://github.com/s-Hale
[@SilentSpike]: https://github.com/SilentSpike
[@simonbilskyrollins]: https://github.com/simonbilskyrollins
[@Stormheg]: https://github.com/Stormheg
[@thefifthisa]: https://github.com/thefifthisa
[@tordans]: https://github.com/tordans
[@wvanderp]: https://github.com/wvanderp
[@xmile1]: https://github.com/xmile1
[@yvecai]: https://github.com/yvecai


# 2.11.1
##### 2018-Aug-29

#### :bug: Bugfixes
* Fix handling of `.gpx` files passed in via url ([#5253])

[#5253]: https://github.com/openstreetmap/iD/issues/5253


# 2.11.0
##### 2018-Aug-26

#### :mega: Release Highlights
* :1234: We've rolled out support for vector tiles in iD! This work was done as part of [Princi Vershwal's 2018 Google Summer of Code project](https://medium.com/@vershwal/vector-tile-support-for-openstreetmaps-id-editor-40b1cb77f63b). Thanks [@vershwal]!<br/>
_Open the Map Data pane (shortcut <kbd>F</kbd>) and choose "Custom Map Data" to add a vector tile source._
* :trophy: To get ready for [State of the Map US](https://2018.stateofthemap.us/), let's make Detroit, USA the [best mapped city in the world](https://www.openstreetmap.us/2018/07/detroit-mapping-challenge-sotmus2018/)!  iD includes 3 vector tile layers of public data, built by [@jonahadkins], to support the Detroit Mapping Challenge.  More info is available on the [osmus/detroid-mapping-challenge repository](https://github.com/osmus/detroit-mapping-challenge).<br/>
_When mapping around Detroit, try out the special Detroit vector tile layers on the Map Data pane (shortcut <kbd>F</kbd>)_

[@vershwal]: https://github.com/vershwal
[@jonahadkins]: https://github.com/jonahadkins

#### :tada: New Features
* Add support for vector tile data ([#3742], [#5072], [#5243], thanks [@vershwal] and [@geohacker])
  * Replaced the "GPX"/"Local Data" layer with "Custom Map Data" on Map Data pane.
  * We've added several vector tile sources to the Map Data pane.  They will be available if the user is editing around Detroit.  This is a "Beta" feature to demonstrate the technology. (thanks [@jonahadkins])
  * :warning: We refactored `svgGpx`->`svgData` module, which now handles both data files and data from vector tile urls. (Important: the URL parameter for loading gpx files has **not** changed, and remains compatible with applications like the HOT Task Manager).
  * Added `serviceVectorTile` for fetching and caching data from vector tile servers, and merging and deduplicating features that cross tile boundaries.

[#5243]: https://github.com/openstreetmap/iD/issues/5243
[#5072]: https://github.com/openstreetmap/iD/issues/5072
[#3742]: https://github.com/openstreetmap/iD/issues/3742
[@vershwal]: https://github.com/vershwal
[@geohacker]: https://github.com/geohacker
[@jonahadkins]: https://github.com/jonahadkins

#### :sparkles: Usability
* Replace "Custom Imagery" alert box with a modal settings screen ([#5207], thanks [@vershwal])
  * This allows the user to see more of the url template, and makes copy/pasting easier. ([#4802], [#4806])
* Show selected note details on the History Panel ([#5158])
* Show location of selected note on the Measurement Panel ([#5158])
* Allow submit note comments with shortcut <kbd>cmd</kbd>+<kbd>enter</kbd> ([#5193])
* Disable note and streetview interactivity while the user is drawing ([#5202])

[#5207]: https://github.com/openstreetmap/iD/issues/5207
[#5202]: https://github.com/openstreetmap/iD/issues/5202
[#5193]: https://github.com/openstreetmap/iD/issues/5193
[#5158]: https://github.com/openstreetmap/iD/issues/5158
[#4806]: https://github.com/openstreetmap/iD/issues/4806
[#4802]: https://github.com/openstreetmap/iD/issues/4802
[@vershwal]: https://github.com/vershwal

#### :bug: Bugfixes
* Fix dragging of points and notes while a note is selected
* Fix shadow colors on restriction editor help screens ([#5248])
* Fix errors when using certain fields after saving to OSM or switching live/dev server ([#4898], [#5229])
* Fix issue causing uploads to never complete, when reusing an existing open changeset, e.g. conflict resolution (#5228)
* Fix 404 not found error when fetching metadata for Esri background imagery ([#5222], thanks [@jgravois])
* Prevent users from restoring history and saving duplicate changes after they start uploading a changeset ([#5200])
* Disable Add Note <kbd>'4'</kbd> shortcut when notes layer is not enabled ([#5190])
* Don't reverse cardinal direction roles on relations anymore ([#2004-comment])
* Allow float/decimal values for height field ([#5184], [#5198], thanks [@jguthrie100])

[#5248]: https://github.com/openstreetmap/iD/issues/5248
[#5229]: https://github.com/openstreetmap/iD/issues/5229
[#5228]: https://github.com/openstreetmap/iD/issues/5228
[#5222]: https://github.com/openstreetmap/iD/issues/5222
[#5200]: https://github.com/openstreetmap/iD/issues/5200
[#5198]: https://github.com/openstreetmap/iD/issues/5198
[#5190]: https://github.com/openstreetmap/iD/issues/5190
[#5184]: https://github.com/openstreetmap/iD/issues/5184
[#4898]: https://github.com/openstreetmap/iD/issues/4898
[#2004-comment]: https://github.com/openstreetmap/iD/pull/2004#issuecomment-407995998
[@jgravois]: https://github.com/jgravois
[@jguthrie100]: https://github.com/jguthrie100

#### :earth_asia: Localization
* Fix note status string to be translateable ([#5189])

[#5189]: https://github.com/openstreetmap/iD/issues/5189

#### :hourglass: Performance
* Speedup imagery index with which-polygon ([#5226])

[#5226]: https://github.com/openstreetmap/iD/issues/5226

#### :rocket: Presets
* Add "apothecary" as a search term for pharmacies and chemists ([#5235])
* Add `listed_status` to whitelist of tags that autocomplete uppercase ([#5231])
* Use Biergarten as the preset name, and don't add `building=yes` ([#5232])
* Add preset for `sport=badminton` ([#5233], thanks [@rene78])
* Add simple `access` field for several presets (campsite, picnic, bbq)
* Support `access=permit` in `access` and `access_simple` fields ([#5223])
* Change `stars` from integer field to combo, support capital 'S' ([#5216])
* Support building tags on gasometers and silos
* Add preset for `man_made=bunker_silo` ([#5157], [#5195], thanks [@manfredbrandl])
* Add `layer` field to a few more presets ([#5204], thanks [@Lukas458])
* Allow `tourism=artwork` on line geometry, silence `tag_suggests_area` warning ([#5206])

[#5235]: https://github.com/openstreetmap/iD/issues/5235
[#5233]: https://github.com/openstreetmap/iD/issues/5233
[#5232]: https://github.com/openstreetmap/iD/issues/5232
[#5231]: https://github.com/openstreetmap/iD/issues/5231
[#5223]: https://github.com/openstreetmap/iD/issues/5223
[#5216]: https://github.com/openstreetmap/iD/issues/5216
[#5206]: https://github.com/openstreetmap/iD/issues/5206
[#5204]: https://github.com/openstreetmap/iD/issues/5204
[#5195]: https://github.com/openstreetmap/iD/issues/5195
[#5157]: https://github.com/openstreetmap/iD/issues/5157
[@rene78]: https://github.com/rene78
[@manfredbrandl]: https://github.com/manfredbrandl
[@Lukas458]: https://github.com/Lukas458


# 2.10.0
##### 2018-Jul-26

#### :mega: Release Highlights
* :memo: You can now create, comment on, and resolve OpenStreetMap notes from within iD! This work was done as part of [Thomas Hervey's 2018 Google Summer of Code project](https://www.openstreetmap.org/user/Thomas_Hervey/diary/44449). Thanks [@thomas-hervey]!<br/>
_Activate the OpenStreetMap notes layer by opening the Map Data pane (shortcut <kbd>F</kbd>)_
* :wrench: We've added a new Detach Node operation to remove a tagged node from a way. Thanks [@Psigio]!<br/>
_With a node selected, use the right-click edit menu to find the Detach command (shortcut <kbd>E</kbd>)_
* :arrow_upper_right: The photo viewer (Mapillary, OpenStreetCam, and Bing Streetside) is now resizeable by dragging any of its edges.  Thanks [@kratico]!<br/>
_Try activating one of the streetlevel photo layers (shortcut <kbd>F</kbd>) and resizing the viewer._

[@thomas-hervey]: https://github.com/thomas-hervey
[@Psigio]: https://github.com/Psigio
[@kratico]: https://github.com/kratico

#### :tada: New Features
* Add support for OpenStreetMap notes ([#2629], [#5107], [#5162], thanks [@thomas-hervey] and [@kamicut])
* Add Detach Node operation ([#4320], [#5127], thanks [@Psigio])
* Add support for high resolution image tile sizes
  * This improves the appearance of the Mapbox Satellite layer and fixes the display of MTB-Norway layer ([#5179])
  * :warning: We refactored `d3.geo.tile`->`utilTiler`, `scaleExtent`->`zoomExtent` ([#5104], [#5148], thanks [@thomas-hervey])
  * :warning: `context.loadTiles` and a few other functions have changed arity - they no longer require a `dimensions` argument
* Add ability to resize Mapillary / OpenStreetCam / Bing Streetside photo viewer ([#5138], [#4930], thanks [@kratico])
* Add "View on Bing Maps" link and Forward/Backward controls to Bing Streetside ([#5125])

[#5179]: https://github.com/openstreetmap/iD/issues/5179
[#5162]: https://github.com/openstreetmap/iD/issues/5162
[#5148]: https://github.com/openstreetmap/iD/issues/5148
[#5138]: https://github.com/openstreetmap/iD/issues/5138
[#5127]: https://github.com/openstreetmap/iD/issues/5127
[#5125]: https://github.com/openstreetmap/iD/issues/5125
[#5107]: https://github.com/openstreetmap/iD/issues/5107
[#5104]: https://github.com/openstreetmap/iD/issues/5104
[#4930]: https://github.com/openstreetmap/iD/issues/4930
[#4320]: https://github.com/openstreetmap/iD/issues/4320
[#2629]: https://github.com/openstreetmap/iD/issues/2629
[@thomas-hervey]: https://github.com/thomas-hervey
[@kamicut]: https://github.com/kamicut
[@Psigio]: https://github.com/Psigio
[@kratico]: https://github.com/kratico

#### :sparkles: Usability
* Update viewfield to match bearing of Mapillary viewer when viewing panoramic images ([#5161], thanks [@kratico])
* Increase photo viewer default size for large screens ([#5139], thanks [@kratico])
* Improve Mapillary viewer attribution display ([#5137], thanks [@kratico])
* Improve visibility and styling for `footway=crossing` and other special paths ([#5126])

[#5161]: https://github.com/openstreetmap/iD/issues/5161
[#5139]: https://github.com/openstreetmap/iD/issues/5139
[#5137]: https://github.com/openstreetmap/iD/issues/5137
[#5126]: https://github.com/openstreetmap/iD/issues/5126
[@kratico]: https://github.com/kratico

#### :bug: Bugfixes
* Make sure railway bridges with a `service=*` tag render with dark casing ([#5159])
* Properly save and restore OSM data caches when entering/leaving the walkthrough
* Avoid errors if Mapillary viewer could not be initialized
* Support reversal of more direction tags (`conveying`, `priority`, etc.) in Reverse action ([#5121])
* Fix event management of the spinner - it was possible for it to get stuck spinning ([#5107-comment])
* Add doublequotes to iD-sprite input file param so builds work on Windows ([#5077])

[#5159]: https://github.com/openstreetmap/iD/issues/5159
[#5121]: https://github.com/openstreetmap/iD/issues/5121
[#5107-comment]: https://github.com/openstreetmap/iD/pull/5107#issuecomment-401617938
[#5077]: https://github.com/openstreetmap/iD/issues/5077

#### :hourglass: Performance
* Use XHR instead of JSONP wherever possible ([#5123], [#5040], thanks [@tomhughes])
* Check Esri Tilemaps to avoid extra requests for unavailable imagery ([#5116], [#5029], thanks [@jgravois])

[#5123]: https://github.com/openstreetmap/iD/issues/5123
[#5116]: https://github.com/openstreetmap/iD/issues/5116
[#5040]: https://github.com/openstreetmap/iD/issues/5040
[#5029]: https://github.com/openstreetmap/iD/issues/5029
[@tomhughes]: https://github.com/tomhughes
[@jgravois]: https://github.com/jgravois

#### :mortar_board: Walkthrough / Help
* Add section about OpenStreetMap notes to Help pane ([#5162], thanks [@thomas-hervey])

[@thomas-hervey]: https://github.com/thomas-hervey

#### :rocket: Presets
* Add `aeroway=aerodrome` to Military Airfield preset, adjust terms ([#5164])
* Add `passenger_information_display` to Bus, Tram platform presets ([#5142], thanks [@AndreasHae])
* Add `levels` field to `shop=kiosk` preset ([#5131], [#5133], thanks [@vershwal])
* Add `site_type` to Archaeological Site preset ([#5124], thanks [@JamesKingdom])
* Add `network` field to ATM preset ([#5119], thanks [@JamesKingdom])
* Add `cash_in` field to ATM preset ([#5118], thanks [@JamesKingdom])
* Improve search terms for Entrance preset ([#5130], thanks [@tohaklim])
* Add `capacity` field to `playground=swing` preset ([#5120], thanks [@tordans])

[#5164]: https://github.com/openstreetmap/iD/issues/5164
[#5142]: https://github.com/openstreetmap/iD/issues/5142
[#5131]: https://github.com/openstreetmap/iD/issues/5131
[#5133]: https://github.com/openstreetmap/iD/issues/5133
[#5124]: https://github.com/openstreetmap/iD/issues/5124
[#5119]: https://github.com/openstreetmap/iD/issues/5119
[#5118]: https://github.com/openstreetmap/iD/issues/5118
[#5130]: https://github.com/openstreetmap/iD/issues/5130
[#5120]: https://github.com/openstreetmap/iD/issues/5120
[@AndreasHae]: https://github.com/AndreasHae
[@vershwal]: https://github.com/vershwal
[@JamesKingdom]: https://github.com/JamesKingdom
[@tohaklim]: https://github.com/tohaklim
[@tordans]: https://github.com/tordans


# 2.9.2
##### 2018-Jun-28

#### :sparkles: Usability
* This release contains a few updates to the background imagery list


# 2.9.1
##### 2018-Jun-25

#### :sparkles: Usability
* Improve the resolution of Bing Streetside ([#5102], thanks [@jharpster], [@LorenMueller])
  * Adjust viewer parameters to allow users to zoom in more
  * Add checkbox to toggle between low resolution (faster) and high resolution (slower)
* Switch low zoom map style based on latitude (improves width of roads closer to equator) ([#5101])
* Don't zoom in so far when searching for a point ([#5099])
* `amenity=shelter` no longer assumed to be a building for rendering or feature filtering ([#5084])

[#5102]: https://github.com/openstreetmap/iD/issues/5102
[#5101]: https://github.com/openstreetmap/iD/issues/5101
[#5099]: https://github.com/openstreetmap/iD/issues/5099
[#5084]: https://github.com/openstreetmap/iD/issues/5084
[@jharpster]: https://github.com/jharpster
[@LorenMueller]: https://github.com/LorenMueller

#### :bug: Bugfixes
* Add `royal_cypher` to list of tags that allow capital letters ([#5109])
* Fix bug that caused '0' to be written into a numeric field when tabbing ([#5087])

[#5109]: https://github.com/openstreetmap/iD/issues/5109
[#5087]: https://github.com/openstreetmap/iD/issues/5087

#### :mortar_board: Walkthrough / Help
* Use "Esri World Imagery (Clarity)" imagery in the intro walkthrough

#### :rocket: Presets
* Add field `height` to `barrier=retaining_wall` preset ([#5113], thanks [@tordans])
* Add preset for `emergency=lifeguard` ([#4918])
* Add preset for `emergency=fire_alarm_box`
* Add `height`, `name` fields to `natural=cliff` preset, improve search terms ([#5095])
* Add booth field to telephone presets ([#5088])
* Add "road" and "street" as search terms for all road presets ([#5103])
* Add preset for `emergency=siren` ([#5100])
* Add a preset for `emergency=first_aid_kit` ([#5097])
* Add `indoor` and `ref` fields to `emergency=phone` preset
* Add `name` field to `highway=motorway_junction` preset ([#5090], [#5092], thanks [@vershwal])
* Add `building` and `bench` fields to `amenity=shelter` preset ([#5084])

[#5113]: https://github.com/openstreetmap/iD/issues/5113
[#5103]: https://github.com/openstreetmap/iD/issues/5103
[#5100]: https://github.com/openstreetmap/iD/issues/5100
[#5097]: https://github.com/openstreetmap/iD/issues/5097
[#5095]: https://github.com/openstreetmap/iD/issues/5095
[#5092]: https://github.com/openstreetmap/iD/issues/5092
[#5090]: https://github.com/openstreetmap/iD/issues/5090
[#5088]: https://github.com/openstreetmap/iD/issues/5088
[#5084]: https://github.com/openstreetmap/iD/issues/5084
[#4918]: https://github.com/openstreetmap/iD/issues/4918
[@tordans]: https://github.com/tordans
[@vershwal]: https://github.com/vershwal


# 2.9.0
##### 2018-Jun-14

#### :mega: Release Highlights
* :camera: We've added support for [Bing Streetside](https://www.microsoft.com/en-us/maps/streetside)! This new layer provides 360-degree panoramic imagery across large regions of the United States, United Kingdom, France, and Spain. Thank you, Microsoft!<br/>
_Activate the Bing Streetside layer by opening the Map Data pane (shortcut <kbd>F</kbd>)_

#### :tada: New Features
* Add Bing Streetside data layer and service ([#5050], thanks [@jharpster], [@shawnaparadee], [@LorenMueller])
* Changed how icons and other graphics are bundled into iD ([#3924])
  * Added support for more icon sets (such as [FontAwesome](https://fontawesome.com/icons?d=gallery)) for presets or other iD icons ([#3025])
  * Extracted many preset icons from the iD sprite into a separate project: [bhousel/temaki](https://github.com/bhousel/temaki)
  * Many presets that previously did not have a suitable icon now have one.
  * :warning: All icons in iD now use prefixed names. (e.g. `iD-`, `maki-`, etc). See the [preset README](https://github.com/openstreetmap/iD/blob/master/data/presets/README.md#icons) for more details.

[#5050]: https://github.com/openstreetmap/iD/issues/5050
[#3924]: https://github.com/openstreetmap/iD/issues/3924
[#3025]: https://github.com/openstreetmap/iD/issues/3025
[@jharpster]: https://github.com/jharpster
[@shawnaparadee]: https://github.com/shawnaparadee
[@LorenMueller]: https://github.com/LorenMueller

#### :sparkles: Usability
* When pasting a `key=value` string into tag editor, put `key` and `value` into correct fields ([#5024], [#5070], thanks [@AndreasHae])
* Replace Mapillary street sign spritesheet `.png` with `.svg` ([#4145])
  * Much sharper graphics
  * Adds support for many more street signs
  * Adds support for the Mapillary street sign layer in all browsers
* Render piers similar to other walkable features (sidewalks, rail platforms) ([#5068], thanks [@JamesKingdom])
* Support `minValue`/`maxValue` on numeric fields. Avoid negative values for many fields ([#5043])

[#5070]: https://github.com/openstreetmap/iD/issues/5070
[#5068]: https://github.com/openstreetmap/iD/issues/5068
[#5043]: https://github.com/openstreetmap/iD/issues/5043
[#5024]: https://github.com/openstreetmap/iD/issues/5024
[#4145]: https://github.com/openstreetmap/iD/issues/4145
[@AndreasHae]: https://github.com/AndreasHae
[@JamesKingdom]: https://github.com/JamesKingdom

#### :bug: Bugfixes
* Fix bug causing icons not to update after a node drag ([#5045])
* Fix tooltip location for data layers button ([#5042], thanks [@thomas-hervey])

[#5045]: https://github.com/openstreetmap/iD/issues/5045
[#5042]: https://github.com/openstreetmap/iD/issues/5042
[@thomas-hervey]: https://github.com/thomas-hervey

#### :earth_asia: Localization
* Add Australian address format ([#5039])

[#5039]: https://github.com/openstreetmap/iD/issues/5039

#### :rocket: Presets
* Add a window icon, use it for `craft=glaziery` and a few other presets ([#5018])
* Allow `power=pole` preset for a standalone point ([#5059], [#5051])
* Add preset for `shop=motorcycle_repair` ([#5054], thanks [@demonshreder])
* Add preset for `leisure=bleachers` ([#5031], thanks [@rivermont])

[#5059]: https://github.com/openstreetmap/iD/issues/5059
[#5054]: https://github.com/openstreetmap/iD/issues/5054
[#5051]: https://github.com/openstreetmap/iD/issues/5051
[#5031]: https://github.com/openstreetmap/iD/issues/5031
[#5018]: https://github.com/openstreetmap/iD/issues/5018
[@demonshreder]: https://github.com/demonshreder
[@rivermont]: https://github.com/rivermont


# 2.8.2
##### 2018-May-14

#### :tada: New Features
* Allow performing Merge command when several nodes are selected ([#3774], [#4484], thanks [@ferdibiflator])
* Add support for building iD on Node 10 ([#5028])

[#5028]: https://github.com/openstreetmap/iD/issues/5028
[#4484]: https://github.com/openstreetmap/iD/issues/4484
[#3774]: https://github.com/openstreetmap/iD/issues/3774
[@ferdibiflator]: https://github.com/ferdibiflator

#### :sparkles: Usability
* Exclude non-administrative boundary from address city suggestions ([#5034])
* Replace `suburb` with `town` in "Thank you for editing near.." message ([#4989])
* Rename "Phone" to "Telephone" in Add Field dropdown (so user can type either) ([#5019])

[#5034]: https://github.com/openstreetmap/iD/issues/5034
[#5019]: https://github.com/openstreetmap/iD/issues/5019
[#4989]: https://github.com/openstreetmap/iD/issues/4989

#### :bug: Bugfixes
* Don't write 'undefined' to storage when deleting the changeset source ([#5021])
* Make date parsing from community index more consistent ([#5011])
* Fix a bug in setting some tags as read-only ([#5025], thanks [@guyarad])

[#5025]: https://github.com/openstreetmap/iD/issues/5025
[#5021]: https://github.com/openstreetmap/iD/issues/5021
[#5011]: https://github.com/openstreetmap/iD/issues/5011
[@guyarad]: https://github.com/guyarad

#### :rocket: Presets
* Add preset for `man_made=clearcut` ([#5027], thanks [@obama])
* Add preset for `building=grandstand` ([#5026], thanks [@tyrasd])
* Remove trailing space from health food preset ([#5022])
* Added dance style field to dance hall preset ([#5020], thanks [@hikemaniac])
* Add `natural=reef` preset ([#5006], thanks [@obama])

[#5027]: https://github.com/openstreetmap/iD/issues/5027
[#5026]: https://github.com/openstreetmap/iD/issues/5026
[#5022]: https://github.com/openstreetmap/iD/issues/5022
[#5020]: https://github.com/openstreetmap/iD/issues/5020
[#5006]: https://github.com/openstreetmap/iD/issues/5006
[@obama]: https://github.com/obama
[@tyrasd]: https://github.com/tyrasd
[@hikemaniac]: https://github.com/hikemaniac


# 2.8.1
##### 2018-Apr-24

#### :sparkles: Usability
* Linkify subreddit in community description ([#4997])

[#4997]: https://github.com/openstreetmap/iD/issues/4997

#### :bug: Bugfixes
* Avoid reversing ways when using the join operation ([#4872])
* Fix join-line and join-point cursors ([#4887])
* Fix tabbing between fields in the tag editor on Firefox ([#4991])
* Don't add empty `source` tag on a changeset ([#4993])

[#4993]: https://github.com/openstreetmap/iD/issues/4993
[#4991]: https://github.com/openstreetmap/iD/issues/4991
[#4887]: https://github.com/openstreetmap/iD/issues/4887
[#4872]: https://github.com/openstreetmap/iD/issues/4872

#### :rocket: Presets
* Change `amenity=bureau_de_change` to allow tagging as a building/area ([#5005])
* Remove point as allowable geometry from `barrier=gate` ([#5004])
* Add `brand=*` field to `shop=car` preset ([#4998], [#4999], thanks [@hikemaniac])

[#5005]: https://github.com/openstreetmap/iD/issues/5005
[#5004]: https://github.com/openstreetmap/iD/issues/5004
[#4999]: https://github.com/openstreetmap/iD/issues/4999
[#4998]: https://github.com/openstreetmap/iD/issues/4998
[@hikemaniac]: https://github.com/hikemaniac


# 2.8.0
##### 2018-Apr-16

#### :mega: Release Highlights
* :speech_balloon: We've changed how things look on the post-upload screen.  Now after saving your edits,
you will see a list of OpenStreetMap communities that are active around the area where you are editing.<br/>
_Reach out to nearby mappers and say hello!_

#### :boom: Breaking Changes
* Drop support for node 4 / npm 2 ([#4853])
  * :warning: If you are building the iD project, you will need to upgrade your node version.

[#4853]: https://github.com/openstreetmap/iD/issues/4853

#### :tada: New Features
* Post-upload dialog improvements, and [community index](https://github.com/osmlab/osm-community-index/) integration ([#4815])
  * Social sharing options are gone (was: share your edit on Facebook, Twitter, Google+)
  * Community resources are displayed from most local to global
  * Nice icons come from FontAwesome
  * Each resource has a name, short description, and extended description (all available for translation)
  * Each resource can include a list of which languages are spoken (currently displays language codes)
  * Resources can optionally have events. If events exist, the next upcoming 2 will be shown.
  * Events can have a name, description, where, when
  * Events can optionally be translated (this would be more useful for a big event like a State of the Map)
* Send more information about iD presets to Taginfo service - fields, geometries, icons ([#4940], [#4937], [#3598], thanks [@mmd-osm])
* Remember changeset `source` tag value, make it settable via url param ([#4899])

[#4940]: https://github.com/openstreetmap/iD/issues/4940
[#4937]: https://github.com/openstreetmap/iD/issues/4937
[#4899]: https://github.com/openstreetmap/iD/issues/4899
[#4815]: https://github.com/openstreetmap/iD/issues/4815
[#3598]: https://github.com/openstreetmap/iD/issues/3598
[@mmd-osm]: https://github.com/mmd-osm

#### :sparkles: Usability
* Show a message on the History Panel if the selected feature is new ([#4975])
* Don't click cycle through `alternating` or `reversible` oneway states ([#4970])
* Fix zoom scaleExtent to allow zoom out to z2 (full world) ([#4959])
* Rename "No Turns" to "Only Straight On", add "Only U-turn" preset and icon ([#4952])
* Don't autocomplete numeric values in the combobox ([#4935])
* Hide Turn Restriction field on trivial junctions ([#4934])
* Add 'X' to close side panes (Background, Map Data, Help) ([#4913], [#4599], thanks [@vershwal])
* Add pencil "edit" icon to custom background item ([#4908], [#4798], thanks [@vershwal])
* Add hint alt text for "remove", "undo", "info" buttons ([#4904], [#4833], [#4892] thanks [@vershwal])

[#4975]: https://github.com/openstreetmap/iD/issues/4975
[#4970]: https://github.com/openstreetmap/iD/issues/4970
[#4959]: https://github.com/openstreetmap/iD/issues/4959
[#4952]: https://github.com/openstreetmap/iD/issues/4952
[#4935]: https://github.com/openstreetmap/iD/issues/4935
[#4934]: https://github.com/openstreetmap/iD/issues/4934
[#4913]: https://github.com/openstreetmap/iD/issues/4913
[#4908]: https://github.com/openstreetmap/iD/issues/4908
[#4904]: https://github.com/openstreetmap/iD/issues/4904
[#4892]: https://github.com/openstreetmap/iD/issues/4892
[#4833]: https://github.com/openstreetmap/iD/issues/4833
[#4798]: https://github.com/openstreetmap/iD/issues/4798
[#4599]: https://github.com/openstreetmap/iD/issues/4599
[@vershwal]: https://github.com/vershwal

#### :bug: Bugfixes
* Prevent node drags from breaking many kinds of relations / turn restrictions ([#4921])
* Fix bug preventing adding restrictions when multiple via paths exist ([#4968], [#4969], thanks [@tyrasd])
* Guard code to avoid deleting a turn twice ([#4968], [#4928])
* When connecting nodes, prefer to keep an existing (not new) node ([#4974], [#4674])
* When boundaries are shared with roads, consider them as roads for purposes of filtering ([#4973])
* Fix bug when deleting a "No U-turn" restriction on a bidirectional road ([#4951])
* Prevent clicking in restriction editor from selecting nearby text
* Handle "entry only" and "exit only" variants of 'stop' and 'platform' when identifying PTv2 members ([#4946])
* Fix ';'-space delimiting within `conditional` opening hours style files, add tests ([#4925])

[#4974]: https://github.com/openstreetmap/iD/issues/4974
[#4973]: https://github.com/openstreetmap/iD/issues/4973
[#4969]: https://github.com/openstreetmap/iD/issues/4969
[#4968]: https://github.com/openstreetmap/iD/issues/4968
[#4951]: https://github.com/openstreetmap/iD/issues/4951
[#4946]: https://github.com/openstreetmap/iD/issues/4946
[#4928]: https://github.com/openstreetmap/iD/issues/4928
[#4925]: https://github.com/openstreetmap/iD/issues/4925
[#4921]: https://github.com/openstreetmap/iD/issues/4921
[#4674]: https://github.com/openstreetmap/iD/issues/4674
[@tyrasd]: https://github.com/tyrasd

#### :rocket: Presets
* Add preset for `attraction=maze` ([#4987], [#4986], thanks [@sulfo])
* Add preset for `healthcare=laboratory` ([#4982], [#4980], thanks [@vershwal])
* Add name field to several pitch presets ([#4976], [#4857], thanks [@vershwal])
* Add preset for `advertising=column` ([#4963], [#4961], thanks [@Xavier-J-Ortiz])
* Add `faces=*` field to clock preset ([#4962], [#4961], thanks [@Xavier-J-Ortiz])
* Add preset for `leisure=beach_resort` ([#4956], [#4955], thanks [@Xavier-J-Ortiz])
* Add more kinds of vending machines, change vending to multiple select field ([#4888])
* Add `usage`, `voltage` and `frequency` fields to several rail presets ([#4919])
* Add `industrial=*` field to landuse industrial preset ([#4949], thanks [@hikemaniac])
* Add preset for `shop=pet_grooming` ([#4942], [#4939], thanks [@Xavier-J-Ortiz])
* Add preset for Trail Riding Station, add fields to Horseback Riding and Hiking routes ([#4912], thanks [@NopMap])
* Add preset for `man_made=antenna` ([#4938], thanks [@obama])
* Add preset for `amenity=monastary` ([#4936], [#4932], thanks [@Xavier-J-Ortiz])
* Add `height=*` field to many building presets ([#4905], [#2455], thanks [@vershwal])
* Add preset for `leisure=outdoor_seating` ([#4933], [#4931], thanks [@vershwal])
* Add preset for `natural=mud` ([#4926], [#4923], thanks [@Xavier-J-Ortiz])
* Add preset for `allotments=plot` ([#4920], [#4917], thanks [@vershwal])
* Add `brand=*` field to `amenity=fuel` preset ([#4906], [#2300], thanks [@vershwal])
* Add preset for `highway=passing_place` ([#4891], [#4883], thanks [@Xavier-J-Ortiz])
* Add preset for `man_made=observatory` ([#4889], [#4855], thanks [@vershwal])
* Add field for `maxspeed:advisory=*` to presets for link roads ([#4870], [#4522], thanks [@umarpreet1])
* Add more search terms for memorial (including "stolperstein")

[#4987]: https://github.com/openstreetmap/iD/issues/4987
[#4986]: https://github.com/openstreetmap/iD/issues/4986
[#4982]: https://github.com/openstreetmap/iD/issues/4982
[#4980]: https://github.com/openstreetmap/iD/issues/4980
[#4976]: https://github.com/openstreetmap/iD/issues/4976
[#4963]: https://github.com/openstreetmap/iD/issues/4963
[#4962]: https://github.com/openstreetmap/iD/issues/4962
[#4961]: https://github.com/openstreetmap/iD/issues/4961
[#4956]: https://github.com/openstreetmap/iD/issues/4956
[#4955]: https://github.com/openstreetmap/iD/issues/4955
[#4949]: https://github.com/openstreetmap/iD/issues/4949
[#4942]: https://github.com/openstreetmap/iD/issues/4942
[#4939]: https://github.com/openstreetmap/iD/issues/4939
[#4938]: https://github.com/openstreetmap/iD/issues/4938
[#4936]: https://github.com/openstreetmap/iD/issues/4936
[#4933]: https://github.com/openstreetmap/iD/issues/4933
[#4932]: https://github.com/openstreetmap/iD/issues/4932
[#4931]: https://github.com/openstreetmap/iD/issues/4931
[#4926]: https://github.com/openstreetmap/iD/issues/4926
[#4923]: https://github.com/openstreetmap/iD/issues/4923
[#4920]: https://github.com/openstreetmap/iD/issues/4920
[#4919]: https://github.com/openstreetmap/iD/issues/4919
[#4917]: https://github.com/openstreetmap/iD/issues/4917
[#4912]: https://github.com/openstreetmap/iD/issues/4912
[#4906]: https://github.com/openstreetmap/iD/issues/4906
[#4905]: https://github.com/openstreetmap/iD/issues/4905
[#4891]: https://github.com/openstreetmap/iD/issues/4891
[#4888]: https://github.com/openstreetmap/iD/issues/4888
[#4883]: https://github.com/openstreetmap/iD/issues/4883
[#4889]: https://github.com/openstreetmap/iD/issues/4889
[#4870]: https://github.com/openstreetmap/iD/issues/4870
[#4857]: https://github.com/openstreetmap/iD/issues/4857
[#4855]: https://github.com/openstreetmap/iD/issues/4855
[#4522]: https://github.com/openstreetmap/iD/issues/4522
[#2455]: https://github.com/openstreetmap/iD/issues/2455
[#2300]: https://github.com/openstreetmap/iD/issues/2300
[@sulfo]: https://github.com/sulfo
[@vershwal]: https://github.com/vershwal
[@Xavier-J-Ortiz]: https://github.com/Xavier-J-Ortiz
[@hikemaniac]: https://github.com/hikemaniac
[@NopMap]: https://github.com/NopMap
[@obama]: https://github.com/obama
[@umarpreet1]: https://github.com/umarpreet1


# 2.7.1
##### 2018-Mar-11

#### :tada: New Features
* Add support for EPSG:4326 WMS layers ([#4858], thanks [@tyrasd])

[#4858]: https://github.com/openstreetmap/iD/issues/4858
[@tyrasd]: https://github.com/tyrasd

#### :bug: Bugfixes
* Allow user to press <kbd>esc</kbd> to finish drawing in an invalid position ([#4845], [#4860], thanks [@jguthrie100])
* Remove code attempting to extend short leaf ways in turn restriction editor ([#4869])
* Properly split ways which are members of a via way turn restriction ([#4861])
* Avoid reordering stops and platforms in PTv2 routes ([#4864])
* `only_` restrictions should only count if they leave the FROM towards the VIA ([#4849])

[#4869]: https://github.com/openstreetmap/iD/issues/4869
[#4864]: https://github.com/openstreetmap/iD/issues/4864
[#4861]: https://github.com/openstreetmap/iD/issues/4861
[#4860]: https://github.com/openstreetmap/iD/issues/4860
[#4849]: https://github.com/openstreetmap/iD/issues/4849
[#4845]: https://github.com/openstreetmap/iD/issues/4845
[@jguthrie100]: https://github.com/jguthrie100

#### :earth_asia: Localization
* For Kurdish languages - set `ckb` to RTL and `ku` to LTR ([#4783])

[#4783]: https://github.com/openstreetmap/iD/issues/4783

#### :rocket: Presets
* Fix duplicate `opening_hours` on `shop=beauty` preset ([#4868], [#4867], thanks [@hikemaniac])
* Add `name` field to `leisure=pitch` and `amenity=parking` presets ([#4865], [#4857], thanks [@umarpreet1])
* Fix subway platform presets to use `subway=yes` tag ([#4862])
* Add preset for Dance School - `leisure=dance`+`dance:teaching=yes` ([#4846], thanks [@hikemaniac])

[#4868]: https://github.com/openstreetmap/iD/issues/4868
[#4867]: https://github.com/openstreetmap/iD/issues/4867
[#4865]: https://github.com/openstreetmap/iD/issues/4865
[#4857]: https://github.com/openstreetmap/iD/issues/4857
[#4862]: https://github.com/openstreetmap/iD/issues/4862
[#4846]: https://github.com/openstreetmap/iD/issues/4846
[@hikemaniac]: https://github.com/hikemaniac
[@umarpreet1]: https://github.com/umarpreet1


# 2.7.0
##### 2018-Mar-02

#### :mega: Release Highlights
* :world_map: We've added support for more background imagery from WMS servers. Thanks Martin Raifer [@tyrasd] and Guillaume Rischard [@grischard] for your work on this!

  _Press <kbd>B</kbd> to see if new imagery is available in your area._

* :arrow_right_hook: The turn restriction editor just got a big update!
  * Include nearby connected roads (with configurable distance)
  * Hover over a from way to see which paths are restricted or allowed
  * Add restrictions that span one or more via ways (e.g. divided highway u-turns)
  * Add `only_` turn restrictions (e.g. only straight on)
  * View popup help for more information about working with turn restrictions

  _Try selecting a junction node in a complex intersection, editing turn restrictions, and viewing the popup help._

[@tyrasd]: https://github.com/tyrasd
[@grischard]: https://github.com/grischard

#### :tada: New Features
* Support background imagery on WMS servers supporting EPSG:3857 ([#1141], [#4814], thanks [@tyrasd] and [@grischard])
* Add support for complex intersection via way, and `only_` restrictions ([#2346], [#2622], [#4768])
  * :warning: code depending on any of these modules will need modification:
  `actionRestrictTurn`, `actionUnrestrictTurn`, `osmIntersection`, `osmInferRestriction`, `uiFieldRestrictions`
* Added `uiFieldHelp` component for popup field help (currently used only for restrictions field) ([#4768])

[#4814]: https://github.com/openstreetmap/iD/issues/4814
[#4768]: https://github.com/openstreetmap/iD/issues/4768
[#2622]: https://github.com/openstreetmap/iD/issues/2622
[#2346]: https://github.com/openstreetmap/iD/issues/2346
[#1141]: https://github.com/openstreetmap/iD/issues/1141
[@tyrasd]: https://github.com/tyrasd
[@grischard]: https://github.com/grischard

#### :sparkles: Usability
* When combobox is attached to textarea, let user up/down arrow ([#4750])
* Improve rendering of tree row, use a thicker line ([#4825])
* Vertex navigation for home/end should work with way selected ([#4841])
* Improve combobox option visibility ([#4761])
* Increase max height of combobox, so they can show more items ([#4819], [#4831], thanks [@SteevenBosse])

[#4841]: https://github.com/openstreetmap/iD/issues/4841
[#4831]: https://github.com/openstreetmap/iD/issues/4831
[#4825]: https://github.com/openstreetmap/iD/issues/4825
[#4819]: https://github.com/openstreetmap/iD/issues/4819
[#4761]: https://github.com/openstreetmap/iD/issues/4761
[#4750]: https://github.com/openstreetmap/iD/issues/4750
[@SteevenBosse]: https://github.com/SteevenBosse

#### :bug: Bugfixes
* Fix bug trying to stop Mapillary autoplaying if `_mlyViewer` is not initialized ([#4804], [#4809], thanks [@fritruc])
* Fix bug trying to show labels when `.geojson` file has `null` properties ([#4795], [#4805], thanks [@vershwal])
* Query the appropriate metadata for esri clarity background imagery ([#4766], [#4767], thanks [@jgravois])

[#4809]: https://github.com/openstreetmap/iD/issues/4809
[#4805]: https://github.com/openstreetmap/iD/issues/4805
[#4804]: https://github.com/openstreetmap/iD/issues/4804
[#4795]: https://github.com/openstreetmap/iD/issues/4795
[#4767]: https://github.com/openstreetmap/iD/issues/4767
[#4766]: https://github.com/openstreetmap/iD/issues/4766
[@fritruc]: https://github.com/fritruc
[@vershwal]: https://github.com/vershwal
[@jgravois]: https://github.com/jgravois

#### :earth_asia: Localization
* Do not localize decimalCoordinatePair appearing in info panels ([#4765])
* Fix Polish address format to not show place and city together ([#4784], thanks [@MKuranowski])

[#4784]: https://github.com/openstreetmap/iD/issues/4784
[#4765]: https://github.com/openstreetmap/iD/issues/4765
[@MKuranowski]: https://github.com/MKuranowski

#### :hourglass: Performance
* Don't draw line and area touch targets for segments outside the viewport
* Improve performance of `coreDifference`, `actionDiscardTags` (slow changeset comment typing) ([#2743], [#4611])

[#4611]: https://github.com/openstreetmap/iD/issues/4611
[#2743]: https://github.com/openstreetmap/iD/issues/2743

#### :rocket: Presets
* Rename `building=farm` to "Farm House", add `building=farm_auxiliary` as "Farm Building" ([#4839], [#4826], thanks [@MaciejWWojcik])
* Reduce the search priority for "Boat Builder" below "Building" ([#4808], thanks [@bencostamagna])
* Add religion and denomination fields to `historic=wayside_shrine` preset ([#4785], thanks [@hikemaniac])
* Add `leisure=amusement_arcade` preset ([#4774], [#4777], thanks [@fritruc])
* Change caption on `shop=agrarian` preset to "Farm Supply Shop" ([#4775])
* Add presets for `shop=wholesale` and `shop=health_food` ([#4754], [#4773], thanks [@fritruc])
* Add `dispensing` field to `amenity=pharmacy` preset ([#4763])
* Add `opening_hours` field to `amenity=police` preset ([#4753])

[#4839]: https://github.com/openstreetmap/iD/issues/4839
[#4826]: https://github.com/openstreetmap/iD/issues/4826
[#4808]: https://github.com/openstreetmap/iD/issues/4808
[#4785]: https://github.com/openstreetmap/iD/issues/4785
[#4774]: https://github.com/openstreetmap/iD/issues/4774
[#4777]: https://github.com/openstreetmap/iD/issues/4777
[#4775]: https://github.com/openstreetmap/iD/issues/4775
[#4754]: https://github.com/openstreetmap/iD/issues/4754
[#4773]: https://github.com/openstreetmap/iD/issues/4773
[#4763]: https://github.com/openstreetmap/iD/issues/4763
[#4753]: https://github.com/openstreetmap/iD/issues/4753
[@MaciejWWojcik]: https://github.com/MaciejWWojcik
[@bencostamagna]: https://github.com/bencostamagna
[@hikemaniac]: https://github.com/hikemaniac
[@fritruc]: https://github.com/fritruc


# 2.6.1
##### 2018-Feb-01

#### :tada: New Features
* Add Esri World Imagery (Clarity) layer ([editor-layer-index#391], thanks [@jgravois])
* Support multiple semicolon delimited direction values ([#4755])
* No longer imply `oneway=yes` for `highway=motorway_link` without a `oneway` tag ([#4727])

[editor-layer-index#391]: https://github.com/osmlab/editor-layer-index/pull/391
[#4755]: https://github.com/openstreetmap/iD/issues/4755
[#4727]: https://github.com/openstreetmap/iD/issues/4727
[@jgravois]: https://github.com/jgravois

#### :sparkles: Usability
* Replace help icon ([#4650])
* Improve details of delete summary warning ([#4666], [#4751], thanks [@bencostamagna])
* Support fallback mode for Mapillary viewer when WebGL disabled ([#3804])
* Hide the active vertex while drawing in wireframe mode ([#4739])
* Describe relation in tooltip in add membership list ([#4694], thanks [@1ec5])
* Persist more user preferences to browser storage ([#2864], [#4720], [#4738], thanks [@bagage])
  * wireframe area fill
  * recently used background imagery
  * selected feature filters
* Increase GPX labels readability ([#4617], [#4678], thanks [@nnodot])
* Draw covered/underground lines beneath areas ([#4718])

[#4751]: https://github.com/openstreetmap/iD/issues/4751
[#4739]: https://github.com/openstreetmap/iD/issues/4739
[#4738]: https://github.com/openstreetmap/iD/issues/4738
[#4720]: https://github.com/openstreetmap/iD/issues/4720
[#4718]: https://github.com/openstreetmap/iD/issues/4718
[#4694]: https://github.com/openstreetmap/iD/issues/4694
[#4678]: https://github.com/openstreetmap/iD/issues/4678
[#4666]: https://github.com/openstreetmap/iD/issues/4666
[#4650]: https://github.com/openstreetmap/iD/issues/4650
[#4617]: https://github.com/openstreetmap/iD/issues/4617
[#3804]: https://github.com/openstreetmap/iD/issues/3804
[#2864]: https://github.com/openstreetmap/iD/issues/2864
[@bencostamagna]: https://github.com/bencostamagna
[@1ec5]: https://github.com/1ec5
[@bagage]: https://github.com/bagage
[@nnodot]: https://github.com/nnodot

#### :bug: Bugfixes
* Remove any duplicate vertex created when moving a way ([#4433], [#3797])
* Fix way shape deformation when moving ([#4146])
* Stop sequence from playing when the Mapillary viewer is hidden ([#4707])
* Graceful fallback when clicking on a Mapillary marker along a sequence not yet processed ([#4536])
* Fix bug making nodes undraggable along a degenerate multipolygon ([#4741])
* Fix <kbd>⌘S</kbd>/<kbd>Ctrl+S</kbd> keybinding ([#4728])

[#4741]: https://github.com/openstreetmap/iD/issues/4741
[#4728]: https://github.com/openstreetmap/iD/issues/4728
[#4707]: https://github.com/openstreetmap/iD/issues/4707
[#4536]: https://github.com/openstreetmap/iD/issues/4536
[#4433]: https://github.com/openstreetmap/iD/issues/4433
[#4146]: https://github.com/openstreetmap/iD/issues/4146
[#3797]: https://github.com/openstreetmap/iD/issues/3797

#### :earth_asia: Localization
* Localize nominatim search results ([#4725])
* Localize numbers, units in scale, info panels ([#4672], thanks [@1ec5])

[#4725]: https://github.com/openstreetmap/iD/issues/4725
[#4672]: https://github.com/openstreetmap/iD/issues/4672
[@1ec5]: https://github.com/1ec5

#### :rocket: Presets
* Remove address field from parking preset ([#4748], [#4756], thanks [@bencostamagna])
* Add preset for `barrier=kerb` ([#4702], [#4715], thanks [@jay-manday])
* Add preset for `amenity=smoking_area` ([#4701], [#4737], thanks [@bencostamagna])
* Add preset for `emergency=water_tank` ([#4736], thanks [@bencostamagna])
* Add religion, denomination fields to school preset ([#4722])
* Add religion, denomination fields to religious landuse preset ([#4721])

[#4756]: https://github.com/openstreetmap/iD/issues/4756
[#4748]: https://github.com/openstreetmap/iD/issues/4748
[#4737]: https://github.com/openstreetmap/iD/issues/4737
[#4736]: https://github.com/openstreetmap/iD/issues/4736
[#4722]: https://github.com/openstreetmap/iD/issues/4722
[#4721]: https://github.com/openstreetmap/iD/issues/4721
[#4715]: https://github.com/openstreetmap/iD/issues/4715
[#4702]: https://github.com/openstreetmap/iD/issues/4702
[#4701]: https://github.com/openstreetmap/iD/issues/4701
[@bencostamagna]: https://github.com/bencostamagna
[@jay-manday]: https://github.com/jay-manday


# 2.6.0
##### 2018-Jan-21

#### :mega: Release Highlights

* :level_slider: You can now adjust imagery brightness, contrast, saturation, and sharpness. (Not currently available in Internet Explorer or Edge)<br/>
_Try enhancing the background imagery by opening the Background pane (shortcut <kbd>B</kbd>) and
adjusting the slider controls._

* :no_entry_sign: iD will now prevent users from drawing many self-crossing lines and areas. See issue [#4646] for examples and more info. You can override these checks by holding down the <kbd>Alt</kbd>/<kbd>Option</kbd> key while drawing.

* :arrow_up_down: Features with a direction-type tag will display view cones indicating the directions they face. This is useful for mapping features like street signs, traffic signals, billboards, security cameras, and more.

* :tram: Transit-related presets have been updated to support Public Transport v2 tagging schema. Many presets have new icons too, to better match the mode of transport.<br/>
_Try mapping some transit platforms, stations, stop positions, etc._

* :book: We've completely refreshed the in-app Help content in iD. Huge thanks to Manfred Brandl [@manfredbrandl], Minh Nguyễn [@1ec5], and our many volunteers on Transifex for their work on this!<br/>
_Check out the new help texts by opening the Help pane (shortcut <kbd>H</kbd>)._

[#4646]: https://github.com/openstreetmap/iD/issues/4646
[@manfredbrandl]: https://github.com/manfredbrandl
[@1ec5]: https://github.com/1ec5

#### :tada: New Features
* Prevent self-intersecting lines and areas without a junction node ([#4646], [#4013], [#4602])
* Add support for `oneway=alternating`, `oneway=reversible` ([#4291])
* Allow checkbox field to display non-standard values (i.e. not 'yes' or 'no) in the field label
* New Display Controls allow users to enhance background imagery ([#2211], [#4575])
  * Sliders for Brightness, Contrast, Saturation, Sharpness
  * Slider controls go from 25% up to 200%
  * Not available on Internet Explorer / Edge (these browsers will see only a Brightness slider)
  * This replaces the brightness buttons (which many people found confusing)
* Add node count to Measurement info panel ([#4644], thanks [@willemarcel])
* Draw directional cones on nodes that have a direction ([#3815], [#4602])
* Add scroll zooming support to the OpenStreetCam viewer ([#4561])

[#4646]: https://github.com/openstreetmap/iD/issues/4646
[#4644]: https://github.com/openstreetmap/iD/issues/4644
[#4602]: https://github.com/openstreetmap/iD/issues/4602
[#4575]: https://github.com/openstreetmap/iD/issues/4575
[#4561]: https://github.com/openstreetmap/iD/issues/4561
[#4291]: https://github.com/openstreetmap/iD/issues/4291
[#4013]: https://github.com/openstreetmap/iD/issues/4013
[#3815]: https://github.com/openstreetmap/iD/issues/3815
[#2211]: https://github.com/openstreetmap/iD/issues/2211
[@willemarcel]: https://github.com/willemarcel

#### :sparkles: Usability
* Make Help pane slightly wider ([#4651])
* In combo boxes, don't autocomplete a longer value if the user has typed a shorter value ([#4549])
* Move link to imagery faq, reword as "Imagery Info / Report a Problem" ([#4546])
* Side panes (Background, Map Data, Help) no longer auto-close, so that users can interact with the map
* Style changeset comment field in red if comment is missing ([#4624], [#4613], thanks [@nnodot])
* Improve label placement around tagged features ([#4271], [#3636])
* Slight adjustment to improve rendering of icons on vertices
* Display vertices (and points rendered as vertices in wireframe mode) when dragging ([#3003])
* Use <kbd>⌘F</kbd>/<kbd>Ctrl+F</kbd> to focus the feature search box ([#4545])
* Flash message if drag not allowed because of a hidden connection ([#4493])
* Larger headings on Help, Map Data and Background panes
* Restyle uiDisclosures, larger text, svg expand/contract icon
* When deleting final nodes from a way, pan to final node's location ([#4541])

[#4651]: https://github.com/openstreetmap/iD/issues/4651
[#4624]: https://github.com/openstreetmap/iD/issues/4624
[#4613]: https://github.com/openstreetmap/iD/issues/4613
[#4549]: https://github.com/openstreetmap/iD/issues/4549
[#4546]: https://github.com/openstreetmap/iD/issues/4546
[#4545]: https://github.com/openstreetmap/iD/issues/4545
[#4541]: https://github.com/openstreetmap/iD/issues/4541
[#4493]: https://github.com/openstreetmap/iD/issues/4493
[#4271]: https://github.com/openstreetmap/iD/issues/4271
[#3636]: https://github.com/openstreetmap/iD/issues/3636
[#3003]: https://github.com/openstreetmap/iD/issues/3003
[@nnodot]: https://github.com/nnodot


#### :bug: Bugfixes
* Fix crash when user tried drawing during map panning to a new location ([#4706])
* Allow `Relation.replaceMember` to optionally preserve duplicates ([#4696])
* Fix joining ways to apply any necessary reversal actions ([#4688])
* Fix bugs when editing route relations that double back over themselves ([#4589])
* Fix bug causing duplicate uploads if user hits <kbd>enter</kbd> ([#4641], [#4658])
* Fix bug that quit save mode if user zoomed out too far ([#4664])
* Fix bug causing open/close of panels to mess up the url ([#4570])
* Fix manual entry of offset values in the imagery offset control ([#4553])
* Allow self connecting to a way when drawing ([#4455])
* Fix bugs on conflict resolution screen ([#4351])
* Draw streetview photo viewer close 'X' below keyboard shortcuts screen ([#4596], thanks [@briandaviddavidson])
* Remove click counter if user skips to another step in walkthrough ([#4605], [#4630], thanks [@ajlomagno])
* When reversing direction of a way, reverse `traffic_signals:direction` on children ([#4595])
* Don't try to override capital letters entered in the `source=*` field  ([#4558])

[#4706]: https://github.com/openstreetmap/iD/issues/4706
[#4696]: https://github.com/openstreetmap/iD/issues/4696
[#4688]: https://github.com/openstreetmap/iD/issues/4688
[#4664]: https://github.com/openstreetmap/iD/issues/4664
[#4658]: https://github.com/openstreetmap/iD/issues/4658
[#4641]: https://github.com/openstreetmap/iD/issues/4641
[#4630]: https://github.com/openstreetmap/iD/issues/4630
[#4605]: https://github.com/openstreetmap/iD/issues/4605
[#4596]: https://github.com/openstreetmap/iD/issues/4596
[#4595]: https://github.com/openstreetmap/iD/issues/4595
[#4589]: https://github.com/openstreetmap/iD/issues/4589
[#4570]: https://github.com/openstreetmap/iD/issues/4570
[#4558]: https://github.com/openstreetmap/iD/issues/4558
[#4455]: https://github.com/openstreetmap/iD/issues/4455
[#4553]: https://github.com/openstreetmap/iD/issues/4553
[#4351]: https://github.com/openstreetmap/iD/issues/4351
[@briandaviddavidson]: https://github.com/briandaviddavidson
[@ajlomagno]: https://github.com/ajlomagno

#### :earth_asia: Localization
* Remove `addr:unit` from several local address formats:
  * "default" format
  * `gb`, `ie`, `si`, `tr` ([#4675], thanks [@althio])
  * `ua` ([#4671], thanks [@Andygol])
  * `fr`, `lu`, `mo` ([#4667], thanks [@althio])
* Fix key shortcuts on non-Latin keyboard layouts (e.g. Cyrillic) ([#4618])
* Improve int'l date/time strings on imagery and history tools ([#4594])

[#4675]: https://github.com/openstreetmap/iD/issues/4675
[#4671]: https://github.com/openstreetmap/iD/issues/4671
[#4667]: https://github.com/openstreetmap/iD/issues/4667
[#4618]: https://github.com/openstreetmap/iD/issues/4618
[#4594]: https://github.com/openstreetmap/iD/issues/4594
[@althio]: https://github.com/althio
[@Andygol]: https://github.com/Andygol

#### :hourglass: Performance
* Faster uploading - only perform conflict check if the server returns "409 Conflict" ([#3056])
* Avoid deferred fetching of OSM tiles at low zooms or with layer disabled ([#4572])
* Optimise image files in `dist/` ([#4573], thanks [@grischard])

[#4573]: https://github.com/openstreetmap/iD/issues/4573
[#4572]: https://github.com/openstreetmap/iD/issues/4572
[#3056]: https://github.com/openstreetmap/iD/issues/3056
[@grischard]: https://github.com/grischard

#### :mortar_board: Walkthrough / Help
* Fixed typo in add playground walkthrough instruction: extra word "be" ([#4620], thanks [@SeanBarber])
* Updated all the help content! ([#4468], [#4018], thanks [@manfredbrandl] and [@1ec5])

[#4620]: https://github.com/openstreetmap/iD/issues/4620
[#4468]: https://github.com/openstreetmap/iD/issues/4468
[#4018]: https://github.com/openstreetmap/iD/issues/4018
[@SeanBarber]: https://github.com/SeanBarber
[@manfredbrandl]: https://github.com/manfredbrandl
[@1ec5]: https://github.com/1ec5

#### :rocket: Presets
* Add preset for `highway=bus_guideway` ([#4638], [#4709], thanks [@bencostamagna])
* Improve search terms for Hindu Temple preset ([#4708], thanks [@planemad])
* Changed sports_centre preset to not default to `building=yes` ([#4682], [#4705], thanks [@bencostamagna])
* Rename `landuse=garage` preset ([#4697], thanks [@JamesKingdom])
* Add `name` and `elevation` fields to Guidepost preset ([#4700], thanks [@JamesKingdom])
* Added a Boathouse preset ([#4661], [#4699], thanks [@bencostamagna])
* Add `ref:isil` field to Library preset ([#4684], thanks [@ltog])
* Add several common building presets ([#4505])
* Add Car Pooling preset ([#4623])
* Set Payment Type as universal field, add it to many presets ([#4437])
* Allow fallback presets (area, line, point) to appear in the recent list ([#4612])
* Use "suitcase" icon for most offices/commercial presets
* Remove duplicate Notary Office preset ([#4634])
* Add support for `junction=circular` (same as `junction=roundabout`) ([#4637])
* Add search terms "kennel" "cattery" "pet" to Animal Boarding preset ([#4647])
* Add light bulb icon for `highway=street_lamp` preset ([#4609])
* Add preset for `amenity=love_hotel` ([#4643], thanks [@willemarcel])
* Add a field for Draft Beers `brewery=*` tag, add to Bar, Biergarten, Pub presets ([#4598], thanks [@nlehuby])
* Add direction-style field to several presets ([#3815], [#4602]):
  * Signals: Traffic Signals, Railway Signals
  * Info: Billboard, Information, Map, Railway Milestone
  * Traffic: Stop Sign, Give Way, Traffic Calmings, Traffic Mirror
  * Cameras: Speed Camera, Surveillance
  * Natural: Adit, Cave Entrance, Viewpoint
  * Others:  Street Lamp
* Add preset for `landuse=greenhouse_horticulture` ([#4571])
* Don't show `building=mosque` with a house icon ([#4586])
* Recycling Center / Recycling Container preset cleanups ([#4569])
* Add Retail Building to buildings, switch Commercial icon to suitcase ([#4590])
* Change tourist attraction icon from monument to star ([#4563], [#4584], thanks [@lucymk])
* Add preset for `man_made=monitoring_station` ([#4581], thanks [@abdeldjalil09])
* Deprectate (i.e. make non-searchable) `office=administrative` ([#4578])
* Update transit-related presets for Public Transport v2 schema ([#3041], [#3508], [#4566], [#4585])
* Changed Marketplace preset to not default to `building=yes` ([#4559], [#4568], thanks [@tastrax])
* Add preset for `railway=miniature` ([#4555], thanks [@tastrax])
* Add preset for `route=subway` relation ([#4548])
* Add a few icons for route presets, including `route=piste`, `route=subway` ([#4355])
* Add preset for piste route relation
* Add `route=light_rail` relation route preset ([#4538])
* Rename "News Kiosk" preset to simply "Kiosk" ([#4539], thanks [@tohaklim])
* Add common fields to Telephone preset (operator, phone, fee, etc) ([#4535], thanks [@Vonter])

[#4709]: https://github.com/openstreetmap/iD/issues/4709
[#4708]: https://github.com/openstreetmap/iD/issues/4708
[#4705]: https://github.com/openstreetmap/iD/issues/4705
[#4700]: https://github.com/openstreetmap/iD/issues/4700
[#4699]: https://github.com/openstreetmap/iD/issues/4699
[#4697]: https://github.com/openstreetmap/iD/issues/4697
[#4684]: https://github.com/openstreetmap/iD/issues/4684
[#4682]: https://github.com/openstreetmap/iD/issues/4682
[#4661]: https://github.com/openstreetmap/iD/issues/4661
[#4647]: https://github.com/openstreetmap/iD/issues/4647
[#4643]: https://github.com/openstreetmap/iD/issues/4643
[#4638]: https://github.com/openstreetmap/iD/issues/4638
[#4637]: https://github.com/openstreetmap/iD/issues/4637
[#4634]: https://github.com/openstreetmap/iD/issues/4634
[#4623]: https://github.com/openstreetmap/iD/issues/4623
[#4612]: https://github.com/openstreetmap/iD/issues/4612
[#4609]: https://github.com/openstreetmap/iD/issues/4609
[#4602]: https://github.com/openstreetmap/iD/issues/4602
[#4598]: https://github.com/openstreetmap/iD/issues/4598
[#4590]: https://github.com/openstreetmap/iD/issues/4590
[#4586]: https://github.com/openstreetmap/iD/issues/4586
[#4585]: https://github.com/openstreetmap/iD/issues/4585
[#4584]: https://github.com/openstreetmap/iD/issues/4584
[#4581]: https://github.com/openstreetmap/iD/issues/4581
[#4578]: https://github.com/openstreetmap/iD/issues/4578
[#4571]: https://github.com/openstreetmap/iD/issues/4571
[#4569]: https://github.com/openstreetmap/iD/issues/4569
[#4568]: https://github.com/openstreetmap/iD/issues/4568
[#4566]: https://github.com/openstreetmap/iD/issues/4566
[#4563]: https://github.com/openstreetmap/iD/issues/4563
[#4559]: https://github.com/openstreetmap/iD/issues/4559
[#4555]: https://github.com/openstreetmap/iD/issues/4555
[#4548]: https://github.com/openstreetmap/iD/issues/4548
[#4539]: https://github.com/openstreetmap/iD/issues/4539
[#4538]: https://github.com/openstreetmap/iD/issues/4538
[#4535]: https://github.com/openstreetmap/iD/issues/4535
[#4505]: https://github.com/openstreetmap/iD/issues/4505
[#4437]: https://github.com/openstreetmap/iD/issues/4437
[#4355]: https://github.com/openstreetmap/iD/issues/4355
[#3815]: https://github.com/openstreetmap/iD/issues/3815
[#3508]: https://github.com/openstreetmap/iD/issues/3508
[#3041]: https://github.com/openstreetmap/iD/issues/3041
[@bencostamagna]: https://github.com/bencostamagna
[@planemad]: https://github.com/planemad
[@JamesKingdom]: https://github.com/JamesKingdom
[@ltog]: https://github.com/ltog
[@willemarcel]: https://github.com/willemarcel
[@nlehuby]: https://github.com/nlehuby
[@lucymk]: https://github.com/lucymk
[@abdeldjalil09]: https://github.com/abdeldjalil09
[@tastrax]: https://github.com/tastrax
[@tohaklim]: https://github.com/tohaklim
[@Vonter]: https://github.com/Vonter


# 2.5.1
##### 2017-Nov-16

#### :sparkles: Usability

* Keep the highlighted feature selected when cancelling save mode ([#4407])

[#4407]: https://github.com/openstreetmap/iD/issues/4407

#### :bug: Bugfixes

* Fix crash when exiting the walkthrough ([#4533])
* Fix crash in Firefox when doing a lot of zoom (e.g. when pressing "Zoom in to edit" button) ([#4421])
* Fix garbled label text - vertex labels being drawn over node labels ([#4473])
* Don't use real filenames in the imagery_used field (for privacy) ([#4530])
* Don't pull stale data from OSM after switching connection between live/dev servers ([#4288])
* Switch OpenStreetCam from `http` to `https` to avoid mixed content issues ([#4527])
* Fix issue where Mapillary sitelink was always linking to first image viewed ([#4526])

[#4533]: https://github.com/openstreetmap/iD/issues/4533
[#4530]: https://github.com/openstreetmap/iD/issues/4530
[#4527]: https://github.com/openstreetmap/iD/issues/4527
[#4526]: https://github.com/openstreetmap/iD/issues/4526
[#4473]: https://github.com/openstreetmap/iD/issues/4473
[#4421]: https://github.com/openstreetmap/iD/issues/4421
[#4288]: https://github.com/openstreetmap/iD/issues/4288

#### :rocket: Presets

* Add preset for `railway=light_rail` ([#4531], [#4528], thanks [@Vonter])

[#4531]: https://github.com/openstreetmap/iD/issues/4531
[#4528]: https://github.com/openstreetmap/iD/issues/4528
[@Vonter]: https://github.com/Vonter


# 2.5.0
##### 2017-Nov-10

#### :mega: Release Highlights

* :camera: We've added support for [OpenStreetCam](http://openstreetcam.org/) in the photo viewer!
This brings over 100 million user-contributed photos into the iD editor for improving OpenStreetMap.<br/>
_Check out what streetlevel photo coverage is available by opening the Map Data pane (shortcut <kbd>F</kbd>)_

* :pray: Special thank you to all of our new and first-time contributors who submitted pull requests for
[Hacktoberfest](https://hacktoberfest.digitalocean.com/)!

#### :tada: New Features

* Add support for OpenStreetCam ([#4499], [#3795])
* Add support for DigitalGlobe imagery vintage overlays (see [editor-layer-index/issues/#371], thanks [@marracci])
* Add API parameter to conditionally disable feature types ([#4439], [#4393], thanks [@ferdibiflator])
* Display name of gpx file in `imagery_used` instead of "Local GPX" ([#4440], [#4385], thanks [@ferdibiflator])
* Remove lodash from build scripts ([#4447], [#4378], [@DzikowskiW])

[editor-layer-index/issues/#371]: https://github.com/osmlab/editor-layer-index/issues/371
[#4499]: https://github.com/openstreetmap/iD/issues/4499
[#4447]: https://github.com/openstreetmap/iD/issues/4447
[#4440]: https://github.com/openstreetmap/iD/issues/4440
[#4439]: https://github.com/openstreetmap/iD/issues/4439
[#4393]: https://github.com/openstreetmap/iD/issues/4393
[#4385]: https://github.com/openstreetmap/iD/issues/4385
[#4378]: https://github.com/openstreetmap/iD/issues/4378
[#3795]: https://github.com/openstreetmap/iD/issues/3795
[@marracci]: https://github.com/marracci
[@ferdibiflator]: https://github.com/ferdibiflator
[@DzikowskiW]: https://github.com/DzikowskiW

#### :sparkles: Usability

* Improvements to Mapillary and OpenStreetCam usability ([#4512])
  * Traces are the only thing drawn at low zoom, circles appear at zoom 16, viewfield cones appear at zoom 18
  * Everything is drawn very dim by default
  * Hovering a marker will brighten that marker, the parent trace, and other markers along the trace
  * The selected marker is drawn bright yellow and scaled up to be extra visible
  * Standardize on "username | captured_at | sitelink" for attribution line
  * Render panoramic Mapillary viewfields as a sphere instead of cone ([#3154])
* Bump default max_zoom from 20 to 22 (this affects custom imagery layers)
* Allow spellcheck in textarea fields ([#4471])
* Move "Zoom in to edit" button out of the way, and allow wheel events to pass through to the map ([#4482])
* Better capitalization for "Zoom in", "Zoom out", "Edit now", "Zoom in to edit" ([#4492], thanks [@jaller94])

[#4512]: https://github.com/openstreetmap/iD/issues/4512
[#4492]: https://github.com/openstreetmap/iD/issues/4492
[#4482]: https://github.com/openstreetmap/iD/issues/4482
[#4471]: https://github.com/openstreetmap/iD/issues/4471
[#3154]: https://github.com/openstreetmap/iD/issues/3154
[@jaller94]: https://github.com/jaller94

#### :bug: Bugfixes

* Add code so `tunnel=building_passage` doesn't default to `layer=-1` ([#4516])
* Clicking on a search result should take you to that location the first time ([#4276])
* Fix label placement on areas that don't have an icon ([#4479])
* Don't add underscores to `source=*` field ([#4475], [#4474], thanks [@octagonal])
* Depend on `bhousel/node-diff3` which includes fix for conflict resolution node duplication bug ([#3544], [#3058])
* Allow copying text from info panels ([#4456], [#4406], thanks [@ferdibiflator])
* Make sure `imagery_used` field is updated if a user cancels save and makes more edits ([#4445], [#4443], thanks [@moshen])
* Fallback Area preset should preserve the `area=yes` tag ([#4424])

[#4516]: https://github.com/openstreetmap/iD/issues/4516
[#4479]: https://github.com/openstreetmap/iD/issues/4479
[#4475]: https://github.com/openstreetmap/iD/issues/4475
[#4474]: https://github.com/openstreetmap/iD/issues/4474
[#4456]: https://github.com/openstreetmap/iD/issues/4456
[#4445]: https://github.com/openstreetmap/iD/issues/4445
[#4443]: https://github.com/openstreetmap/iD/issues/4443
[#4424]: https://github.com/openstreetmap/iD/issues/4424
[#4406]: https://github.com/openstreetmap/iD/issues/4406
[#4276]: https://github.com/openstreetmap/iD/issues/4276
[#3544]: https://github.com/openstreetmap/iD/issues/3544
[#3058]: https://github.com/openstreetmap/iD/issues/3058
[@octagonal]: https://github.com/octagonal
[@ferdibiflator]: https://github.com/ferdibiflator
[@moshen]: https://github.com/moshen

#### :rocket: Presets

* Add `government=*` type field to Government Office preset ([#4517])
* Change `craft=sweep` -> `craft=chimney_sweeper` ([#4510])
* Add `shop=agrarian` preset and `agrarian=*` field ([#4507], thanks [@willemarcel])
* Change `max_age` to `min_age` for `min_age` field ([#4506], thanks [@JamesKingdom])
* Rename sculpter to sculptor ([#4504], thanks [@simonpoole])
* Add preset for music schools ([#4500], thanks [@tyrasd])
* Add `voltage`,`operator`,`ref` fields to several `power=*` presets.
* Add `power=switch` preset ([#4441])
* Drop `vertex` geometry from `office=*` presets (i.e. make them like `shop=*` presets)
* Add preset for "Pedestrian Area" (highway=pedestrian + area=yes) ([#4488])
* Rename `tourism=chalet` to "Holiday Cottage" and add search terms ([#4490])
* Remove poi-foot icon from `place=square` ([#4486])
* Add several presets for common `office=*` types ([#4491], [#4489], thanks [@Nmargolis])
* Add preset for `tourism=wilderness_hut` ([#4485], [#4483], thanks [@YuliyaVeklicheva])
* Fix reference links for `highway=crossing`, `footway=crossing` ([#4480])
* Add preset for `landuse=religious` ([#4478], [#4476], thanks [@YuliyaVeklicheva])
* Add "Climbing hut" search term to alpine hut ([#4470], [#4469], thanks [@JamesKingdom])
* Add presets for many kinds of Fitness Station equipment ([#4404], [#4373], thanks [@JamesKingdom])
* Deprecate `amenity=scrapyard` in favor of "approved" `industrial=scrap_yard` (revert of [#3387])
* Add `industrial=slaughterhouse` preset ([#4467], [#4466], thanks [@JamesKingdom])
* Add `power=transformer` preset ([#4464], [#4442], thanks [@ToeBee])
* Change drain icon to ditch ([#4462], [#4460], thanks [@AndreasHae])
* Add preset for `place=islet` ([#4461], [#4458], thanks [@AndreasHae])
* Add `leisure=boules` as "Boules/Bocce Court" ([#4451], [#4449], thanks [@DzikowskiW])
* Add `landuse=brownfield` and `landuse=greenfield` presets ([#4448], [#4444], thanks [@manfredbrandl])
* Add `leisure=sauna` preset ([#4438], [#4436], thanks [@haroldb])
* Add `substance=*` field to pipeline preset ([#4432], [#4430], thanks [@xmile1])
* Add `place=plot` preset ([#4427], [#4423], thanks [@humanforklift])

[#4517]: https://github.com/openstreetmap/iD/issues/4517
[#4510]: https://github.com/openstreetmap/iD/issues/4510
[#4507]: https://github.com/openstreetmap/iD/issues/4507
[#4506]: https://github.com/openstreetmap/iD/issues/4506
[#4504]: https://github.com/openstreetmap/iD/issues/4504
[#4500]: https://github.com/openstreetmap/iD/issues/4500
[#4441]: https://github.com/openstreetmap/iD/issues/4441
[#4488]: https://github.com/openstreetmap/iD/issues/4488
[#4490]: https://github.com/openstreetmap/iD/issues/4490
[#4486]: https://github.com/openstreetmap/iD/issues/4486
[#4491]: https://github.com/openstreetmap/iD/issues/4491
[#4489]: https://github.com/openstreetmap/iD/issues/4489
[#4485]: https://github.com/openstreetmap/iD/issues/4485
[#4483]: https://github.com/openstreetmap/iD/issues/4483
[#4480]: https://github.com/openstreetmap/iD/issues/4480
[#4478]: https://github.com/openstreetmap/iD/issues/4478
[#4476]: https://github.com/openstreetmap/iD/issues/4476
[#4470]: https://github.com/openstreetmap/iD/issues/4470
[#4469]: https://github.com/openstreetmap/iD/issues/4469
[#4404]: https://github.com/openstreetmap/iD/issues/4404
[#4373]: https://github.com/openstreetmap/iD/issues/4373
[#4467]: https://github.com/openstreetmap/iD/issues/4467
[#4466]: https://github.com/openstreetmap/iD/issues/4466
[#4464]: https://github.com/openstreetmap/iD/issues/4464
[#4462]: https://github.com/openstreetmap/iD/issues/4462
[#4442]: https://github.com/openstreetmap/iD/issues/4442
[#4461]: https://github.com/openstreetmap/iD/issues/4461
[#4460]: https://github.com/openstreetmap/iD/issues/4460
[#4458]: https://github.com/openstreetmap/iD/issues/4458
[#4451]: https://github.com/openstreetmap/iD/issues/4451
[#4449]: https://github.com/openstreetmap/iD/issues/4449
[#4448]: https://github.com/openstreetmap/iD/issues/4448
[#4444]: https://github.com/openstreetmap/iD/issues/4444
[#4438]: https://github.com/openstreetmap/iD/issues/4438
[#4436]: https://github.com/openstreetmap/iD/issues/4436
[#4432]: https://github.com/openstreetmap/iD/issues/4432
[#4430]: https://github.com/openstreetmap/iD/issues/4430
[#4427]: https://github.com/openstreetmap/iD/issues/4427
[#4423]: https://github.com/openstreetmap/iD/issues/4423
[#3387]: https://github.com/openstreetmap/iD/issues/3387
[@willemarcel]: https://github.com/willemarcel
[@JamesKingdom]: https://github.com/JamesKingdom
[@simonpoole]: https://github.com/simonpoole
[@tyrasd]: https://github.com/tyrasd
[@Nmargolis]: https://github.com/Nmargolis
[@YuliyaVeklicheva]: https://github.com/YuliyaVeklicheva
[@ToeBee]: https://github.com/ToeBee
[@AndreasHae]: https://github.com/AndreasHae
[@DzikowskiW]: https://github.com/DzikowskiW
[@manfredbrandl]: https://github.com/manfredbrandl
[@haroldb]: https://github.com/haroldb
[@xmile1]: https://github.com/xmile1
[@humanforklift]: https://github.com/humanforklift


# 2.4.3
##### 2017-Oct-09

#### :bug: Bugfixes

* Include unicode characters in hashtag matching ([#4398], [#4419], thanks [@mojodna])
* Allow common punctuation to split hashtags ([#4412], thanks [@mojodna])

[#4419]: https://github.com/openstreetmap/iD/issues/4419
[#4412]: https://github.com/openstreetmap/iD/issues/4412
[#4398]: https://github.com/openstreetmap/iD/issues/4398
[@mojodna]: https://github.com/mojodna

#### :mortar_board: Walkthrough / Help

* Make sure "Add Field" scrolls into view during "Area" chapter of walkthrough ([#4417])

[#4417]: https://github.com/openstreetmap/iD/issues/4417

#### :rocket: Presets

* Refined playground presets terms for Spring Rider and Play Roundabout ([#4415], thanks, [@1ec5])

[#4415]: https://github.com/openstreetmap/iD/issues/4415
[@1ec5]: https://github.com/1ec5


# 2.4.2
##### 2017-Oct-08

#### :tada: New Features

* Upgraded to TIGER 2017 overlay layer (thanks, [@iandees])
* Improve tunnel field on waterway presets to include `layer=*` subfield ([#4384])
* Standardize on one "simple" access field (for parking, toilets, swimming pools) that includes "yes" option ([#4383])
* Treat OSM data layer like other vector layers and give it a show/hide toggle on the Map Data pane ([#2904])
* Add link at bottom of save screen to download your changes as an osmChange file ([#4346], [#4350])
* Allow universal fields to have default values (related: [#4323])
* Display vintage and other metadata in the Background Panel for Esri World Imagery layer ([#4335], thanks [@jgravois])

[#4384]: https://github.com/openstreetmap/iD/issues/4384
[#4383]: https://github.com/openstreetmap/iD/issues/4383
[#4350]: https://github.com/openstreetmap/iD/issues/4350
[#4346]: https://github.com/openstreetmap/iD/issues/4346
[#4335]: https://github.com/openstreetmap/iD/issues/4335
[#4323]: https://github.com/openstreetmap/iD/issues/4323
[#2904]: https://github.com/openstreetmap/iD/issues/2904
[@iandees]: https://github.com/iandees
[@jgravois]: https://github.com/jgravois

#### :sparkles: Usability

* Change label for hashtag field to "Suggested Hashtags") ([#4396] thanks [@arka-nitd])
* Match generic Address preset for point, vertex, area, and if any part of the address is present ([#4353])
* Hide administrative boundaries by default ([#4292])
* Disable Undo/Redo when map is not editable ([#4358])
* Use the browser's pointer cursor (before it was a mix of browser pointer and custom cursor)
* Move "zoom to edit" button on top of map, allowing search when zoomed out ([#4279], [#3679], thanks [@leegenes])
* Sort preset with higher priority in preset list when search matches name exactly ([#4325])

[#4396]: https://github.com/openstreetmap/iD/issues/4396
[#4358]: https://github.com/openstreetmap/iD/issues/4358
[#4353]: https://github.com/openstreetmap/iD/issues/4353
[#4325]: https://github.com/openstreetmap/iD/issues/4325
[#4292]: https://github.com/openstreetmap/iD/issues/4292
[#4279]: https://github.com/openstreetmap/iD/issues/4279
[#3679]: https://github.com/openstreetmap/iD/issues/3679
[@arka-nitd]: https://github.com/arka-nitd
[@leegenes]: https://github.com/leegenes

#### :bug: Bugfixes

* Fix overlapping in preset list when multiple tag references are expanded ([#4023], [#4412], thanks [@jleh])
* Clicking delete button on the structure field (bridge, tunnel, etc.) should remove `layer=*` value also
* Disable source switcher during walkthrough, ([#4402], thanks [@pwelby])
* Prevent topbar buttons from moving in Firefox during save mode when css filter is active ([#4348])
* Refresh tag popup documentation when user switches presets ([#4209])
* Fix "request review" checkbox and button alignment ([#4354])
* Fix multiselect items that span more than one line ([#4349])
* Fix labels for detected objects in Mapillary viewer ([#4282])
* Ignore URLish fragments when detecting hashtags in changeset comment ([#4289])
* Several changes to avoid storing stale hashtags ([#4304])
* Match fewer punctuation characters in hashtags ([#4303])
* Avoid requesting blank tiles from Esri World Imagery ([#4327], thanks [@jgravois])
* Fix reflect actions to be invertable ([#4300], [#4328], thanks [@leegenes])

[#4412]: https://github.com/openstreetmap/iD/issues/4412
[#4402]: https://github.com/openstreetmap/iD/issues/4402
[#4354]: https://github.com/openstreetmap/iD/issues/4354
[#4349]: https://github.com/openstreetmap/iD/issues/4349
[#4348]: https://github.com/openstreetmap/iD/issues/4348
[#4328]: https://github.com/openstreetmap/iD/issues/4328
[#4327]: https://github.com/openstreetmap/iD/issues/4327
[#4304]: https://github.com/openstreetmap/iD/issues/4304
[#4303]: https://github.com/openstreetmap/iD/issues/4303
[#4300]: https://github.com/openstreetmap/iD/issues/4300
[#4289]: https://github.com/openstreetmap/iD/issues/4289
[#4282]: https://github.com/openstreetmap/iD/issues/4282
[#4209]: https://github.com/openstreetmap/iD/issues/4209
[#4023]: https://github.com/openstreetmap/iD/issues/4023
[@jleh]: https://github.com/jleh
[@pwelby]: https://github.com/pwelby
[@jgravois]: https://github.com/jgravois
[@leegenes]: https://github.com/leegenes

#### :earth_asia: Localization

* Improve Address format for Poland ([#4328], thanks [@Teiron])
* Improve Phone formats for Austria, Ivory Coast and Benin ([#4314], thanks [@manfredbrandl])
* Remove `addr:unit` from Germany, Austria, Switzerland addresses fields ([#4301], thanks [@manfredbrandl])
* Remove `addr:unit` from Brazil addresses field ([#4284], thanks [@willemarcel])

[#4328]: https://github.com/openstreetmap/iD/issues/4328
[#4314]: https://github.com/openstreetmap/iD/issues/4314
[#4301]: https://github.com/openstreetmap/iD/issues/4301
[#4284]: https://github.com/openstreetmap/iD/issues/4284
[@Teiron]: https://github.com/Teiron
[@manfredbrandl]: https://github.com/manfredbrandl
[@willemarcel]: https://github.com/willemarcel

#### :rocket: Presets

* Add Tile Shop and Trade Shop presets ([#4410], thanks [@TheGreenToaster])
* Allow camera presets to be placed on vertex geometry (e.g. along walls) ([#4400], thanks [@JamesKingdom])
* Add preset for `man_made=crane` ([#4374], thanks [@willemarcel])
* Rename "Confectionery" to "Candy Maker" and add "sweet" as search term ([#4388], thanks [@JamesKingdom])
* Add "trim trail" as a search term for Fitness Station preset
* Add several presets for common playground equipment ([#4352], [#4375], thanks [@JamesKingdom])
* Add fields for volcano type and status ([#4366], [#4365] thanks [@JamesKingdom])
* Add "trig point" search term to Survey Point preset ([#4367], thanks [@JamesKingdom])
* Fix misspellings in healthcare preset search terms ([#4363], thanks [@willemarcel])
* Add memorial type dropdown field ([#4357], thanks [@boothym])
* Deprecate preset for `shop=furnace` ([#4347])
* Add healthcare presets, and `healthcare=*` tags to some existing presets ([#4329], [#3589], thanks [@JamesKingdom])
* Add `intermittent=yes` checkbox field, and Intermittent Stream preset ([#4337])
* Add `tourism=attraction` as a universal field ([#4323])
* Add preset for Hackerspace ([#4332], thanks [@willemarcel])
* Add preset for Feminine Hygiene Vending Machine ([#4331], [#4275], thanks [@willemarcel])
* Don't allow certain presets to be used on areas ([#4319], [#4330], thanks [@willemarcel])
* Improve `traffic_calming=table` presets (raised pedestrian crossing) ([#4309])
* Add `maxspeed=*` field back to Living Street preset ([#4260], thanks [@JamesKingdom])
* Remove `artwork_type=*` field from Art Shop and Art Gallery presets ([#4298], thanks [@simonpoole])
* Add additional fields (operator, duration, access) to Ferry Route preset ([#4296], thanks [@willemarcel])
* Add Waterway relation preset ([#4318], [#4299], thanks [@JamesKingdom])
* Allow Defibrillator preset to be placed on vertex geometry (e.g. along walls) ([#4290], [#4287] thanks [@JamesKingdom])
* Add name field back to Wood preset ([#4200], thanks [@JamesKingdom])

[#4410]: https://github.com/openstreetmap/iD/issues/4410
[#4400]: https://github.com/openstreetmap/iD/issues/4400
[#4388]: https://github.com/openstreetmap/iD/issues/4388
[#4375]: https://github.com/openstreetmap/iD/issues/4375
[#4374]: https://github.com/openstreetmap/iD/issues/4374
[#4367]: https://github.com/openstreetmap/iD/issues/4367
[#4366]: https://github.com/openstreetmap/iD/issues/4366
[#4365]: https://github.com/openstreetmap/iD/issues/4365
[#4363]: https://github.com/openstreetmap/iD/issues/4363
[#4357]: https://github.com/openstreetmap/iD/issues/4357
[#4352]: https://github.com/openstreetmap/iD/issues/4352
[#4347]: https://github.com/openstreetmap/iD/issues/4347
[#4337]: https://github.com/openstreetmap/iD/issues/4337
[#4332]: https://github.com/openstreetmap/iD/issues/4332
[#4331]: https://github.com/openstreetmap/iD/issues/4331
[#4330]: https://github.com/openstreetmap/iD/issues/4330
[#4329]: https://github.com/openstreetmap/iD/issues/4329
[#4323]: https://github.com/openstreetmap/iD/issues/4323
[#4319]: https://github.com/openstreetmap/iD/issues/4319
[#4318]: https://github.com/openstreetmap/iD/issues/4318
[#4309]: https://github.com/openstreetmap/iD/issues/4309
[#4299]: https://github.com/openstreetmap/iD/issues/4299
[#4298]: https://github.com/openstreetmap/iD/issues/4298
[#4296]: https://github.com/openstreetmap/iD/issues/4296
[#4290]: https://github.com/openstreetmap/iD/issues/4290
[#4287]: https://github.com/openstreetmap/iD/issues/4287
[#4275]: https://github.com/openstreetmap/iD/issues/4275
[#4260]: https://github.com/openstreetmap/iD/issues/4260
[#4200]: https://github.com/openstreetmap/iD/issues/4200
[#3589]: https://github.com/openstreetmap/iD/issues/3589
[@TheGreenToaster]: https://github.com/TheGreenToaster
[@JamesKingdom]: https://github.com/JamesKingdom
[@willemarcel]: https://github.com/willemarcel
[@boothym]: https://github.com/boothym
[@simonpoole]: https://github.com/simonpoole


# 2.4.1
##### 2017-Aug-26

#### :bug: Bugfixes

* Write post-save count, not pre-save count to the changesets_count tag ([#4283])

[#4283]: https://github.com/openstreetmap/iD/issues/4283


# 2.4.0
##### 2017-Aug-25

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
##### 2017-Jul-24

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
##### 2017-Jul-11

#### :sparkles: Usability

* Display left click icon for "Place a point" on keyboard shortcuts screen

#### :bug: Bugfixes

* Don't lose the imagery offset when switching between "Custom" and another background imagery layer ([#3982])
* After splitting a way, update all matching relation members (fix for broken u-turn relations) ([#4140])

[#3982]: https://github.com/openstreetmap/iD/issues/3982
[#4140]: https://github.com/openstreetmap/iD/issues/4140


# 2.3.0
##### 2017-Jul-07

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

#### :mortar_board: Walkthrough / Help

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
##### 2017-Jun-12

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
##### 2017-May-12

#### :bug: Bugfixes

* Allow right-click and contextmenu events to work on the sidebar ([#4036])
* Omit global search UI when no geocoder ([#4032], thanks [@mojodna])
* Don't replace spaces with underscores in `opening_hours` field ([#4030])

[#4036]: https://github.com/openstreetmap/iD/issues/4036
[#4030]: https://github.com/openstreetmap/iD/issues/4030
[#4032]: https://github.com/openstreetmap/iD/issues/4032

[@mojodna]: https://github.com/mojodna


# 2.2.0
##### 2017-May-09

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

#### :mortar_board: Walkthrough / Help - major updates! ([#3921])
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
##### 2017-Feb-24

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
##### 2017-Feb-07

#### :bug: Bugfixes
* Fix point dragging regression ([#3829])

[#3829]: https://github.com/openstreetmap/iD/issues/3829


# 2.1.1
##### 2017-Feb-06

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
##### 2017-Feb-04

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
##### 2016-Dec-22

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
##### 2016-Nov-17

#### :bug: Bugfixes
* When starting iD with an object selected, the map should focus on that object ([#3588], thanks [@tyrasd])
* Fix for "Best" imagery not being automatically selected ([#3586])

[#3588]: https://github.com/openstreetmap/iD/issues/3588
[#3586]: https://github.com/openstreetmap/iD/issues/3586

[@tyrasd]: https://github.com/tyrasd

#### :hourglass: Performance
* Adjust max Mapillary pages fetched per zoom, adjust min viewfield zoom


# 2.0.0
##### 2016-Nov-15

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
##### 2016-Jul-16
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
##### 2016-Jun-07
* Embed interactive Mapillary JS viewer instead of static image (#3128, thanks @kepta, @peterneubauer)
* Add "grill" as search term for `amenity=bbq` preset (#3139, thanks @manfredbrandl)
* When setting Wikipedia value, also set corresponding Wikidata tag (#2732, thanks @1ec5)


# 1.9.5
##### 2016-May-25
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
##### 2016-May-03
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
##### 2016-Apr-25
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
##### 2016-Mar-18
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
##### 2016-Mar-03
* Add context.asset for building asset filenames, use for Mapillary Traffico files (#3011)
* Fix crash in starting tutorial, bad selector for .layer-background opacity (#3010)


# 1.9.0
##### 2016-Mar-01
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
##### 2016-Jan-18
* Fix address field to not lose focus while typing (#2903, #2320)
* Bugfixes for Internet Explorer (classList #2909, parentElement #2910)
* Presets for various man_made tags (#2893, thanks @manfredbrandl)


# 1.8.4
##### 2016-Jan-06
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
##### 2015-Dec-11
* Replace nonstandard Array `find` with `_.find` for IE11 (#2871)


# 1.8.2
##### 2015-Dec-10
* Better save and restore map state when entering walkthrough
* Add maxstay field for amenity=parking preset (#2851)
* Add presets for popular vending machines (#2827, thanks @henningvs)
* Fix turn restriction rendering under Firefox (#2860)
* Handle situation when user closes oauth dialog window (#2858)
* Don't set `building=yes` for `amenity=fuel` preset (#2857)
* Eliminate rounding causing jumpiness and loss of precision (#2849)


# 1.8.1
##### 2015-Dec-02
* Fix tag help lookup (#2844)
* Support Internet Explorer 11 and Edge browsers (#2571)
* New road styling for bumpy/unpaved roads (#2564, #2750, #2847)
* Disambiguate building/office presets (#2793, #2799)
* Add handrail field to steps preset (#2815)
* Choose "best" imagery by default (#2826)
* Fix language detection when `navigator.languages` is empty (#2838) (thanks @jleedev)
* Support multiple overlays and fix alignment of minimap (#2813) (thanks @brianreavis)


# 1.8.0
##### 2015-Nov-07
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
##### 2015-Sep-28
* Relicense iD with ISC license


# 1.7.4
##### 2015-Sep-15
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
##### 2015-Jun-10
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
##### 2015-May-03
* Fix for 404 Error caused by duplicates in multi-fetch node request (#2626)
* Fix oil well preset (#2621) (Thanks @1ec5)


# 1.7.1
##### 2015-Apr-30
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
##### 2015-Feb-12
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
##### 2014-Oct-24
* Fix "TypeError: r is undefined" (#2421)


# 1.6.1
##### 2014-Oct-23
* Remember raw tag editor expansion state across sessions (#2416)
* Translate text in changes section on save panel (#2417)
* Encode URL hash correctly (#2406)
* Capture ⌘-S even in input fields (#2409)
* Added some traffic_calming=* presets
* Prefer power=substation to sub_station
* Include state/province in U.S. and Canadian address formats
* Improve the error message on saving when offline (#2373)


# 1.6.0
##### 2014-Oct-06
* Add network field to Road Route relation preset (#2372)
* Updated TIGER layer to use TIGER 2014
* Added support for street-level imagery from Mapillary
* Added support for taginfo projects data
* Better infer restriction for no_u_turn (#2345)
* Update to rbush 1.3.3
* Improved a variety of presets
* Added `comment` url param to prefill changeset comment (#2311)


# 1.5.4
##### 2014-Jul-29
* Do not fully fill certain landuse values, e.g. landuse=residential (#542)
* Class midpoints to match parent way and adjust styles
* Test visibility of gpx coords instead of just comparing extents


# 1.5.3
##### 2014-Jul-25
* When adding gpx, only rezoom map if gpx not in viewport (#2297)
* Workaround for Chrome crash (#2295)
* Add mtb fields (#2244)
* Support option strings for combo fields (#2296)
* Render triangular midpoints to show direction of any selected way (#2292)


# 1.5.2
##### 2014-Jul-15
* Fixed Chrome/Windows selection bug (#2151)
* Don't automatically tag motorways, etc. as oneway=yes
* Disable Move and Rotate operations if area < 80% contained in the viewport


# 1.5.1
##### 2014-Jul-10
* Fix mixed content errors on https osm.org (#2281)
* Fix suggested access values for parking (#2280)


# 1.5.0
##### 2014-Jul-08
* Add support for localized address fields (#2246)
* Rendering improvements for layers (#2250)
* Add a map scale (#2266)
* Fix preset buttons (#2247)
* Better midpoint rendering (#2257)


# 1.4.0
##### 2014-May-29
* Ensure combobox menus are closed on blur (#2207)
* Limit imagery_used tag to 255 characters (#2181)
* Simplify and fix midpoint drawing logic (#2136)
* Prefer more specific 'Crosswalk' preset over generic 'Crossing'
* Add amenity=dojo preset
* Correctly trim whitespace in semicolon-separated multivalues (#2236)
* oneway fields now show "Assumed to be No" or "Assumed to be Yes" instead of "Unknown" (#2220)
* Add turn restriction editor


# 1.3.10
##### 2014-May-21
* `oneway=no` overrides implicit oneways on junction=roundabout, etc. (#2220)
* Add presets for fords, parking_entrance, charging_station, compressed_air, churchyard, shop=wine
* Improve access placeholders (#2221)
* Trim tag keys, and prevent duplicate tag keys (#2043)
* Fix inline tag help for fields that handle multiple tags
* Add 'width', 'length', 'lit' for appropriate presets (cycleways, sidewalks, sports pitch, etc)
* Render embankment/cutting with dashed casing
* Rendering fixes for buildings, tunnels
* Add population field for various place presets
* Improvements to circularize action (#2194)
* Building field is yes/no (fixes #2111)
* Area fill colors in preset icons match map fill colors
* Add fill style for landuse=military


# 1.3.9
##### 2014-Apr-09
* Prevent closed areas from invalid disconnection (#2178)
* Remove layer field from waterway=stream
* Add preset for place=suburb and shop=seafood
* Remember last custom tile layer (#2094)
* Mapbox Satellite now supports z17-z19


# 1.3.8
##### 2014-Mar-28
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
##### 2014-Feb-25
* Added building presets
* Improve how tags are merged when merging to a multipolygon
* Disable merge operation if at least one relation is incomplete
* Add shop=bookmaker, shop=lottery, and shop=art presets
* Use https URLs where supported
* Fix duplicate/missing objects after restoring data from localStorage
* Remove addr:housename field from address preset


# 1.3.6
##### 2014-Feb-05
* More protection against relation loops (#2096)
* Fix freeze when using Clinic preset (#2102)
* Allow rotating closed multipolygon members (#1718)
* Bump threshold for Orthogonalize to 12 degrees
* Added social_facility presets (#2109)


# 1.3.5
##### 2014-Jan-08
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
##### 2013-Nov-26
* Replace TIGER 2012 layer with next-generation TIGER 2013 layer (#2010)
* Add tooltips to "untagged feature" warnings
* Add pressets and category for golf features (#2013)
* Information and bike parking preset refinements
* Faster/smoother zooming and panning
* Add "quick add" presets for common proper names
* Fix zoom to feature when clicking search results (#2023)


# 1.3.3
##### 2013-Nov-22
* Support for loading GPX-files via url parameter (#1965)
* Update osm-auth (#1904)
* Update 3rd party dependencies (Lo-Dash, D3, RBush)
* Build iD.Way.areaKeys from presets
* Add public_transport, military, emankment presets
* Reverse cardinal directions for relation member roles
* Improved warning visibility (#1973)
* Fix undo-related bug (#1978)


# 1.3.2
##### 2013-Nov-14
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
##### 2013-Oct-26
* Fix misalignment -> Fix alignment (#1913)
* Update maki (#1916)
* Prioritize boundary tag to minimize area fills (#1920)
* Fix background defaulting to 0% brightness (#1923)


# 1.3.0
##### 2013-Oct-24
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
##### 2013-Sep-30
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
##### 2013-Sep-26
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
##### 2013-Aug-24
* Fix walkthrough on Firefox (#1743)
* Fix icon at end of walkthough (#1740)
* Fix walkthrough (#1739)


# 1.1.5
##### 2013-Aug-23
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
##### 2013-Aug-17
* Fix adding multilingual name (#1694)
* Fix social buttons (#1690)
* Work around a Firefox bug that sometimes caused elements to be unselectable or stuck dragging (#1691, #1692)


# 1.1.3
##### 2013-Aug-15
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
##### 2013-Aug-12
* Fix cursor offset when clicking/dragging after resizing the window (#1678)
* Include low-frequency tag values if they have a wiki entry
* Fix tag value suggestions in preset comboboxes (#1679, #1680)


# 1.1.1
##### 2013-Aug-09
* Improve performance when drawing
* Tail should appear only first time
* Fix radial menu tooltip positioning on Firefox


# 1.1.0
##### 2013-Aug-09
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
##### 2013-May-10
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
