import {
    appendLensTagClasses,
    extractTagKeysFromCss,
    getLensSecondaryTagKeys,
    sanitizeLensCss,
    setLensSecondaryTagKeys
} from '../../../modules/core/lenses';

describe('lens tag classes', function() {

    afterEach(function() {
        setLensSecondaryTagKeys([]);
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

    describe('appendLensTagClasses', function() {
        // [name, lens keys, tags, expected appended classes]
        const cases = [
            ['plain key', ['cuisine'], { cuisine: 'pizza' }, ['tag-cuisine', 'tag-cuisine-pizza']],
            ['colon real key matches _ class', ['piste_type'], { 'piste:type': 'downhill' }, ['tag-piste_type', 'tag-piste_type-downhill']],
            ['underscore real key', ['man_made'], { man_made: 'pier' }, ['tag-man_made', 'tag-man_made-pier']],
            ['mixed : and _', ['piste_type_for_x'], { 'piste:type_for_x': 'a' }, ['tag-piste_type_for_x', 'tag-piste_type_for_x-a']],
            ['value no is skipped', ['tunnel'], { tunnel: 'no' }, []],
            ['key absent', ['cuisine'], { amenity: 'cafe' }, []],
            ['no lens keys', [], { cuisine: 'pizza' }, []]
        ];

        cases.forEach(function([name, keys, tags, expected]) {
            it(name, function() {
                setLensSecondaryTagKeys(keys);
                const classes = [];
                appendLensTagClasses(classes, tags);
                expect(classes).to.eql(expected);
            });
        });

        it('does not duplicate classes already present', function() {
            setLensSecondaryTagKeys(['cuisine']);
            const classes = ['tag-cuisine'];
            appendLensTagClasses(classes, { cuisine: 'pizza' });
            expect(classes).to.eql(['tag-cuisine', 'tag-cuisine-pizza']);
        });
    });

    describe('sanitizeLensCss', function() {
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
                expect(sanitizeLensCss(input)).to.equal(expected);
            });
        });
    });

    describe('set/getLensSecondaryTagKeys', function() {
        it('round-trips and resets', function() {
            setLensSecondaryTagKeys(['a', 'b', 'a']);
            expect(getLensSecondaryTagKeys().sort()).to.eql(['a', 'b']);
            setLensSecondaryTagKeys([]);
            expect(getLensSecondaryTagKeys()).to.eql([]);
        });
    });
});
