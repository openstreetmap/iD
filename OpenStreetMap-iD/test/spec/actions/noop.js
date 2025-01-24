describe('iD.actionNoop', function () {
    it('does nothing', function () {
        var graph = iD.coreGraph(),
            action = iD.actionNoop(graph);
        expect(action(graph)).to.equal(graph);
    });
});
