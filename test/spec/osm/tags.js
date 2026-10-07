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

describe('osmMatchTags', () => {
  it.each`
    matcher                             | tags                    | isMatching
    ${[{ a: '*' }]}                     | ${{}}                   | ${false}
    ${[{ a: '*' }]}                     | ${{ a: '' }}            | ${false}
    ${[{ a: '*' }]}                     | ${{ a: '1' }}           | ${true}
    ${[{ a: '1' }]}                     | ${{}}                   | ${false}
    ${[{ a: '1' }]}                     | ${{ a: '' }}            | ${false}
    ${[{ a: '1' }]}                     | ${{ a: '1' }}           | ${true}
    ${[{ a: '1' }]}                     | ${{ a: '2' }}           | ${false}
    ${[{ a: '1' }, { a: '2' }]}         | ${{ a: '1' }}           | ${true}
    ${[{ a: '1' }, { a: '2' }]}         | ${{ a: '2' }}           | ${true}
    ${[{ a: '1' }, { a: '2' }]}         | ${{ a: '3' }}           | ${false}
    ${[] /* this means none */}         | ${{ a: '1' }}           | ${false}
    ${[] /* this means none */}         | ${{}}                   | ${false}
    ${[{}] /* this means any */}        | ${{}}                   | ${true}
    ${[{ a: '1', b: '1' }, { b: '2' }]} | ${{ a: '1' }}           | ${false}
    ${[{ a: '1', b: '1' }, { b: '2' }]} | ${{ a: '1', b: '1' }}   | ${true}
    ${[{ a: '1', b: '1' }, { b: '2' }]} | ${{ b: '2' }}           | ${true}
    ${[{ a: '1', b: '1' }, { b: '2' }]} | ${{ b: '1' }}           | ${false}
  `('returns $isMatching when comparing $tags against $matcher', ({ matcher, tags, isMatching }) => {
    expect(iD.osmMatchTags(matcher, tags)).toBe(isMatching);
  });
});
