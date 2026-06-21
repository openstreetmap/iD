import {
    appendThemeTagClasses,
    extractTagKeysFromCss,
    getThemeSecondaryTagKeys,
    sanitizeThemeCss,
    setThemeSecondaryTagKeys
} from '../../../modules/core/themes';

describe('theme tag classes', function() {

    afterEach(function() {
        setThemeSecondaryTagKeys([]);
    });

    describe('extractTagKeysFromCss', function() {
        // [name, css, expected keys (sorted)]
        const cases = [
            ['simple key-value', '.tag-cuisine-pizza { color: red; }', ['cuisine']],
            ['key only', '.tag-piste_type { fill: blue; }', ['piste_type']],
            ['colon key (written with _)', '.tag-public_transport-platform {}', ['public_transport']],
            ['underscore key', '.tag-man_made-pier {}', ['man_made']],
            ['compound selector', '.tag-highway-footway.tag-crossing-marked {}', ['crossing', 'highway']],
            ['value with underscore', '.tag-highway-living_street {}', ['highway']],
            ['mixed : and _ in key', '.tag-piste_type_for_x-downhill {}', ['piste_type_for_x']],
            ['several rules', '.tag-cuisine-pizza{}\n.tag-amenity-cafe{}\n.tag-cuisine{}', ['amenity', 'cuisine']],
            ['synthetic tokens skipped', '.tag-status-abandoned{} .tag-wikidata{} .tag-paved{} .tag-ungraded{}', []],
            ['non-string', null, []],
            ['no tag classes', '.foo .bar { color: red; }', []]
        ];

        cases.forEach(function([name, css, expected]) {
            it(name, function() {
                expect(extractTagKeysFromCss(css).sort()).to.eql(expected);
            });
        });
    });

    describe('appendThemeTagClasses', function() {
        // [name, theme keys, tags, expected appended classes]
        const cases = [
            ['plain key', ['cuisine'], { cuisine: 'pizza' }, ['tag-cuisine', 'tag-cuisine-pizza']],
            ['colon real key matches _ class', ['piste_type'], { 'piste:type': 'downhill' }, ['tag-piste_type', 'tag-piste_type-downhill']],
            ['underscore real key', ['man_made'], { man_made: 'pier' }, ['tag-man_made', 'tag-man_made-pier']],
            ['mixed : and _', ['piste_type_for_x'], { 'piste:type_for_x': 'a' }, ['tag-piste_type_for_x', 'tag-piste_type_for_x-a']],
            ['value no is skipped', ['tunnel'], { tunnel: 'no' }, []],
            ['key absent', ['cuisine'], { amenity: 'cafe' }, []],
            ['no theme keys', [], { cuisine: 'pizza' }, []]
        ];

        cases.forEach(function([name, keys, tags, expected]) {
            it(name, function() {
                setThemeSecondaryTagKeys(keys);
                const classes = [];
                appendThemeTagClasses(classes, tags);
                expect(classes).to.eql(expected);
            });
        });

        it('does not duplicate classes already present', function() {
            setThemeSecondaryTagKeys(['cuisine']);
            const classes = ['tag-cuisine'];
            appendThemeTagClasses(classes, { cuisine: 'pizza' });
            expect(classes).to.eql(['tag-cuisine', 'tag-cuisine-pizza']);
        });
    });

    describe('sanitizeThemeCss', function() {
        // [name, input, expected]
        const cases = [
            ['drops @import (quoted)', '@import "evil.css";.a{color:red}', '.a{color:red}'],
            ['drops @import url()', '@import url(//evil/x);.a{}', '.a{}'],
            ['neutralizes external url', '.a{background:url(http://evil/x)}', '.a{background:none}'],
            ['neutralizes quoted external url', '.a{background:url(\'http://e/x\')}', '.a{background:none}'],
            ['neutralizes protocol-relative url', '.a{background:url(//e/x)}', '.a{background:none}'],
            ['keeps inline data: url', '.a{background:url(data:image/png;base64,AAAA)}', '.a{background:url(data:image/png;base64,AAAA)}'],
            ['leaves plain css untouched', '.a{color:red}', '.a{color:red}'],
            ['non-string returns empty', null, '']
        ];

        cases.forEach(function([name, input, expected]) {
            it(name, function() {
                expect(sanitizeThemeCss(input)).to.equal(expected);
            });
        });
    });

    describe('set/getThemeSecondaryTagKeys', function() {
        it('round-trips and resets', function() {
            setThemeSecondaryTagKeys(['a', 'b', 'a']);
            expect(getThemeSecondaryTagKeys().sort()).to.eql(['a', 'b']);
            setThemeSecondaryTagKeys([]);
            expect(getThemeSecondaryTagKeys()).to.eql([]);
        });
    });
});
