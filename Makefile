# See the README for installation instructions.

NODE_PATH ?= ./node_modules
UGLIFY = $(NODE_PATH)/uglify-js/bin/uglifyjs
JS_BEAUTIFIER = $(UGLIFY) -b -i 2 -nm -ns
JS_COMPILER = $(UGLIFY)
LOCALE ?= en_US

all: \
	iD.js \
	iD.min.js

PRESET_FILES = $(shell find data/presets/presets -type f -name '*.json')

data/presets/presets.json: $(PRESET_FILES)
	cd data/presets && node build

# TODO: write a nice node script for this
data/data.js: \
	data/deprecated.json \
	data/discarded.json \
	data/imagery.json \
	data/keys.json
	node data/make.js

.INTERMEDIATE iD.js: \
	js/lib/bootstrap-tooltip.js \
	js/lib/d3.v3.js \
	js/lib/d3.checkselect.js \
	js/lib/d3.combobox.js \
	js/lib/d3.geo.tile.js \
	js/lib/d3.keybinding.js \
	js/lib/d3.one.js \
	js/lib/d3.rowselect.js \
	js/lib/d3.size.js \
	js/lib/d3.trigger.js \
	js/lib/d3.typeahead.js \
	js/lib/jxon.js \
	js/lib/lodash.js \
	js/lib/ohauth.js \
	js/lib/rtree.js \
	js/lib/sha.js \
	js/id/start.js \
	js/id/id.js \
	js/id/connection.js \
	js/id/oauth.js \
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
	js/id/presets.js \
	js/id/presets/*.js \
	js/id/validate.js \
	js/id/end.js \
	js/lib/locale.js \
	locale/*.js

iD.js: Makefile
	@rm -f $@
	cat $(filter %.js,$^) > $@

%.min.js: %.js Makefile
	@rm -f $@
	$(JS_COMPILER) $< -c -m -o $@

clean:
	rm -f iD*.js
