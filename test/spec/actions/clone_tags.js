describe('iD.actionCloneTags', function () {

    it('creates new tag when there are no tags', function () {
        let value = 'test';
        let graph = iD.coreGraph([
            iD.osmNode({ id: 'a', tags: { 'x': value } }),
            iD.osmNode({ id: 'b' })
        ]);
        graph = iD.actionCloneTags(['a', 'b'], ['x'])(graph);
        expect(graph.entity('b').tags.x).to.eql(graph.entity('a').tags.x);
    });

    it('creates new tag when there other tags exist', function () {
        let value = 'test';
        let graph = iD.coreGraph([
            iD.osmNode({ id: 'a', tags: { 'x': value } }),
            iD.osmNode({ id: 'b', tags: { foo: 'bar' } })
        ]);
        graph = iD.actionCloneTags(['a', 'b'], ['x'])(graph);
        expect(graph.entity('b').tags.x).to.eql(graph.entity('a').tags.x);
        expect(graph.entity('b').tags.foo).to.eql('bar');
    });

    it('overwrites existing tag', function () {
        let value = 'test';
        let graph = iD.coreGraph([
            iD.osmNode({ id: 'a', tags: { 'x': value } }),
            iD.osmNode({ id: 'b', tags: { 'x': 'foo' } })
        ]);
        graph = iD.actionCloneTags(['a', 'b'], ['x'])(graph);
        expect(graph.entity('b').tags.x).to.eql(graph.entity('a').tags.x);
    });

    it('clones only the requested tags', function () {
        let value = 'test';
        let graph = iD.coreGraph([
            iD.osmNode({ id: 'a', tags: { 'x': value, 'y': 'foo' } }),
            iD.osmNode({ id: 'b', tags: { 'z': 'bar' } })
        ]);
        graph = iD.actionCloneTags(['a', 'b'], ['x'])(graph);
        expect(graph.entity('b').tags.x).to.eql(graph.entity('a').tags.x);
        expect(graph.entity('a').tags.y).to.eql('foo');
        expect(graph.entity('b').tags.z).to.eql('bar');
    });

    it('clones several tags', function () {
        let value1 = 'test';
        let value2 = 'test2';
        let value3 = 'test3';
        let graph = iD.coreGraph([
            iD.osmNode({ id: 'a', tags: { 'x': value1, 'y': value2, 'z': value3 } }),
            iD.osmNode({ id: 'b' })
        ]);
        graph = iD.actionCloneTags(['a', 'b'], ['x', 'y', 'z'])(graph);
        expect(graph.entity('b').tags.x).to.eql(graph.entity('a').tags.x);
        expect(graph.entity('b').tags.y).to.eql(graph.entity('a').tags.y);
        expect(graph.entity('b').tags.z).to.eql(graph.entity('a').tags.z);
    });

    it('clones to several nodes', function () {
        let value = 'test';
        let graph = iD.coreGraph([
            iD.osmNode({ id: 'a', tags: { 'x': value } }),
            iD.osmNode({ id: 'b', tags: { 'x': 'bar' } }),
            iD.osmNode({ id: 'c' })
        ]);
        graph = iD.actionCloneTags(['a', 'b', 'c'], ['x'])(graph);
        expect(graph.entity('b').tags.x).to.eql(graph.entity('a').tags.x);
        expect(graph.entity('c').tags.x).to.eql(graph.entity('a').tags.x);
    });

    it('doesn\'t do anything if it doesn\'t recieve any tags to clone', function () {
        let value = 'test';
        let graph = iD.coreGraph([
            iD.osmNode({ id: 'a', tags: { 'x': value } }),
            iD.osmNode({ id: 'b', tags: { 'x': 'bar' } }),
            iD.osmNode({ id: 'c' })
        ]);
        graph = iD.actionCloneTags(['a', 'b', 'c'])(graph);
        expect(graph.entity('b').tags.x).to.not.eql(graph.entity('a').tags.x);
        expect(graph.entity('c').tags.x).to.not.eql(graph.entity('a').tags.x);
    });

    it('doesn\'t copy if the requested tags are not found', function () {
        let value = 'test';
        let graph = iD.coreGraph([
            iD.osmNode({ id: 'a', tags: { 'x': value } }),
            iD.osmNode({ id: 'b' })
        ]);
        graph = iD.actionCloneTags(['a', 'b'], ['z'])(graph);
        expect(graph.entity('b').tags.x).to.not.eql(graph.entity('a').tags.x);
    });

});