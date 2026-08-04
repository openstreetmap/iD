describe('iD.actionRotatePointDirection', () => {
    it('rotates a numeric direction clockwise', () => {
        const node = new iD.osmNode({ tags: { direction: '350' } });
        const graph = iD.actionRotatePointDirection(node.id, 20)(
            new iD.coreGraph().replace(node)
        );

        expect(graph.entity(node.id).tags.direction).toEqual('10');
    });

    it('rotates a numeric direction counterclockwise', () => {
        const node = new iD.osmNode({ tags: { direction: '5' } });
        const graph = iD.actionRotatePointDirection(node.id, -15)(
            new iD.coreGraph().replace(node)
        );

        expect(graph.entity(node.id).tags.direction).toEqual('350');
    });

    it('does nothing for non-numeric directions', () => {
        const node = new iD.osmNode({ tags: { direction: 'forward' } });
        const graph = iD.actionRotatePointDirection(node.id, 45)(
            new iD.coreGraph().replace(node)
        );

        expect(graph.entity(node.id).tags.direction).toEqual('forward');
    });

    it('rounds rotated direction to whole degrees', () => {
        const node = new iD.osmNode({ tags: { direction: '10' } });
        const graph = iD.actionRotatePointDirection(node.id, 0.123456)(
            new iD.coreGraph().replace(node)
        );

        expect(graph.entity(node.id).tags.direction).toEqual('10');
    });
});
