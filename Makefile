# See the README for installation instructions.

all: \
	$(BUILDJS_TARGETS) \
	dist/iD.css \
	dist/iD.js \
	dist/iD.min.js \
	dist/img/iD-sprite.svg \
	dist/img/maki-sprite.svg


MAKI_SOURCES = node_modules/maki/src/*.svg

$(MAKI_SOURCES): node_modules/.install

dist/img/maki-sprite.svg: $(MAKI_SOURCES) Makefile
	node_modules/.bin/svg-sprite --symbol --symbol-dest . --symbol-sprite $@ $(MAKI_SOURCES)

data/feature-icons.json: $(MAKI_SOURCES)
	cp -f node_modules/maki/www/maki-sprite.json $@

dist/img/iD-sprite.svg: svg/iD-sprite.src.svg svg/iD-sprite.json
	node svg/spriteify.js --svg svg/iD-sprite.src.svg --json svg/iD-sprite.json > $@

BUILDJS_TARGETS = \
	data/presets/categories.json \
	data/presets/fields.json \
	data/presets/presets.json \
	data/presets.yaml \
	data/taginfo.json \
	data/data.js \
	dist/locales/en.js \
	dist/presets.js \
	dist/imagery.js

BUILDJS_SOURCES = \
	$(filter-out $(BUILDJS_TARGETS), $(shell find data -type f -name '*.json')) \
	data/feature-icons.json \
	data/core.yaml

$(BUILDJS_TARGETS): $(BUILDJS_SOURCES) build.js
	node build.js


MODULE_TARGETS = \
	js/lib/id/actions.js \
	js/lib/id/core.js \
	js/lib/id/geo.js \
	js/lib/id/modes.js \
	js/lib/id/operations.js \
	js/lib/id/presets.js \
	js/lib/id/services.js \
	js/lib/id/util.js \
	js/lib/id/validations.js

js/lib/id/actions.js: $(shell find modules/actions -type f)
	@rm -f $@
	node_modules/.bin/rollup -f umd -n iD.actions modules/actions/index.js --no-strict -o $@

js/lib/id/core.js: $(shell find modules/core -type f)
	@rm -f $@
	node_modules/.bin/rollup -f umd -n iD modules/core/index.js --no-strict -o $@

js/lib/id/geo.js: $(shell find modules/geo -type f)
	@rm -f $@
	node_modules/.bin/rollup -f umd -n iD.geo modules/geo/index.js --no-strict -o $@

js/lib/id/modes.js: $(shell find modules/modes -type f)
	@rm -f $@
	node_modules/.bin/rollup -f umd -n iD.modes modules/modes/index.js --no-strict -o $@

js/lib/id/operations.js: $(shell find modules/modes -type f)
	@rm -f $@
	node_modules/.bin/rollup -f umd -n iD.operations modules/operations/index.js --no-strict -o $@

js/lib/id/presets.js: $(shell find modules/presets -type f)
	@rm -f $@
	node_modules/.bin/rollup -f umd -n iD.presets modules/presets/index.js --no-strict -o $@

js/lib/id/services.js: $(shell find modules/services -type f)
	@rm -f $@
	node_modules/.bin/rollup -f umd -n iD.services modules/services/index.js --no-strict -o $@

js/lib/id/util.js: $(shell find modules/util -type f)
	@rm -f $@
	node_modules/.bin/rollup -f umd -n iD.util modules/util/index.js --no-strict -o $@

js/lib/id/validations.js: $(shell find modules/validations -type f)
	@rm -f $@
	node_modules/.bin/rollup -f umd -n iD.validations modules/validations/index.js --no-strict -o $@


dist/iD.js: \
	js/lib/bootstrap-tooltip.js \
	js/lib/d3.v3.js \
	js/lib/d3.combobox.js \
	js/lib/d3.geo.tile.js \
	js/lib/d3.jsonp.js \
	js/lib/d3.keybinding.js \
	js/lib/d3.one.js \
	js/lib/d3.dimensions.js \
	js/lib/d3.trigger.js \
	js/lib/d3.curtain.js \
	js/lib/d3.value.js \
	js/lib/diff3.js \
	js/lib/jxon.js \
	js/lib/lodash.js \
	js/lib/osmauth.js \
	js/lib/rbush.js \
	js/lib/sexagesimal.js \
	js/lib/togeojson.js \
	js/lib/marked.js \
	js/id/start.js \
	js/id/id.js \
	$(MODULE_TARGETS) \
	js/id/behavior.js \
	js/id/behavior/add_way.js \
	js/id/behavior/breathe.js \
	js/id/behavior/copy.js \
	js/id/behavior/drag.js \
	js/id/behavior/draw.js \
	js/id/behavior/draw_way.js \
	js/id/behavior/edit.js \
	js/id/behavior/hash.js \
	js/id/behavior/hover.js \
	js/id/behavior/lasso.js \
	js/id/behavior/paste.js \
	js/id/behavior/select.js \
	js/id/behavior/tail.js \
	js/id/renderer/background.js \
	js/id/renderer/background_source.js \
	js/id/renderer/features.js \
	js/id/renderer/map.js \
	js/id/renderer/tile_layer.js \
	js/id/svg.js \
	js/id/svg/areas.js \
	js/id/svg/debug.js \
	js/id/svg/defs.js \
	js/id/svg/gpx.js \
	js/id/svg/icon.js \
	js/id/svg/labels.js \
	js/id/svg/layers.js \
	js/id/svg/lines.js \
	js/id/svg/mapillary_images.js \
	js/id/svg/mapillary_signs.js \
	js/id/svg/midpoints.js \
	js/id/svg/osm.js \
	js/id/svg/points.js \
	js/id/svg/tag_classes.js \
	js/id/svg/turns.js \
	js/id/svg/vertices.js \
	js/id/ui.js \
	js/id/ui/account.js \
	js/id/ui/attribution.js \
	js/id/ui/background.js \
	js/id/ui/cmd.js \
	js/id/ui/commit.js \
	js/id/ui/confirm.js \
	js/id/ui/conflicts.js \
	js/id/ui/contributors.js \
	js/id/ui/disclosure.js \
	js/id/ui/entity_editor.js \
	js/id/ui/feature_info.js \
	js/id/ui/feature_list.js \
	js/id/ui/flash.js \
	js/id/ui/full_screen.js \
	js/id/ui/geolocate.js \
	js/id/ui/help.js \
	js/id/ui/info.js \
	js/id/ui/inspector.js \
	js/id/ui/intro.js \
	js/id/ui/lasso.js \
	js/id/ui/loading.js \
	js/id/ui/map_data.js \
	js/id/ui/map_in_map.js \
	js/id/ui/modal.js \
	js/id/ui/modes.js \
	js/id/ui/notice.js \
	js/id/ui/preset_icon.js \
	js/id/ui/preset.js \
	js/id/ui/preset_list.js \
	js/id/ui/radial_menu.js \
	js/id/ui/raw_member_editor.js \
	js/id/ui/raw_membership_editor.js \
	js/id/ui/raw_tag_editor.js \
	js/id/ui/restore.js \
	js/id/ui/save.js \
	js/id/ui/scale.js \
	js/id/ui/selection_list.js \
	js/id/ui/sidebar.js \
	js/id/ui/source_switch.js \
	js/id/ui/spinner.js \
	js/id/ui/splash.js \
	js/id/ui/status.js \
	js/id/ui/success.js \
	js/id/ui/tag_reference.js \
	js/id/ui/toggle.js \
	js/id/ui/undo_redo.js \
	js/id/ui/view_on_osm.js \
	js/id/ui/zoom.js \
	js/id/ui/preset/access.js \
	js/id/ui/preset/address.js \
	js/id/ui/preset/check.js \
	js/id/ui/preset/combo.js \
	js/id/ui/preset/cycleway.js \
	js/id/ui/preset/input.js \
	js/id/ui/preset/localized.js \
	js/id/ui/preset/maxspeed.js \
	js/id/ui/preset/radio.js \
	js/id/ui/preset/restrictions.js \
	js/id/ui/preset/textarea.js \
	js/id/ui/preset/wikipedia.js \
	js/id/ui/intro/area.js \
	js/id/ui/intro/line.js \
	js/id/ui/intro/navigation.js \
	js/id/ui/intro/point.js \
	js/id/ui/intro/start_editing.js \
	js/id/end.js \
	js/lib/locale.js \
	data/introGraph.js

.INTERMEDIATE dist/iD.js: data/data.js

dist/iD.js: node_modules/.install Makefile
	@rm -f $@
	cat $(filter %.js,$^) > $@

dist/iD.min.js: dist/iD.js Makefile
	@rm -f $@
	node_modules/.bin/uglifyjs $< -c -m -o $@

dist/iD.css: css/*.css
	cat css/reset.css css/map.css css/app.css > $@

node_modules/.install: package.json
	npm install
	touch node_modules/.install

translations:
	node data/update_locales

imagery:
	npm install editor-layer-index@git://github.com/osmlab/editor-layer-index.git#gh-pages
	node data/update_imagery

suggestions:
	npm install name-suggestion-index@git://github.com/osmlab/name-suggestion-index.git
	cp node_modules/name-suggestion-index/name-suggestions.json data/name-suggestions.json

wikipedias:
	npm install wmf-sitematrix@git://github.com/osmlab/wmf-sitematrix.git
	cp node_modules/wmf-sitematrix/wikipedia.min.json data/wikipedia.json

D3_FILES = \
	node_modules/d3/src/start.js \
	node_modules/d3/src/arrays/index.js \
	node_modules/d3/src/behavior/behavior.js \
	node_modules/d3/src/behavior/zoom.js \
	node_modules/d3/src/core/index.js \
	node_modules/d3/src/event/index.js \
	node_modules/d3/src/geo/length.js \
	node_modules/d3/src/geo/mercator.js \
	node_modules/d3/src/geo/path.js \
	node_modules/d3/src/geo/stream.js \
	node_modules/d3/src/geom/polygon.js \
	node_modules/d3/src/geom/hull.js \
	node_modules/d3/src/selection/index.js \
	node_modules/d3/src/transition/index.js \
	node_modules/d3/src/xhr/index.js \
	node_modules/d3/src/end.js

d3:
	node_modules/.bin/smash $(D3_FILES) > js/lib/d3.v3.js
	@echo 'd3 rebuilt. Please reapply 7e2485d, 4da529f, 223974d and 71a3d3e'

lodash:
	node_modules/.bin/lodash --development --output js/lib/lodash.js include="includes,toPairs,assign,bind,chunk,clone,compact,debounce,difference,each,every,extend,filter,find,first,forEach,forOwn,groupBy,indexOf,intersection,isEmpty,isEqual,isFunction,keys,last,map,omit,reject,some,throttle,union,uniq,values,without,flatten,value,chain,cloneDeep,merge,pick,reduce" exports="global,node"

clean:
	rm -f $(BUILDJS_TARGETS) $(MODULE_TARGETS) data/feature-icons.json dist/iD*.js dist/iD.css dist/img/*.svg
