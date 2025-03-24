describe('iD.util', function() {

    describe('utilGetAllNodes', function() {
        it('gets all descendant nodes of a way', function() {
            var a = new iD.osmNode({ id: 'a' });
            var b = new iD.osmNode({ id: 'b' });
            var w = new iD.osmWay({ id: 'w', nodes: ['a','b','a'] });
            var graph = new iD.coreGraph([a, b, w]);
            var result = iD.utilGetAllNodes(['w'], graph);

            expect(result).to.have.members([a, b]);
            expect(result).to.have.lengthOf(2);
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
            expect(result).to.have.lengthOf(3);
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
            expect(result).to.have.lengthOf(5);
        });

        it('handles recursive relations', function() {
            var a = new iD.osmNode({ id: 'a' });
            var r1 = new iD.osmRelation({ id: 'r1', members: [{id: 'r2'}] });
            var r2 = new iD.osmRelation({ id: 'r2', members: [{id: 'r1'}, {id: 'a'}] });
            var graph = new iD.coreGraph([a, r1, r2]);
            var result = iD.utilGetAllNodes(['r1'], graph);

            expect(result).to.have.members([a]);
            expect(result).to.have.lengthOf(1);
        });
    });

    it('utilTagDiff', function() {
        var oldTags = { a: 'one', b: 'two', c: 'three' };
        var newTags = { a: 'one', b: 'three', d: 'four' };
        var diff = iD.utilTagDiff(oldTags, newTags);
        expect(diff).to.have.length(4);
        expect(diff[0]).to.eql({
            type: '-', key: 'b', oldVal: 'two', newVal: 'three', display: '- b=two'        // delete-modify
        });
        expect(diff[1]).to.eql({
            type: '+', key: 'b', oldVal: 'two', newVal: 'three', display: '+ b=three'      // insert-modify
        });
        expect(diff[2]).to.eql({
            type: '-', key: 'c', oldVal: 'three', newVal: undefined, display: '- c=three'  // delete
        });
        expect(diff[3]).to.eql({
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

            expect(result.surface).to.be.an('array');
            expect(result.surface[0]).to.eql('paved');
            expect(result.surface[1]).to.eql('asphalt');
            expect(result.surface[2]).to.eql('gravel');
        });

        it('returns raw value when all entities share the same tag value', function() {
            var n1 = new iD.osmNode({ id: 'n-1', tags: { highway: 'residential' } });
            var n2 = new iD.osmNode({ id: 'n-2', tags: { highway: 'residential' } });
            var graph = new iD.coreGraph([n1, n2]);
            var result = iD.utilCombinedTags(['n-1', 'n-2'], graph);

            expect(result.highway).to.eql('residential');
        });
    });



    it('utilTagText', function() {
        expect(iD.utilTagText({})).to.eql('');
        expect(iD.utilTagText({tags:{foo:'bar'}})).to.eql('foo=bar');
        expect(iD.utilTagText({tags:{foo:'bar',two:'three'}})).to.eql('foo=bar, two=three');
    });

    describe('utilStringQs', function() {
        it('splits a parameter string into k=v pairs', function() {
            expect(iD.utilStringQs('')).to.eql({});
            expect(iD.utilStringQs('foo=bar')).to.eql({foo: 'bar'});
            expect(iD.utilStringQs('foo=bar&one=2')).to.eql({foo: 'bar', one: '2' });
            expect(iD.utilStringQs('foo=bar baz')).to.eql({foo: 'bar baz'});
            expect(iD.utilStringQs('foo=bar+baz')).to.eql({foo: 'bar baz'});
            expect(iD.utilStringQs('foo=bar%20baz')).to.eql({foo: 'bar baz'});
        });
        it('trims leading # if present', function() {
            expect(iD.utilStringQs('#foo=bar')).to.eql({foo: 'bar'});
        });
        it('trims leading ? if present', function() {
            expect(iD.utilStringQs('?foo=bar')).to.eql({foo: 'bar'});
        });
        it('trims leading #? if present', function() {
            expect(iD.utilStringQs('#?foo=bar')).to.eql({foo: 'bar'});
        });
        it('supports both + and %20 for escaping spaces', function() {
            expect(iD.utilStringQs('#?foo=a+b%20c')).to.eql({foo: 'a b c'});
            expect(iD.utilStringQs('#?')).to.eql({});
        });
    });

    it('utilQsString', function() {
        expect(iD.utilQsString({})).to.eql('');
        expect(iD.utilQsString({ foo: 'bar' })).to.eql('foo=bar');
        expect(iD.utilQsString({ foo: 'bar', one: 2 })).to.eql('foo=bar&one=2');
        expect(iD.utilQsString({ foo: 'bar baz' })).to.be.oneOf(['foo=bar%20baz', 'foo=bar+baz']);
        expect(iD.utilQsString({ foo: 'bar/baz' })).to.eql('foo=bar%2Fbaz');
        expect(iD.utilQsString({ foo: 'bar/baz' }, true)).to.eql('foo=bar/baz');
    });

    describe('utilEditDistance', function() {
        it('returns zero for same strings', function() {
            expect(iD.utilEditDistance('foo', 'foo')).to.eql(0);
        });

        it('reports an insertion of 1', function() {
            expect(iD.utilEditDistance('foo', 'fooa')).to.eql(1);
        });

        it('reports a replacement of 1', function() {
            expect(iD.utilEditDistance('foob', 'fooa')).to.eql(1);
        });

        it('does not fail on empty input', function() {
            expect(iD.utilEditDistance('', '')).to.eql(0);
        });
    });

    describe('utilUnicodeCharsCount', function() {
        it('counts empty string', function() {
            expect(iD.utilUnicodeCharsCount('')).to.eql(0);
        });
        it('counts latin text', function() {
            expect(iD.utilUnicodeCharsCount('Lorem')).to.eql(5);
        });
        it('counts diacritics', function() {
            expect(iD.utilUnicodeCharsCount('Ĺo͂řȩm̅')).to.eql(7);
        });
        it('counts Korean text', function() {
            expect(iD.utilUnicodeCharsCount('뎌쉐')).to.eql(2);
        });
        it('counts Hindi text with combining marks', function() {
            expect(iD.utilUnicodeCharsCount('अनुच्छेद')).to.eql(8);
        });
        it('counts demonic multiple combining marks', function() {
            expect(iD.utilUnicodeCharsCount('Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞')).to.eql(74);
        });
        it('counts emoji', function() {
            // The `Array.from` polyfill may not account for emojis, so
            // be lenient here. Worst case scenario is that IE users might be
            // limited to somewhat fewer characters on tag and role input.
            expect(iD.utilUnicodeCharsCount('😎')).to.be.oneOf([1, 2]);
            expect(iD.utilUnicodeCharsCount('🇨🇦')).to.be.oneOf([2, 4]);
            expect(iD.utilUnicodeCharsCount('🏳️‍🌈')).to.be.oneOf([4, 6]);
            expect(iD.utilUnicodeCharsCount('‍👩‍👩‍👧‍👧')).to.be.oneOf([8, 12]);
            expect(iD.utilUnicodeCharsCount('👩‍❤️‍💋‍👩')).to.be.oneOf([8, 11]);
            expect(iD.utilUnicodeCharsCount('😎😬😆😵😴😄🙂🤔')).to.be.oneOf([8, 16]);
        });
    });

    describe('utilUnicodeCharsTruncated', function() {
        it('truncates empty string', function() {
            expect(iD.utilUnicodeCharsTruncated('', 0)).to.eql('');
            expect(iD.utilUnicodeCharsTruncated('', 255)).to.eql('');
        });
        it('truncates latin text', function() {
            expect(iD.utilUnicodeCharsTruncated('Lorem', 0)).to.eql('');
            expect(iD.utilUnicodeCharsTruncated('Lorem', 3)).to.eql('Lor');
            expect(iD.utilUnicodeCharsTruncated('Lorem', 5)).to.eql('Lorem');
            expect(iD.utilUnicodeCharsTruncated('Lorem', 255)).to.eql('Lorem');
        });
        it('truncates diacritics', function() {
            expect(iD.utilUnicodeCharsTruncated('Ĺo͂řȩm̅', 0)).to.eql('');
            expect(iD.utilUnicodeCharsTruncated('Ĺo͂řȩm̅', 3)).to.eql('Ĺo͂');
            expect(iD.utilUnicodeCharsTruncated('Ĺo͂řȩm̅', 7)).to.eql('Ĺo͂řȩm̅');
            expect(iD.utilUnicodeCharsTruncated('Ĺo͂řȩm̅', 255)).to.eql('Ĺo͂řȩm̅');
        });
        it('truncates Korean text', function() {
            expect(iD.utilUnicodeCharsTruncated('뎌쉐', 0)).to.eql('');
            expect(iD.utilUnicodeCharsTruncated('뎌쉐', 1)).to.eql('뎌');
            expect(iD.utilUnicodeCharsTruncated('뎌쉐', 2)).to.eql('뎌쉐');
            expect(iD.utilUnicodeCharsTruncated('뎌쉐', 255)).to.eql('뎌쉐');
        });
        it('truncates Hindi text with combining marks', function() {
            expect(iD.utilUnicodeCharsTruncated('अनुच्छेद', 0)).to.eql('');
            expect(iD.utilUnicodeCharsTruncated('अनुच्छेद', 3)).to.eql('अनु');
            expect(iD.utilUnicodeCharsTruncated('अनुच्छेद', 8)).to.eql('अनुच्छेद');
            expect(iD.utilUnicodeCharsTruncated('अनुच्छेद', 255)).to.eql('अनुच्छेद');
        });
        it('truncates demonic multiple combining marks', function() {
            expect(iD.utilUnicodeCharsTruncated('Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞', 0)).to.eql('');
            expect(iD.utilUnicodeCharsTruncated('Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖', 59)).to.eql('Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖');
            expect(iD.utilUnicodeCharsTruncated('Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞', 74)).to.eql('Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞');
            expect(iD.utilUnicodeCharsTruncated('Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞', 255)).to.eql('Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘!͖̬̰̙̗̿̋ͥͥ̂ͣ̐́́͜͞');
        });
        it('truncates emoji', function() {
            expect(iD.utilUnicodeCharsTruncated('😎', 0)).to.eql('');
            expect(iD.utilUnicodeCharsTruncated('😎', 1)).to.be.oneOf(['😎', '\ud83d']);
            expect(iD.utilUnicodeCharsTruncated('🇨🇦', 1)).to.be.oneOf(['🇨', '\ud83c']);
            expect(iD.utilUnicodeCharsTruncated('🏳️‍🌈', 2)).to.be.oneOf(['🏳️', '\ud83c\udff3']);
            expect(iD.utilUnicodeCharsTruncated('‍👩‍👩‍👧‍👧', 4)).to.be.oneOf(['‍👩‍👩', '‍👩‍']);
            expect(iD.utilUnicodeCharsTruncated('👩‍❤️‍💋‍👩', 6)).to.be.oneOf(['👩‍❤️‍💋', '👩‍❤️‍']);
            expect(iD.utilUnicodeCharsTruncated('😎😬😆😵😴😄🙂🤔', 0)).to.eql('');
            expect(iD.utilUnicodeCharsTruncated('😎😬😆😵😴😄🙂🤔', 4)).to.be.oneOf(['😎😬😆😵', '😎😬']);
            expect(iD.utilUnicodeCharsTruncated('😎😬😆😵😴😄🙂🤔', 8)).to.be.oneOf(['😎😬😆😵😴😄🙂🤔', '😎😬😆😵']);
            expect(iD.utilUnicodeCharsTruncated('😎😬😆😵😴😄🙂🤔', 16)).to.eql('😎😬😆😵😴😄🙂🤔');
            expect(iD.utilUnicodeCharsTruncated('😎😬😆😵😴😄🙂🤔', 255)).to.eql('😎😬😆😵😴😄🙂🤔');
        });
    });

    describe('utilCompareIDs', function() {
        it('sorts existing IDs numerically in ascending order', function() {
            expect(iD.utilCompareIDs('w100', 'w200')).to.eql(-1);
            expect(iD.utilCompareIDs('w100', 'w50')).to.eql(1);
            expect(iD.utilCompareIDs('w100', 'w100')).to.eql(0);
        });
        it('sorts new IDs numerically in descending order', function() {
            expect(iD.utilCompareIDs('w-100', 'w-200')).to.eql(-1);
            expect(iD.utilCompareIDs('w-100', 'w-50')).to.eql(1);
            expect(iD.utilCompareIDs('w-100', 'w-100')).to.eql(0);
        });
        it('sorts existing IDs before new IDs', function() {
            expect(iD.utilCompareIDs('w-1', 'w1')).to.eql(1);
            expect(iD.utilCompareIDs('w1', 'w-1')).to.eql(-1);
            expect(iD.utilCompareIDs('w-100', 'w1')).to.eql(1);
            expect(iD.utilCompareIDs('w100', 'w-1')).to.eql(-1);
            expect(iD.utilCompareIDs('w-1', 'w100')).to.eql(1);
            expect(iD.utilCompareIDs('w1', 'w-100')).to.eql(-1);
        });
        it('sorts existing and new IDs before anything else', function() {
            expect(iD.utilCompareIDs('w1', 'asdf')).to.eql(-1);
            expect(iD.utilCompareIDs('asdf', 'w1')).to.eql(1);
            expect(iD.utilCompareIDs('w-1', 'asdf')).to.eql(-1);
            expect(iD.utilCompareIDs('asdf', 'w-1')).to.eql(1);
        });
        it('returns -1 for other strings', function() {
            expect(iD.utilCompareIDs('aaa', 'b')).to.eql(-1);
            expect(iD.utilCompareIDs('b', 'aaa')).to.eql(-1);
            expect(iD.utilCompareIDs('a', 'a')).to.eql(-1);
        });
    });

    describe('utilDisplayName', function() {
        it('returns the name if tagged with a name', function() {
            expect(iD.utilDisplayName({tags: {name: 'East Coast Greenway'}})).to.eql('East Coast Greenway');
        });
        it('returns just the name for non-routes', function() {
            expect(iD.utilDisplayName({tags: { name: 'Abyssinian Room', ref: '260-115' }})).to.eql('Abyssinian Room');
        });
        it('returns just the name for route with PTv2-formatted names', function() {
            expect(iD.utilDisplayName({tags: { name: 'NORTA 2: French Market → Canal at Bourbon', network: 'NORTA', ref: '2', from: 'French Market', to: 'Canal at Bourbon'}})).to.eql('NORTA 2: French Market → Canal at Bourbon');
            expect(iD.utilDisplayName({tags: { name: 'VTA 64A: McKee & White => San Jose Diridon => Ohlone/Chynoweth', network: 'VTA', ref: '64A', from: 'McKee & White', to: 'Ohlone/Chynoweth', via: 'San Jose Diridon'}})).to.eql('VTA 64A: McKee & White => San Jose Diridon => Ohlone/Chynoweth');
            expect(iD.utilDisplayName({tags: { name: 'Bus 224: Downtown Garland Station -> Lake Ray Hubbard TC -> Downtown Dallas', route: 'bus', ref: '224', from: 'Downtown Garland Station', to: 'Downtown Dallas', via: 'Lake Ray Hubbard TC'}})).to.eql('Bus 224: Downtown Garland Station -> Lake Ray Hubbard TC -> Downtown Dallas');
        });
        it('suppresses the network tag if the hideNetwork argument is true', function() {
            expect(iD.utilDisplayName({tags: { name: 'Lynfield Express', ref: '25L', network: 'AT', route: 'bus' }}, { hideNetwork: true })).to.eql('25L: Lynfield Express');
            expect(iD.utilDisplayName({tags: { network: 'SORTA', ref: '3X' }}, { hideNetwork: true })).to.eql('3X');
            expect(iD.utilDisplayName({tags: { name: 'Dallas North Tollway', network: 'US:TX:NTTA', route: 'road' }}, { hideNetwork: true })).to.eql('Dallas North Tollway');
        });
        it('suppresses the ref tag if the hideRef argument is true', function() {
            expect(iD.utilDisplayName({tags: { name: 'Lynfield Express', ref: '25L', network: 'AT', route: 'bus' }}, { hideRef: true })).to.eql('AT Lynfield Express');
            expect(iD.utilDisplayName({tags: { network: 'SORTA', ref: '3X' }}, { hideRef: true })).to.eql('SORTA');
            expect(iD.utilDisplayName({tags: { name: 'Dallas North Tollway', network: 'US:TX:NTTA', route: 'road' }}, { hideRef: true })).to.eql('US:TX:NTTA Dallas North Tollway');
        });
        it('distinguishes unnamed features by ref', function() {
            expect(iD.utilDisplayName({tags: {ref: '66'}})).to.eql('66');
        });
        it('distinguishes unnamed features by network or cycle_network', function() {
            expect(iD.utilDisplayName({tags: {network: 'SORTA', ref: '3X'}})).to.eql('SORTA 3X');
            expect(iD.utilDisplayName({tags: {network: 'ncn', cycle_network: 'US:US', ref: '76'}})).to.eql('US:US 76');
        });
        it('distinguishes unnamed routes by direction', function() {
            expect(iD.utilDisplayName({tags: {network: 'US:US', ref: '66', direction: 'west', route: 'road'}})).to.eql('US:US 66 west');
            // Marguerite X: Counter-Clockwise
            expect(iD.utilDisplayName({tags: {network: 'Marguerite', ref: 'X', direction: 'anticlockwise', route: 'bus'}})).to.eql('Marguerite X anticlockwise');
        });
        it('distinguishes unnamed routes by waypoints', function() {
            expect(iD.utilDisplayName({tags: {network: 'SORTA', ref: '3X', from: 'Downtown', route: 'bus'}})).to.eql('SORTA 3X');
            expect(iD.utilDisplayName({tags: {network: 'SORTA', ref: '3X', to: 'Kings Island', route: 'bus'}})).to.eql('SORTA 3X');
            expect(iD.utilDisplayName({tags: {network: 'SORTA', ref: '3X', via: 'Montgomery', route: 'bus'}})).to.eql('SORTA 3X');
            // Green Line: Old Ironsides => Winchester
            expect(iD.utilDisplayName({tags: {network: 'VTA', ref: 'Green', from: 'Old Ironsides', to: 'Winchester', route: 'bus'}})).to.eql('VTA Green from Old Ironsides to Winchester');
            // BART Yellow Line: Antioch => Pittsburg/Bay Point => SFO Airport => Millbrae
            expect(iD.utilDisplayName({tags: {network: 'BART', ref: 'Yellow', from: 'Antioch', to: 'Millbrae', via: 'Pittsburg/Bay Point;San Francisco International Airport', route: 'subway'}})).to.eql('BART Yellow from Antioch to Millbrae via Pittsburg/Bay Point;San Francisco International Airport');
        });
        it('can use alternative name tags', () => {
            expect(iD.utilDisplayName({ tags: { loc_ref: 'A' } })).to.eql('A');
            expect(iD.utilDisplayName({ tags: { 'seamark:name': 'Bean Rock' } })).to.eql('Bean Rock');

            expect(iD.utilDisplayName({ tags: { highway: 'milestone', distance: '12' } })).to.eql('12');
            expect(iD.utilDisplayName({ tags: { distance: '12' } })).to.eql(''); // `distance` is not used as a name on other features

            expect(iD.utilDisplayName({ tags: { railway: 'milestone', 'railway:position': '12' } })).to.eql('12');
            expect(iD.utilDisplayName({ tags: { 'railway:position': '12' } })).to.eql(''); // `railway:position` is not used as a name on other features
        });
        it('prefers standard tags over alternative names', () => {
            expect(iD.utilDisplayName({ tags: { name: '1', official_name: '2' } })).to.eql('1');
            expect(iD.utilDisplayName({ tags: { ref: '1', loc_ref: '2' } })).to.eql('1');
            expect(iD.utilDisplayName({ tags: { ref: '1', network: 'AT', loc_ref: '2' } })).to.eql('AT 1');
        });
        it('distinguishes named features by name', function() {
            expect(iD.utilDisplayName({tags: { name: 'Ohio Turnpike', route: 'road' }})).to.eql('Ohio Turnpike');
            expect(iD.utilDisplayName({tags: { name: 'Lynfield Express', ref: '25L', route: 'bus' }})).to.eql('25L: Lynfield Express');
            expect(iD.utilDisplayName({tags: { name: 'Kāpiti Expressway', ref: 'SH1', route: 'road' }})).to.eql('SH1: Kāpiti Expressway');
            expect(iD.utilDisplayName({tags: { name: 'Lynfield Express', ref: '25L', network: 'AT', route: 'bus' }})).to.eql('AT 25L: Lynfield Express');
        });
        it('distinguishes named features by network or cycle_network', function() {
            expect(iD.utilDisplayName({tags: { name: 'Dallas North Tollway', network: 'US:TX:NTTA', route: 'road' }})).to.eql('US:TX:NTTA Dallas North Tollway');
        });
        it('distinguishes named features by ref', function() {
            expect(iD.utilDisplayName({tags: { name: 'Dallas North Tollway', network: 'US:TX:NTTA', ref: 'DNT', route: 'road' }})).to.eql('US:TX:NTTA DNT: Dallas North Tollway');
        });
        it('distinguishes named features by direction', function() {
            expect(iD.utilDisplayName({tags: { name: 'Dallas North Tollway', network: 'US:TX:NTTA', direction: 'south', route: 'road' }})).to.eql('US:TX:NTTA Dallas North Tollway south');
        });
        it('distinguishes named features by waypoints', function() {
            expect(iD.utilDisplayName({tags: { name: 'Kings Island Express', network: 'SORTA', ref: '71X', from: 'Sycamore & Court', to: 'Fields Ertel & Royal Point', route: 'bus' }})).to.eql('SORTA 71X: Kings Island Express from Sycamore & Court to Fields Ertel & Royal Point');
            expect(iD.utilDisplayName({tags: { name: 'Local', network: 'Caltrain', from: 'San Francisco', to: 'Tamien', via: 'College Park', route: 'train' }})).to.eql('Caltrain Local from San Francisco to Tamien via College Park');
        });
        it('uses addr:housename', () => {
            expect(iD.utilDisplayName({ tags: { 'addr:housename': 'Siglap House' } })).to.eql('Siglap House');
        });
        it('uses the street address as a last resort', () => {
            expect(iD.utilDisplayName({ tags: { 'addr:housenumber': '31', 'addr:street': 'Princes Street' } })).to.eql('31 Princes Street');
        });
        it('uses the street address as a last resort', () => {
            expect(iD.utilDisplayName({ tags: { 'addr:housenumber': '1', 'addr:place': 'Motutapu Island' } })).to.eql('1 Motutapu Island');
        });
        it('uses addr:unit if present', () => {
            expect(iD.utilDisplayName({ tags: { 'addr:unit': 'Flat 1', 'addr:housenumber': '30', 'addr:street': 'Madden Street' } })).to.eql('Flat 1, 30 Madden Street');
        });
        it('uses just addr:housenumber if it is the only addr: tag present', () => {
            expect(iD.utilDisplayName({ tags: { 'addr:housenumber': '32' } })).to.eql('32');
        });
        it('uses only the housenumber for map labels', () => {
            expect(iD.utilDisplayName({ tags: { 'addr:housenumber': '31', 'addr:street': 'Princes Street' } }, { isMapLabel: true })).to.eql('31');
        });

        describe('localised names', () => {
            it('considers the original locale code first', () => {
                expect(iD.utilDisplayName({ tags: { name: '5', 'name:en': '4', 'name:en-Latn': '3', 'name:en-US': '2', 'name:en-Latn-US': '1' } }, undefined, true)).toBe('1');
            });
            it('fallbacks to the maximized locale', () => {
                expect(iD.utilDisplayName({ tags: { name: '5', 'name:en': '4', 'name:en-Latn': '3', 'name:en-US': '2' } }, undefined, true)).toBe('2');
                expect(iD.utilDisplayName({ tags: { name: '5', 'name:en': '4', 'name:en-Latn': '3' } }, undefined, true)).toBe('3');
                expect(iD.utilDisplayName({ tags: { name: '5', 'name:en': '4' } }, undefined, true)).toBe('4');
            });
        });
    });

    describe('utilOldestID', function() {
        it('returns the oldest database ID', function() {
            expect(iD.utilOldestID(['w3', 'w1', 'w2'])).to.eql('w1');
        });
        it('returns the oldest editor ID', function() {
            expect(iD.utilOldestID(['w-3', 'w-2', 'w-1'])).to.eql('w-1');
        });
        it('returns the oldest IDs among database and editor IDs', function() {
            expect(iD.utilOldestID(['w-1', 'w1', 'w-2'])).to.eql('w1');
        });
        it('returns the oldest database ID', function() {
            expect(iD.utilOldestID(['w100', 'w-1', 'a', 'w-300', 'w2'])).to.eql('w2');
        });
        it('returns the oldest editor ID if no database IDs', function() {
            expect(iD.utilOldestID(['w-100', 'w-1', 'a', 'w-300', 'w-2'])).to.eql('w-1');
        });
        it('returns the first ID in the list otherwise', function() {
            expect(iD.utilOldestID(['z', 'a', 'A', 'Z'])).to.eql('z');
        });
    });
});
