describe('iD.osmRemoveLifecyclePrefix',  function () {
    it('removes the lifecycle prefix from a tag key',  function () {
        expect(iD.osmRemoveLifecyclePrefix('was:natural')).toEqual('natural');
        expect(iD.osmRemoveLifecyclePrefix('destroyed:seamark:type')).toEqual('seamark:type');
    });

    it('ignores invalid lifecycle prefixes', function () {
        expect(iD.osmRemoveLifecyclePrefix('ex:leisure')).toEqual('ex:leisure');
    });
});


describe('osmTagSuggestingArea', function () {
    beforeEach(function () {
        iD.osmSetAreaKeys({ leisure: {} });
    });

    it('handles features with a lifecycle prefixes', function () {
        expect(iD.osmTagSuggestingArea({ leisure: 'stadium' })).toEqual({ leisure: 'stadium' });
        expect(iD.osmTagSuggestingArea({ 'disused:leisure': 'stadium' })).toEqual({ 'disused:leisure': 'stadium' });
        expect(iD.osmTagSuggestingArea({ 'ex:leisure': 'stadium' })).toBeNull();
    });
});


describe('iD.osmIsAddressKey', function () {
    it('matches address tags', function () {
        expect(iD.osmIsAddressKey('addr:housenumber')).toBe(true);
        expect(iD.osmIsAddressKey('addr:street')).toBe(true);
        expect(iD.osmIsAddressKey('addr:TW:dataset')).toBe(true);
    });

    it('matches address meta tags', function () {
        expect(iD.osmIsAddressKey('source:addr')).toBe(true);
        expect(iD.osmIsAddressKey('source:addr:postcode')).toBe(true);
        expect(iD.osmIsAddressKey('old_addr:housenumber')).toBe(true);
        expect(iD.osmIsAddressKey('alt_addr:housenumber')).toBe(true);
        expect(iD.osmIsAddressKey('not:addr:housenumber')).toBe(true);
    });

    it('matches identifiers of imported address data', function () {
        expect(iD.osmIsAddressKey('ref:ruian:addr')).toBe(true);
        expect(iD.osmIsAddressKey('ref:linz:address_id')).toBe(true);
        expect(iD.osmIsAddressKey('ref:RS:kucni_broj')).toBe(true);
        expect(iD.osmIsAddressKey('nysgissam:nysaddresspointid')).toBe(true);
        expect(iD.osmIsAddressKey('osak:identifier')).toBe(true);
    });

    it('does not match other tags', function () {
        expect(iD.osmIsAddressKey('building')).toBe(false);
        expect(iD.osmIsAddressKey('source')).toBe(false);
        expect(iD.osmIsAddressKey('source:geometry')).toBe(false);
        expect(iD.osmIsAddressKey('ref:GB:uprn')).toBe(false);
        expect(iD.osmIsAddressKey('ref:linz:building_id')).toBe(false);
        expect(iD.osmIsAddressKey('address')).toBe(false);
        expect(iD.osmIsAddressKey('entrance')).toBe(false);
    });
});


describe('iD.osmIsAddressPoint', function () {
    it('is true for features with only address tags', function () {
        expect(iD.osmIsAddressPoint({ 'addr:housenumber': '1' })).toBe(true);
        expect(iD.osmIsAddressPoint({ 'addr:housenumber': '1', 'addr:street': 'Main Street', 'addr:postcode': '12345' })).toBe(true);
    });

    it('disregards uninteresting and non-primary tags', function () {
        expect(iD.osmIsAddressPoint({ 'addr:housenumber': '1', source: 'survey', 'source:addr': 'survey' })).toBe(true);
        expect(iD.osmIsAddressPoint({ 'addr:housenumber': '1', fixme: 'check', note: 'foo', check_date: '2024-01-01', level: '1' })).toBe(true);
        expect(iD.osmIsAddressPoint({ 'addr:housenumber': '1', 'ref:ruian:addr': '1', 'nysgissam:nysaddresspointid': '1', 'osak:identifier': '1' })).toBe(true);
        expect(iD.osmIsAddressPoint({ 'addr:housenumber': '1', 'old_addr:housenumber': '1a', 'survey:date': '2024-01-01' })).toBe(true);
    });

    it('is false for features without address tags', function () {
        expect(iD.osmIsAddressPoint({})).toBe(false);
        expect(iD.osmIsAddressPoint({ source: 'survey' })).toBe(false);
        expect(iD.osmIsAddressPoint({ 'source:addr': 'survey', fixme: 'add address' })).toBe(false);
    });

    it('is false for features with other primary tags', function () {
        expect(iD.osmIsAddressPoint({ 'addr:housenumber': '1', amenity: 'cafe' })).toBe(false);
        expect(iD.osmIsAddressPoint({ 'addr:housenumber': '1', name: 'Foo' })).toBe(false);
        expect(iD.osmIsAddressPoint({ 'addr:housenumber': '1', building: 'yes' })).toBe(false);
        expect(iD.osmIsAddressPoint({ 'addr:housenumber': '1', entrance: 'yes' })).toBe(false);
    });

    it('disregards additional keys when asked to', function () {
        expect(iD.osmIsAddressPoint({ 'addr:housenumber': '1', building: 'yes' }, key => key === 'building')).toBe(true);
        expect(iD.osmIsAddressPoint({ 'addr:housenumber': '1', building: 'yes', amenity: 'cafe' }, key => key === 'building')).toBe(false);
    });
});
