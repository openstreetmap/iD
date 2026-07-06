describe('iD.actionNoop', function () {
    it('does nothing', function () {
        var graph = new iD.coreGraph(),
            action = iD.actionNoop(graph);
        expect(action(graph)).toEqual(graph);
    });
});
