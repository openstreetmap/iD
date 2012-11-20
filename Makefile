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
	js/lib/lodash.js \
	js/lib/ohauth.js \
	js/lib/sha.js \
	js/lib/jxon.js \
	js/lib/lodash.js \
	js/iD/id.js \
	js/iD/Connection.js \
	js/iD/Util.js \
	js/iD/actions/*.js \
	js/iD/graph/*.js \
	js/iD/renderer/*.js \
	js/iD/ui/*.js \

iD.js: Makefile
	@rm -f $@
	cat $(filter %.js,$^) | $(JS_BEAUTIFIER) > $@
	@chmod a-w $@

%.min.js: %.js Makefile
	@rm -f $@
	$(JS_COMPILER) < $< > $@

clean:
	rm -f iD*.js
