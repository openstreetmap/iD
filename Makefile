# See the README for installation instructions.

NODE_PATH ?= ./node_modules
# JS_COMPILER = $(NODE_PATH)/uglify-js/bin/uglifyjs
JS_BEAUTIFIER = uglifyjs -b -i 2 -nm -ns
JS_COMPILER = uglifyjs
LOCALE ?= en_US

all: \
	iD.js \
	iD.min.js

.INTERMEDIATE iD.js: \
	js/lib/bootstrap-tooltip.js \
	js/lib/d3.v3.js \
	js/lib/d3.geo.tile.js \
	js/lib/d3.keybinding.js \
	js/lib/d3.one.js \
	js/lib/d3.size.js \
	js/lib/d3.trigger.js \
	js/lib/d3.typeahead.js \
	js/lib/jxon.js \
	js/lib/lodash.js \
	js/lib/ohauth.js \
	js/lib/sha.js \
	js/id/start.js \
	js/id/id.js \
	js/id/connection.js \
	js/id/oauth.js \
	js/id/services/*.js \
	js/id/util.js \
	js/id/actions.js \
	js/id/actions/*.js \
	js/id/behavior.js \
	js/id/behavior/*.js \
	js/id/modes.js \
	js/id/modes/*.js \
	js/id/controller/*.js \
	js/id/format/*.js \
	js/id/graph/*.js \
	js/id/renderer/*.js \
	js/id/svg.js \
	js/id/svg/*.js \
	js/id/ui.js \
	js/id/ui/*.js \
	js/id/end.js

iD.js: Makefile
	@rm -f $@
	cat $(filter %.js,$^) > $@

%.min.js: %.js Makefile
	@rm -f $@
	$(JS_COMPILER) $< -o $@

clean:
	rm -f iD*.js
