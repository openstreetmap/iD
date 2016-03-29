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
	js/id/services.js \
	js/id/services/mapillary.js \
	js/id/services/nominatim.js \
	js/id/services/taginfo.js \
	js/id/services/wikipedia.js \
	js/id/util.js \
	js/id/util/session_mutex.js \
	js/id/util/suggest_names.js \
	js/id/geo.js \
	js/id/geo/extent.js \
	js/id/geo/intersection.js \
	js/id/geo/multipolygon.js \
	js/id/geo/raw_mercator.js \
	js/id/actions.js \
	js/id/actions/add_entity.js \
	js/id/actions/add_member.js \
	js/id/actions/add_midpoint.js \
	js/id/actions/add_vertex.js \
	js/id/actions/change_member.js \
	js/id/actions/change_preset.js \
	js/id/actions/change_tags.js \
	js/id/actions/circularize.js \
	js/id/actions/connect.js \
	js/id/actions/copy_entities.js \
	js/id/actions/delete_member.js \
	js/id/actions/delete_multiple.js \
	js/id/actions/delete_node.js \
	js/id/actions/delete_relation.js \
	js/id/actions/delete_way.js \
	js/id/actions/deprecate_tags.js \
	js/id/actions/discard_tags.js \
	js/id/actions/disconnect.js \
	js/id/actions/join.js \
	js/id/actions/merge.js \
	js/id/actions/merge_polygon.js \
	js/id/actions/merge_remote_changes.js \
	js/id/actions/move.js \
	js/id/actions/move_node.js \
	js/id/actions/noop.js \
	js/id/actions/orthogonalize.js \
	js/id/actions/restrict_turn.js \
	js/id/actions/reverse.js \
	js/id/actions/revert.js \
	js/id/actions/rotate_way.js \
	js/id/actions/split.js \
	js/id/actions/straighten.js \
	js/id/actions/unrestrict_turn.js \
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
	js/id/modes.js \
	js/id/modes/add_area.js \
	js/id/modes/add_line.js \
	js/id/modes/add_point.js \
	js/id/modes/browse.js \
	js/id/modes/drag_node.js \
	js/id/modes/draw_area.js \
	js/id/modes/draw_line.js \
	js/id/modes/move.js \
	js/id/modes/rotate_way.js \
	js/id/modes/save.js \
	js/id/modes/select.js \
	js/id/operations.js \
	js/id/operations/circularize.js \
	js/id/operations/continue.js \
	js/id/operations/delete.js \
	js/id/operations/disconnect.js \
	js/id/operations/merge.js \
	js/id/operations/move.js \
	js/id/operations/orthogonalize.js \
	js/id/operations/reverse.js \
	js/id/operations/rotate.js \
	js/id/operations/split.js \
	js/id/operations/straighten.js \
	js/id/core/connection.js \
	js/id/core/difference.js \
	js/id/core/entity.js \
	js/id/core/graph.js \
	js/id/core/history.js \
	js/id/core/node.js \
	js/id/core/relation.js \
	js/id/core/tags.js \
	js/id/core/tree.js \
	js/id/core/way.js \
	js/id/renderer/background.js \
	js/id/renderer/background_source.js \
	js/id/renderer/features.js \
	js/id/renderer/map.js \
	js/id/renderer/tile_layer.js \
	js/id/svg.js \
	js/id/svg/areas.js \
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
	js/id/presets.js \
	js/id/presets/category.js \
	js/id/presets/collection.js \
	js/id/presets/field.js \
	js/id/presets/preset.js \
	js/id/validations.js \
	js/id/validations/deprecated_tag.js \
	js/id/validations/many_deletions.js \
	js/id/validations/missing_tag.js \
	js/id/validations/tag_suggests_area.js \
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

clean:
	rm -f $(BUILDJS_TARGETS) data/feature-icons.json dist/iD*.js dist/iD.css dist/img/*.svg

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

js/lib/d3.v3.js: $(D3_FILES)
	node_modules/.bin/smash $(D3_FILES) > $@
	@echo 'd3 rebuilt. Please reapply 7e2485d, 4da529f, and 223974d'

js/lib/lodash.js: Makefile
	node_modules/.bin/lodash --development --output $@ include="any,assign,bind,chunk,clone,compact,contains,debounce,difference,each,every,extend,filter,find,first,forEach,forOwn,groupBy,indexOf,intersection,isEmpty,isEqual,isFunction,keys,last,map,omit,pairs,pluck,reject,some,throttle,union,uniq,unique,values,without,flatten,value,chain,cloneDeep,merge,pick,reduce" exports="global,node"
