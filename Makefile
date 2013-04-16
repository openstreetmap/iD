# See the README for installation instructions.

UGLIFY = ./node_modules/uglify-js/bin/uglifyjs
JS_BEAUTIFIER = $(UGLIFY) -b -i 2 -nm -ns
JS_COMPILER = $(UGLIFY)
LOCALE ?= en_US

all: \
	dist/iD.js \
	dist/iD.min.js \
	dist/img/line-presets.png \
	dist/iD.css

DATA_FILES = $(shell find data -type f -name '*.json' -o -name '*.md')
data/data.js: $(DATA_FILES) dist/img/maki-sprite.png
	node build.js

data/locales/en.js: data/core.yaml data/presets.yaml
	node build.js

dist/iD.js: \
	js/lib/bootstrap-tooltip.js \
	js/lib/d3.v3.js \
	js/lib/d3.combobox.js \
	js/lib/d3.geo.tile.js \
	js/lib/d3.jsonp.js \
	js/lib/d3.keybinding.js \
	js/lib/d3.one.js \
	js/lib/d3.size.js \
	js/lib/d3.trigger.js \
	js/lib/d3.typeahead.js \
	js/lib/d3.curtain.js \
	js/lib/jxon.js \
	js/lib/lodash.js \
	js/lib/osmauth.js \
	js/lib/rtree.js \
	js/lib/togeojson.js \
	js/lib/marked.js \
	js/id/start.js \
	js/id/id.js \
	js/id/services/*.js \
	js/id/util.js \
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
	js/id/validate.js \
	js/id/end.js \
	js/lib/locale.js \
	data/introGraph.js \
	data/locales.js

.INTERMEDIATE dist/iD.js: data/data.js

dist/iD.js: node_modules/.install Makefile
	@rm -f $@
	cat $(filter %.js,$^) > $@

dist/iD.min.js: dist/iD.js Makefile
	@rm -f $@
	$(JS_COMPILER) $< -c -m -o $@

dist/iD.css: css/*.css
	cat css/reset.css css/map.css css/app.css css/line-presets.css css/maki-sprite.css > $@

node_modules/.install: package.json
	npm install && touch node_modules/.install

clean:
	rm -f iD*.js

translations:
	node data/update_locales

data/locales.js: data/locales/*.js
	cat $^ > $@

SPRITE = inkscape --export-area-page --export-png=dist/img/line-presets.png svg/line-presets.svg

dist/img/line-presets.png: svg/line-presets.svg
	if [ `which inkscape` ]; then $(SPRITE); else echo "Inkscape is not installed"; fi;

dist/img/maki-sprite.png: $(wildcard node_modules/maki/renders/*.png)
	node data/maki_sprite

D3_FILES = \
	node_modules/d3/src/start.js \
	node_modules/d3/src/arrays/index.js \
	node_modules/d3/src/behavior/behavior.js \
	node_modules/d3/src/behavior/zoom.js \
	node_modules/d3/src/core/index.js \
	node_modules/d3/src/event/index.js \
	node_modules/d3/src/geo/mercator.js \
	node_modules/d3/src/geo/path.js \
	node_modules/d3/src/geo/stream.js \
	node_modules/d3/src/geom/polygon.js \
	node_modules/d3/src/selection/index.js \
	node_modules/d3/src/transition/index.js \
	node_modules/d3/src/xhr/index.js \
	node_modules/d3/src/end.js

js/lib/d3.v3.js: $(D3_FILES)
	node_modules/.bin/smash $(D3_FILES) > $@
