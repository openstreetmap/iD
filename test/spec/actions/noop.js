describe('iD.actionNoop', function () {
    it('does nothing', function () {
        const graph = iD.coreGraph(),
            action = iD.actionNoop(graph);
        expect(action(graph)).to.equal(graph);
    });
});
