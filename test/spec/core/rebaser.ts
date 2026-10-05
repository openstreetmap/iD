import type { coreContext, coreHistory } from '../../../modules';
import { rebaseRemoteChangesIntoBaseGraph } from '../../../modules/core/rebaser';

describe('rebaseRemoteChangesIntoBaseGraph', () => {
    let context: coreContext;
    let history: coreHistory;

    beforeEach(() => {
        context = iD.coreContext().assetPath('../dist/').init();
        history = context.history();
    });

    // this is the base state, when the tab first loaded
    const n1 = new iD.osmNode({ id: 'n1', version: 1, loc: [1, 1] });
    const n2 = new iD.osmNode({ id: 'n2', version: 1, loc: [2, 2] });
    const n3 = new iD.osmNode({ id: 'n3', version: 1, loc: [3, 3] });
    const w1 = new iD.osmWay({ id: 'w1', version: 1, nodes: ['n1', 'n2', 'n3'] });

    it('rebases the graph with the latest versions from the remote', () => {
        history.merge([n1, n2, n3, w1]);

        // we deleted n3
        history.perform(iD.actionDeleteNode('n3'));

        // someone else moved n1 and deleted n2
        const n1_new = new iD.osmNode({ id: 'n1', version: 2, loc: [11, 11] });
        const n2_new = new iD.osmNode({ id: 'n2', version: 2, visible: false });
        const remoteGraph = new iD.coreGraph([n1_new, n2_new], true);

        rebaseRemoteChangesIntoBaseGraph(context, w1, remoteGraph);

        const base = history.base();
        expect(base.entity('w1')).toBe(w1);

        // n1: updated to reflect the other user's change
        expect(base.entity('n1')).toBe(n1_new);
        expect(history.graph().hasEntity('n1')).toBe(n1_new);

        // n2: local kept bc it was deleted by the other user
        expect(base.entity('n2')).toBe(n2);
        expect(history.graph().hasEntity('n2')).toBe(n2);

        // n3 is still in the base, but not in the current graph (bc we deleted it locally)
        expect(base.entity('n3')).toBe(n3);
        expect(history.graph().hasEntity('n3')).toBeUndefined();

        // and the derived state should be updated
        expect(base.parentWays(base.entity('n1'))).toStrictEqual([w1]);
    });
});
