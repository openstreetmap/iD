describe('iD.osmRemoveLifecyclePrefix',  function () {
    it('removes the lifecycle prefix from a tag key',  function () {
        expect(iD.osmRemoveLifecyclePrefix('was:natural')).to.equal('natural');
        expect(iD.osmRemoveLifecyclePrefix('destroyed:seamark:type')).to.equal('seamark:type');
    });

    it('ignores invalid lifecycle prefixes', function () {
        expect(iD.osmRemoveLifecyclePrefix('ex:leisure')).to.equal('ex:leisure');
    });
});


describe('osmTagSuggestingArea', function () {
    beforeEach(function () {
        iD.osmSetAreaKeys({ leisure: {} });
    });

    it('handles features with a lifecycle prefixes', function () {
        expect(iD.osmTagSuggestingArea({ leisure: 'stadium' })).to.eql({ leisure: 'stadium' });
        expect(iD.osmTagSuggestingArea({ 'disused:leisure': 'stadium' })).to.eql({ 'disused:leisure': 'stadium' });
        expect(iD.osmTagSuggestingArea({ 'ex:leisure': 'stadium' })).to.be.null;
    });
});
