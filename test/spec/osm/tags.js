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
