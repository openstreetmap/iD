describe('iD.util', function() {

    describe('utilGetAllNodes', function() {
        it('gets all descendant nodes of a way', function() {
            var a = new iD.osmNode({ id: 'a' });
            var b = new iD.osmNode({ id: 'b' });
            var w = new iD.osmWay({ id: 'w', nodes: ['a','b','a'] });
            var graph = new iD.coreGraph([a, b, w]);
            var result = iD.utilGetAllNodes(['w'], graph);

            expect(result).to.have.members([a, b]);
            expect(result).toHaveLength(2);
        });

        it('gets all descendant nodes of a relation', function() {
            var a = new iD.osmNode({ id: 'a' });
            var b = new iD.osmNode({ id: 'b' });
            var c = new iD.osmNode({ id: 'c' });
            var w = new iD.osmWay({ id: 'w', nodes: ['a','b','a'] });
            var r = new iD.osmRelation({ id: 'r', members: [{id: 'w'}, {id: 'c'}] });
            var graph = new iD.coreGraph([a, b, c, w, r]);
            var result = iD.utilGetAllNodes(['r'], graph);

            expect(result).to.have.members([a, b, c]);
            expect(result).toHaveLength(3);
        });

        it('gets all descendant nodes of multiple ids', function() {
            var a = new iD.osmNode({ id: 'a' });
            var b = new iD.osmNode({ id: 'b' });
            var c = new iD.osmNode({ id: 'c' });
            var d = new iD.osmNode({ id: 'd' });
            var e = new iD.osmNode({ id: 'e' });
            var w1 = new iD.osmWay({ id: 'w1', nodes: ['a','b','a'] });
            var w2 = new iD.osmWay({ id: 'w2', nodes: ['c','b','a','c'] });
            var r = new iD.osmRelation({ id: 'r', members: [{id: 'w1'}, {id: 'd'}] });
            var graph = new iD.coreGraph([a, b, c, d, e, w1, w2, r]);
            var result = iD.utilGetAllNodes(['r', 'w2', 'e'], graph);

            expect(result).to.have.members([a, b, c, d, e]);
            expect(result).toHaveLength(5);
        });

        it('handles recursive relations', function() {
            var a = new iD.osmNode({ id: 'a' });
            var r1 = new iD.osmRelation({ id: 'r1', members: [{id: 'r2'}] });
            var r2 = new iD.osmRelation({ id: 'r2', members: [{id: 'r1'}, {id: 'a'}] });
            var graph = new iD.coreGraph([a, r1, r2]);
            var result = iD.utilGetAllNodes(['r1'], graph);

            expect(result).to.have.members([a]);
            expect(result).toHaveLength(1);
        });
    });

    it('utilTagDiff', function() {
        var oldTags = { a: 'one', b: 'two', c: 'three' };
        var newTags = { a: 'one', b: 'three', d: 'four' };
        var diff = iD.utilTagDiff(oldTags, newTags);
        expect(diff).to.have.length(4);
        expect(diff[0]).toEqual({
            type: '-', key: 'b', oldVal: 'two', newVal: 'three', display: '- b=two'        // delete-modify
        });
        expect(diff[1]).toEqual({
            type: '+', key: 'b', oldVal: 'two', newVal: 'three', display: '+ b=three'      // insert-modify
        });
        expect(diff[2]).toEqual({
            type: '-', key: 'c', oldVal: 'three', newVal: undefined, display: '- c=three'  // delete
        });
        expect(diff[3]).toEqual({
            type: '+', key: 'd', oldVal: undefined, newVal: 'four', display: '+ d=four'    // insert
        });
    });

    describe('utilCombinedTags', function() {
        it('sorts tag values by frequency then alphabetically', function() {
            var n1 = new iD.osmNode({ id: 'n-1', tags: { surface: 'paved' } });
            var n2 = new iD.osmNode({ id: 'n-2', tags: { surface: 'paved' } });
            var n3 = new iD.osmNode({ id: 'n-3', tags: { surface: 'paved' } });
            var n4 = new iD.osmNode({ id: 'n-4', tags: { surface: 'asphalt' } });
            var n5 = new iD.osmNode({ id: 'n-5', tags: { surface: 'gravel' } });
            var graph = new iD.coreGraph([n1, n2, n3, n4, n5]);
            var result = iD.utilCombinedTags(['n-1', 'n-2', 'n-3', 'n-4', 'n-5'], graph);

            expect(result.surface).toBeInstanceOf(Array);
            expect(result.surface[0]).toEqual('paved');
            expect(result.surface[1]).toEqual('asphalt');
            expect(result.surface[2]).toEqual('gravel');
        });

        it('returns raw value when all entities share the same tag value', function() {
            var n1 = new iD.osmNode({ id: 'n-1', tags: { highway: 'residential' } });
            var n2 = new iD.osmNode({ id: 'n-2', tags: { highway: 'residential' } });
            var graph = new iD.coreGraph([n1, n2]);
            var result = iD.utilCombinedTags(['n-1', 'n-2'], graph);

            expect(result.highway).toEqual('residential');
        });
    });



    it('utilTagText', function() {
        expect(iD.utilTagText({})).toEqual('');
        expect(iD.utilTagText({tags:{foo:'bar'}})).toEqual('foo=bar');
        expect(iD.utilTagText({tags:{foo:'bar',two:'three'}})).toEqual('foo=bar, two=three');
    });

    describe('utilStringQs', function() {
        it('splits a parameter string into k=v pairs', function() {
            expect(iD.utilStringQs('')).toEqual({});
            expect(iD.utilStringQs('foo=bar')).toEqual({foo: 'bar'});
            expect(iD.utilStringQs('foo=bar&one=2')).toEqual({foo: 'bar', one: '2' });
            expect(iD.utilStringQs('foo=bar baz')).toEqual({foo: 'bar baz'});
            expect(iD.utilStringQs('foo=bar+baz')).toEqual({foo: 'bar baz'});
            expect(iD.utilStringQs('foo=bar%20baz')).toEqual({foo: 'bar baz'});
        });
        it('trims leading # if present', function() {
            expect(iD.utilStringQs('#foo=bar')).toEqual({foo: 'bar'});
        });
        it('trims leading ? if present', function() {
            expect(iD.utilStringQs('?foo=bar')).toEqual({foo: 'bar'});
        });
        it('trims leading #? if present', function() {
            expect(iD.utilStringQs('#?foo=bar')).toEqual({foo: 'bar'});
        });
        it('supports both + and %20 for escaping spaces', function() {
            expect(iD.utilStringQs('#?foo=a+b%20c')).toEqual({foo: 'a b c'});
            expect(iD.utilStringQs('#?')).toEqual({});
        });
    });

    it('utilQsString', function() {
        expect(iD.utilQsString({})).toEqual('');
        expect(iD.utilQsString({ foo: 'bar' })).toEqual('foo=bar');
        expect(iD.utilQsString({ foo: 'bar', one: 2 })).toEqual('foo=bar&one=2');
        expect(iD.utilQsString({ foo: 'bar baz' })).toBeOneOf(['foo=bar%20baz', 'foo=bar+baz']);
        expect(iD.utilQsString({ foo: 'bar/baz' })).toEqual('foo=bar%2Fbaz');
        expect(iD.utilQsString({ foo: 'bar/baz' }, true)).toEqual('foo=bar/baz');
    });

    describe('utilEditDistance', function() {
        it('returns zero for same strings', function() {
            expect(iD.utilEditDistance('foo', 'foo')).toEqual(0);
        });

        it('reports an insertion of 1', function() {
            expect(iD.utilEditDistance('foo', 'fooa')).toEqual(1);
        });

        it('reports a replacement of 1', function() {
            expect(iD.utilEditDistance('foob', 'fooa')).toEqual(1);
        });

        it('does not fail on empty input', function() {
            expect(iD.utilEditDistance('', '')).toEqual(0);
        });
    });

    describe('utilAsyncMap', function() {
        it('handles correct replies', function() {
            iD.utilAsyncMap([1, 2, 3],
                function(d, c) { c(null, d * 2); },
                function(err, res) {
                    expect(err).toEqual([null, null, null]);
                    expect(res).toEqual([2, 4, 6]);
                });
        });
        it('handles errors', function() {
            iD.utilAsyncMap([1, 2, 3],
                function(d, c) { c('whoops ' + d, null); },
                function(err, res) {
                    expect(err).toEqual(['whoops 1', 'whoops 2', 'whoops 3']);
                    expect(res).toEqual([null, null, null]);
                });
        });
    });

    describe('utilUnicodeCharsCount', function() {
        it('counts empty string', function() {
            expect(iD.utilUnicodeCharsCount('')).toEqual(0);
        });
        it('counts latin text', function() {
            expect(iD.utilUnicodeCharsCount('Lorem')).toEqual(5);
        });
        it('counts diacritics', function() {
            expect(iD.utilUnicodeCharsCount('Ĺo͂řȩm̅')).toEqual(7);
        });
        it('counts Korean text', function() {
            expect(iD.utilUnicodeCharsCount('뎌쉐')).toEqual(2);
        });
        it('counts Hindi text with combining marks', function() {
            expect(iD.utilUnicodeCharsCount('अनुच्छेद')).toEqual(8);
        });
        it('counts demonic multiple combining marks', function() {
            expect(iD.utilUnicodeCharsCount('Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞')).toEqual(74);
        });
        it('counts emoji', function() {
            // The `Array.from` polyfill may not account for emojis, so
            // be lenient here. Worst case scenario is that IE users might be
            // limited to somewhat fewer characters on tag and role input.
            expect(iD.utilUnicodeCharsCount('😎')).toBeOneOf([1, 2]);
            expect(iD.utilUnicodeCharsCount('🇨🇦')).toBeOneOf([2, 4]);
            expect(iD.utilUnicodeCharsCount('🏳️‍🌈')).toBeOneOf([4, 6]);
            expect(iD.utilUnicodeCharsCount('‍👩‍👩‍👧‍👧')).toBeOneOf([8, 12]);
            expect(iD.utilUnicodeCharsCount('👩‍❤️‍💋‍👩')).toBeOneOf([8, 11]);
            expect(iD.utilUnicodeCharsCount('😎😬😆😵😴😄🙂🤔')).toBeOneOf([8, 16]);
        });
    });

    describe('utilUnicodeCharsTruncated', function() {
        it('truncates empty string', function() {
            expect(iD.utilUnicodeCharsTruncated('', 0)).toEqual('');
            expect(iD.utilUnicodeCharsTruncated('', 255)).toEqual('');
        });
        it('truncates latin text', function() {
            expect(iD.utilUnicodeCharsTruncated('Lorem', 0)).toEqual('');
            expect(iD.utilUnicodeCharsTruncated('Lorem', 3)).toEqual('Lor');
            expect(iD.utilUnicodeCharsTruncated('Lorem', 5)).toEqual('Lorem');
            expect(iD.utilUnicodeCharsTruncated('Lorem', 255)).toEqual('Lorem');
        });
        it('truncates diacritics', function() {
            expect(iD.utilUnicodeCharsTruncated('Ĺo͂řȩm̅', 0)).toEqual('');
            expect(iD.utilUnicodeCharsTruncated('Ĺo͂řȩm̅', 3)).toEqual('Ĺo͂');
            expect(iD.utilUnicodeCharsTruncated('Ĺo͂řȩm̅', 7)).toEqual('Ĺo͂řȩm̅');
            expect(iD.utilUnicodeCharsTruncated('Ĺo͂řȩm̅', 255)).toEqual('Ĺo͂řȩm̅');
        });
        it('truncates Korean text', function() {
            expect(iD.utilUnicodeCharsTruncated('뎌쉐', 0)).toEqual('');
            expect(iD.utilUnicodeCharsTruncated('뎌쉐', 1)).toEqual('뎌');
            expect(iD.utilUnicodeCharsTruncated('뎌쉐', 2)).toEqual('뎌쉐');
            expect(iD.utilUnicodeCharsTruncated('뎌쉐', 255)).toEqual('뎌쉐');
        });
        it('truncates Hindi text with combining marks', function() {
            expect(iD.utilUnicodeCharsTruncated('अनुच्छेद', 0)).toEqual('');
            expect(iD.utilUnicodeCharsTruncated('अनुच्छेद', 3)).toEqual('अनु');
            expect(iD.utilUnicodeCharsTruncated('अनुच्छेद', 8)).toEqual('अनुच्छेद');
            expect(iD.utilUnicodeCharsTruncated('अनुच्छेद', 255)).toEqual('अनुच्छेद');
        });
        it('truncates demonic multiple combining marks', function() {
            expect(iD.utilUnicodeCharsTruncated('Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞', 0)).toEqual('');
            expect(iD.utilUnicodeCharsTruncated('Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖', 59)).toEqual('Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖');
            expect(iD.utilUnicodeCharsTruncated('Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞', 74)).toEqual('Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞');
            expect(iD.utilUnicodeCharsTruncated('Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞', 255)).toEqual('Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞');
        });
        it('truncates emoji', function() {
            expect(iD.utilUnicodeCharsTruncated('😎', 0)).toEqual('');
            expect(iD.utilUnicodeCharsTruncated('😎', 1)).toBeOneOf(['😎', '\ud83d']);
            expect(iD.utilUnicodeCharsTruncated('🇨🇦', 1)).toBeOneOf(['🇨', '\ud83c']);
            expect(iD.utilUnicodeCharsTruncated('🏳️‍🌈', 2)).toBeOneOf(['🏳️', '\ud83c\udff3']);
            expect(iD.utilUnicodeCharsTruncated('‍👩‍👩‍👧‍👧', 4)).toBeOneOf(['‍👩‍👩', '‍👩‍']);
            expect(iD.utilUnicodeCharsTruncated('👩‍❤️‍💋‍👩', 6)).toBeOneOf(['👩‍❤️‍💋', '👩‍❤️‍']);
            expect(iD.utilUnicodeCharsTruncated('😎😬😆😵😴😄🙂🤔', 0)).toEqual('');
            expect(iD.utilUnicodeCharsTruncated('😎😬😆😵😴😄🙂🤔', 4)).toBeOneOf(['😎😬😆😵', '😎😬']);
            expect(iD.utilUnicodeCharsTruncated('😎😬😆😵😴😄🙂🤔', 8)).toBeOneOf(['😎😬😆😵😴😄🙂🤔', '😎😬😆😵']);
            expect(iD.utilUnicodeCharsTruncated('😎😬😆😵😴😄🙂🤔', 16)).toEqual('😎😬😆😵😴😄🙂🤔');
            expect(iD.utilUnicodeCharsTruncated('😎😬😆😵😴😄🙂🤔', 255)).toEqual('😎😬😆😵😴😄🙂🤔');
        });
    });

    describe('utilCompareIDs', function() {
        it('sorts existing IDs numerically in ascending order', function() {
            expect(iD.utilCompareIDs('w100', 'w200')).toEqual(-1);
            expect(iD.utilCompareIDs('w100', 'w50')).toEqual(1);
            expect(iD.utilCompareIDs('w100', 'w100')).toEqual(0);
        });
        it('sorts new IDs numerically in descending order', function() {
            expect(iD.utilCompareIDs('w-100', 'w-200')).toEqual(-1);
            expect(iD.utilCompareIDs('w-100', 'w-50')).toEqual(1);
            expect(iD.utilCompareIDs('w-100', 'w-100')).toEqual(0);
        });
        it('sorts existing IDs before new IDs', function() {
            expect(iD.utilCompareIDs('w-1', 'w1')).toEqual(1);
            expect(iD.utilCompareIDs('w1', 'w-1')).toEqual(-1);
            expect(iD.utilCompareIDs('w-100', 'w1')).toEqual(1);
            expect(iD.utilCompareIDs('w100', 'w-1')).toEqual(-1);
            expect(iD.utilCompareIDs('w-1', 'w100')).toEqual(1);
            expect(iD.utilCompareIDs('w1', 'w-100')).toEqual(-1);
        });
        it('sorts existing and new IDs before anything else', function() {
            expect(iD.utilCompareIDs('w1', 'asdf')).toEqual(-1);
            expect(iD.utilCompareIDs('asdf', 'w1')).toEqual(1);
            expect(iD.utilCompareIDs('w-1', 'asdf')).toEqual(-1);
            expect(iD.utilCompareIDs('asdf', 'w-1')).toEqual(1);
        });
        it('returns -1 for other strings', function() {
            expect(iD.utilCompareIDs('aaa', 'b')).toEqual(-1);
            expect(iD.utilCompareIDs('b', 'aaa')).toEqual(-1);
            expect(iD.utilCompareIDs('a', 'a')).toEqual(-1);
        });
    });

    describe('utilDisplayName', function() {
        it('returns the name if tagged with a name', function() {
            expect(iD.utilDisplayName({tags: {name: 'East Coast Greenway'}})).toEqual('East Coast Greenway');
        });
        it('returns just the name for non-routes', function() {
            expect(iD.utilDisplayName({tags: { name: 'Abyssinian Room', ref: '260-115' }})).toEqual('Abyssinian Room');
        });
        it('returns just the name for route with PTv2-formatted names', function() {
            expect(iD.utilDisplayName({tags: { name: 'NORTA 2: French Market → Canal at Bourbon', network: 'NORTA', ref: '2', from: 'French Market', to: 'Canal at Bourbon'}})).toEqual('NORTA 2: French Market → Canal at Bourbon');
            expect(iD.utilDisplayName({tags: { name: 'VTA 64A: McKee & White => San Jose Diridon => Ohlone/Chynoweth', network: 'VTA', ref: '64A', from: 'McKee & White', to: 'Ohlone/Chynoweth', via: 'San Jose Diridon'}})).toEqual('VTA 64A: McKee & White => San Jose Diridon => Ohlone/Chynoweth');
            expect(iD.utilDisplayName({tags: { name: 'Bus 224: Downtown Garland Station -> Lake Ray Hubbard TC -> Downtown Dallas', route: 'bus', ref: '224', from: 'Downtown Garland Station', to: 'Downtown Dallas', via: 'Lake Ray Hubbard TC'}})).toEqual('Bus 224: Downtown Garland Station -> Lake Ray Hubbard TC -> Downtown Dallas');
        });
        it('suppresses the network tag if the hideNetwork argument is true', function() {
            expect(iD.utilDisplayName({tags: { name: 'Lynfield Express', ref: '25L', network: 'AT', route: 'bus' }}, { hideNetwork: true })).toEqual('25L: Lynfield Express');
            expect(iD.utilDisplayName({tags: { network: 'SORTA', ref: '3X' }}, { hideNetwork: true })).toEqual('3X');
            expect(iD.utilDisplayName({tags: { name: 'Dallas North Tollway', network: 'US:TX:NTTA', route: 'road' }}, { hideNetwork: true })).toEqual('Dallas North Tollway');
        });
        it('suppresses the ref tag if the hideRef argument is true', function() {
            expect(iD.utilDisplayName({tags: { name: 'Lynfield Express', ref: '25L', network: 'AT', route: 'bus' }}, { hideRef: true })).toEqual('AT Lynfield Express');
            expect(iD.utilDisplayName({tags: { network: 'SORTA', ref: '3X' }}, { hideRef: true })).toEqual('SORTA');
            expect(iD.utilDisplayName({tags: { name: 'Dallas North Tollway', network: 'US:TX:NTTA', route: 'road' }}, { hideRef: true })).toEqual('US:TX:NTTA Dallas North Tollway');
        });
        it('distinguishes unnamed features by ref', function() {
            expect(iD.utilDisplayName({tags: {ref: '66'}})).toEqual('66');
        });
        it('distinguishes unnamed features by network or cycle_network', function() {
            expect(iD.utilDisplayName({tags: {network: 'SORTA', ref: '3X'}})).toEqual('SORTA 3X');
            expect(iD.utilDisplayName({tags: {network: 'ncn', cycle_network: 'US:US', ref: '76'}})).toEqual('US:US 76');
        });
        it('distinguishes unnamed routes by direction', function() {
            expect(iD.utilDisplayName({tags: {network: 'US:US', ref: '66', direction: 'west', route: 'road'}})).toEqual('US:US 66 west');
            // Marguerite X: Counter-Clockwise
            expect(iD.utilDisplayName({tags: {network: 'Marguerite', ref: 'X', direction: 'anticlockwise', route: 'bus'}})).toEqual('Marguerite X anticlockwise');
        });
        it('distinguishes unnamed routes by waypoints', function() {
            expect(iD.utilDisplayName({tags: {network: 'SORTA', ref: '3X', from: 'Downtown', route: 'bus'}})).toEqual('SORTA 3X');
            expect(iD.utilDisplayName({tags: {network: 'SORTA', ref: '3X', to: 'Kings Island', route: 'bus'}})).toEqual('SORTA 3X');
            expect(iD.utilDisplayName({tags: {network: 'SORTA', ref: '3X', via: 'Montgomery', route: 'bus'}})).toEqual('SORTA 3X');
            // Green Line: Old Ironsides => Winchester
            expect(iD.utilDisplayName({tags: {network: 'VTA', ref: 'Green', from: 'Old Ironsides', to: 'Winchester', route: 'bus'}})).toEqual('VTA Green from Old Ironsides to Winchester');
            // BART Yellow Line: Antioch => Pittsburg/Bay Point => SFO Airport => Millbrae
            expect(iD.utilDisplayName({tags: {network: 'BART', ref: 'Yellow', from: 'Antioch', to: 'Millbrae', via: 'Pittsburg/Bay Point;San Francisco International Airport', route: 'subway'}})).toEqual('BART Yellow from Antioch to Millbrae via Pittsburg/Bay Point;San Francisco International Airport');
        });
        it('can use alternative name tags', () => {
            expect(iD.utilDisplayName({ tags: { loc_ref: 'A' } })).toEqual('A');
            expect(iD.utilDisplayName({ tags: { 'seamark:name': 'Bean Rock' } })).toEqual('Bean Rock');

            expect(iD.utilDisplayName({ tags: { highway: 'milestone', distance: '12' } })).toEqual('12');
            expect(iD.utilDisplayName({ tags: { distance: '12' } })).toEqual(''); // `distance` is not used as a name on other features

            expect(iD.utilDisplayName({ tags: { railway: 'milestone', 'railway:position': '12' } })).toEqual('12');
            expect(iD.utilDisplayName({ tags: { 'railway:position': '12' } })).toEqual(''); // `railway:position` is not used as a name on other features
        });
        it('prefers standard tags over alternative names', () => {
            expect(iD.utilDisplayName({ tags: { name: '1', official_name: '2' } })).toEqual('1');
            expect(iD.utilDisplayName({ tags: { ref: '1', loc_ref: '2' } })).toEqual('1');
            expect(iD.utilDisplayName({ tags: { ref: '1', network: 'AT', loc_ref: '2' } })).toEqual('AT 1');
        });
        it('distinguishes named features by name', function() {
            expect(iD.utilDisplayName({tags: { name: 'Ohio Turnpike', route: 'road' }})).toEqual('Ohio Turnpike');
            expect(iD.utilDisplayName({tags: { name: 'Lynfield Express', ref: '25L', route: 'bus' }})).toEqual('25L: Lynfield Express');
            expect(iD.utilDisplayName({tags: { name: 'Kāpiti Expressway', ref: 'SH1', route: 'road' }})).toEqual('SH1: Kāpiti Expressway');
            expect(iD.utilDisplayName({tags: { name: 'Lynfield Express', ref: '25L', network: 'AT', route: 'bus' }})).toEqual('AT 25L: Lynfield Express');
        });
        it('distinguishes named features by network or cycle_network', function() {
            expect(iD.utilDisplayName({tags: { name: 'Dallas North Tollway', network: 'US:TX:NTTA', route: 'road' }})).toEqual('US:TX:NTTA Dallas North Tollway');
        });
        it('distinguishes named features by ref', function() {
            expect(iD.utilDisplayName({tags: { name: 'Dallas North Tollway', network: 'US:TX:NTTA', ref: 'DNT', route: 'road' }})).toEqual('US:TX:NTTA DNT: Dallas North Tollway');
        });
        it('distinguishes named features by direction', function() {
            expect(iD.utilDisplayName({tags: { name: 'Dallas North Tollway', network: 'US:TX:NTTA', direction: 'south', route: 'road' }})).toEqual('US:TX:NTTA Dallas North Tollway south');
        });
        it('distinguishes named features by waypoints', function() {
            expect(iD.utilDisplayName({tags: { name: 'Kings Island Express', network: 'SORTA', ref: '71X', from: 'Sycamore & Court', to: 'Fields Ertel & Royal Point', route: 'bus' }})).toEqual('SORTA 71X: Kings Island Express from Sycamore & Court to Fields Ertel & Royal Point');
            expect(iD.utilDisplayName({tags: { name: 'Local', network: 'Caltrain', from: 'San Francisco', to: 'Tamien', via: 'College Park', route: 'train' }})).toEqual('Caltrain Local from San Francisco to Tamien via College Park');
        });
        it('uses addr:housename', () => {
            expect(iD.utilDisplayName({ tags: { 'addr:housename': 'Siglap House' } })).toEqual('Siglap House');
        });
        it('uses the street address (addr:street) as a last resort', () => {
            expect(iD.utilDisplayName({ tags: { 'addr:housenumber': '31', 'addr:street': 'Princes Street' } })).toEqual('31 Princes Street');
        });
        it('uses the street address (addr:place) as a last resort', () => {
            expect(iD.utilDisplayName({ tags: { 'addr:housenumber': '1', 'addr:place': 'Motutapu Island' } })).toEqual('1 Motutapu Island');
        });
        it('uses addr:unit if present', () => {
            expect(iD.utilDisplayName({ tags: { 'addr:unit': 'Flat 1', 'addr:housenumber': '30', 'addr:street': 'Madden Street' } })).toEqual('Flat 1, 30 Madden Street');
        });
        it('uses just addr:housenumber if it is the only addr: tag present', () => {
            expect(iD.utilDisplayName({ tags: { 'addr:housenumber': '32' } })).toEqual('32');
        });
        it('uses only the housenumber for map labels', () => {
            expect(iD.utilDisplayName({ tags: { 'addr:housenumber': '31', 'addr:street': 'Princes Street' } }, { isMapLabel: true })).toEqual('31');
        });
    });

    describe('utilOldestID', function() {
        it('returns the oldest database ID', function() {
            expect(iD.utilOldestID(['w3', 'w1', 'w2'])).toEqual('w1');
        });
        it('returns the oldest editor ID', function() {
            expect(iD.utilOldestID(['w-3', 'w-2', 'w-1'])).toEqual('w-1');
        });
        it('returns the oldest IDs among database and editor IDs', function() {
            expect(iD.utilOldestID(['w-1', 'w1', 'w-2'])).toEqual('w1');
            expect(iD.utilOldestID(['w100', 'w-1', 'a', 'w-300', 'w2'])).toEqual('w2');
        });
        it('returns the oldest editor ID if no database IDs', function() {
            expect(iD.utilOldestID(['w-100', 'w-1', 'a', 'w-300', 'w-2'])).toEqual('w-1');
        });
        it('returns the first ID in the list otherwise', function() {
            expect(iD.utilOldestID(['z', 'a', 'A', 'Z'])).toEqual('z');
        });
    });
});
