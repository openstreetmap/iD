# See the README for installation instructions.

UGLIFY = ./node_modules/uglify-js/bin/uglifyjs
JS_BEAUTIFIER = $(UGLIFY) -b -i 2 -nm -ns
JS_COMPILER = $(UGLIFY)
LOCALE ?= en_US

all: \
	iD.js \
	iD.min.js

DATA_FILES = $(shell find data -type f -name '*.json' -o -name '*.md')
data/data.js: $(DATA_FILES)
	node build.js

.INTERMEDIATE iD.js: \
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
	js/id/connection.js \
	js/id/services/*.js \
	data/data.js \
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

iD.js: node_modules Makefile
	@rm -f $@
	cat $(filter %.js,$^) > $@

node_modules:
	npm install

%.min.js: %.js Makefile
	@rm -f $@
	$(JS_COMPILER) $< -c -m -o $@

install_root ?= build
install: all
	mkdir -p $(install_root)
	cp iD.js iD.min.js land.html $(install_root)
	cp index_packaged.html $(install_root)/index.html
	cp -R css/. $(install_root)/css
	cp -R img/. $(install_root)/img

clean:
	rm -f iD*.js

translations:
	node data/update_locales
