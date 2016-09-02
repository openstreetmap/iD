all: \
	dist/iD.css \
	dist/img/iD-sprite.svg \
	dist/img/maki-sprite.svg

MAKI_SOURCES = node_modules/maki/src/*.svg

dist/img/maki-sprite.svg: $(MAKI_SOURCES) Makefile
	node_modules/.bin/svg-sprite --symbol --symbol-dest . --symbol-sprite $@ $(MAKI_SOURCES)

dist/img/iD-sprite.svg: svg/iD-sprite.src.svg svg/iD-sprite.json
	node svg/spriteify.js --svg svg/iD-sprite.src.svg --json svg/iD-sprite.json > $@

dist/iD.css: css/*.css
	cat css/reset.css css/map.css css/app.css > $@

translations:
	node data/update_locales

imagery:
	node data/update_imagery

clean:
	rm -f dist/*.js dist/*.map dist/*.css dist/img/*.svg
