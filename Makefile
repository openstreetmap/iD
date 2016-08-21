# See the README for installation instructions.

all: \
	$(BUILDJS_TARGETS) \
	dist/iD.css \
	dist/iD.js \
	dist/iD.min.js \
	dist/img/iD-sprite.svg \
	dist/img/maki-sprite.svg

MAKI_SOURCES = node_modules/maki/src/*.svg

dist/img/maki-sprite.svg: $(MAKI_SOURCES) Makefile
	node_modules/.bin/svg-sprite --symbol --symbol-dest . --symbol-sprite $@ $(MAKI_SOURCES)

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
	dist/imagery.js \

BUILDJS_SOURCES = \
	data/core.yaml

$(BUILDJS_TARGETS): $(BUILDJS_SOURCES) build.js
	node build.js

dist/iD.js: $(BUILDJS_TARGETS)
	./node_modules/.bin/rollup --config=./rollup.config.js --input ./modules/id.js --output dist/iD.js

dist/iD.min.js: dist/iD.js Makefile
	@rm -f $@
	node_modules/.bin/uglifyjs $< -c -m -o $@

dist/iD.css: css/*.css
	cat css/reset.css css/map.css css/app.css > $@

translations:
	node data/update_locales

imagery:
	node data/update_imagery

clean:
	rm -f $(BUILDJS_TARGETS) data/feature-icons.json dist/iD*.js dist/iD.css dist/img/*.svg
