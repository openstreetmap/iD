describe('iD.actionRotatePointDirection', () => {
    it('sets a numeric direction to the given absolute degrees', () => {
        const node = new iD.osmNode({ tags: { direction: '350' } });
        const graph = iD.actionRotatePointDirection(node.id, 20)(
            new iD.coreGraph().replace(node)
        );

        expect(graph.entity(node.id).tags.direction).toEqual('20');
    });

    it('wraps absolute degrees into [0, 360)', () => {
        const node = new iD.osmNode({ tags: { direction: '5' } });
        const graph = iD.actionRotatePointDirection(node.id, -15)(
            new iD.coreGraph().replace(node)
        );

        expect(graph.entity(node.id).tags.direction).toEqual('345');
    });

    it('sets a prefixed numeric direction key', () => {
        const node = new iD.osmNode({ tags: { 'camera:direction': '10' } });
        const graph = iD.actionRotatePointDirection(node.id, 90, 'camera:direction')(
            new iD.coreGraph().replace(node)
        );

        expect(graph.entity(node.id).tags['camera:direction']).toEqual('90');
        expect(graph.entity(node.id).tags.direction).toBeUndefined();
    });

    it('sets a direction when the tag was previously absent', () => {
        const node = new iD.osmNode({ tags: { amenity: 'bench' } });
        const graph = iD.actionRotatePointDirection(node.id, 123.4, 'direction')(
            new iD.coreGraph().replace(node)
        );

        expect(graph.entity(node.id).tags.direction).toEqual('123');
    });

    it('does nothing for non-numeric directions without an explicit key', () => {
        const node = new iD.osmNode({ tags: { direction: 'forward' } });
        const graph = iD.actionRotatePointDirection(node.id, 45)(
            new iD.coreGraph().replace(node)
        );

        expect(graph.entity(node.id).tags.direction).toEqual('forward');
    });

    it('rounds direction to whole degrees', () => {
        const node = new iD.osmNode({ tags: { direction: '10' } });
        const graph = iD.actionRotatePointDirection(node.id, 10.123456)(
            new iD.coreGraph().replace(node)
        );

        expect(graph.entity(node.id).tags.direction).toEqual('10');
    });
});
