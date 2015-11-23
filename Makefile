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
	svg-sprite --symbol --symbol-dest . --symbol-sprite $@ $(MAKI_SOURCES)

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
	js/lib/d3.typeahead.js \
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
	js/id/services/*.js \
	js/id/util.js \
	js/id/util/*.js \
	js/id/geo.js \
	js/id/geo/*.js \
	js/id/actions.js \
	js/id/actions/*.js \
	js/id/behavior.js \
	js/id/behavior/*.js \
	js/id/modes.js \
	js/id/modes/*.js \
	js/id/operations.js \
	js/id/operations/*.js \
	js/id/core/*.js \
	js/id/renderer/*.js \
	js/id/svg.js \
	js/id/svg/*.js \
	js/id/ui.js \
	js/id/ui/*.js \
	js/id/ui/preset/*.js \
	js/id/ui/intro/*.js \
	js/id/presets.js \
	js/id/presets/*.js \
	js/id/validations.js \
	js/id/validations/*.js \
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
	npm install && touch node_modules/.install

clean:
	rm -f $(BUILDJS_TARGETS) data/feature-icons.json dist/iD*.js dist/iD.css dist/img/*.svg

translations:
	node data/update_locales

imagery:
	npm install editor-imagery-index@git://github.com/osmlab/editor-imagery-index.git#gh-pages && node data/update_imagery

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
