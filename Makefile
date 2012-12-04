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
	js/lib/d3.v3.js \
	js/lib/d3.geo.tile.js \
	js/lib/d3.one.js \
	js/lib/d3.size.js \
	js/lib/d3.typeahead.js \
	js/lib/jxon.js \
	js/lib/lodash.js \
	js/lib/ohauth.js \
	js/lib/sha.js \
	js/id/id.js \
	js/id/connection.js \
	js/id/oauth.js \
	js/id/taginfo.js \
	js/id/util.js \
	js/id/actions/*.js \
	js/id/controller/*.js \
	js/id/format/*.js \
	js/id/graph/*.js \
	js/id/renderer/*.js \
	js/id/ui/*.js \

iD.js: Makefile
	@rm -f $@
	cat $(filter %.js,$^) | $(JS_BEAUTIFIER) > $@
	@chmod a-w $@

%.min.js: %.js Makefile
	@rm -f $@
	$(JS_COMPILER) < $< > $@

clean:
	rm -f iD*.js
