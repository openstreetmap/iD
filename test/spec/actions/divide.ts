import type { NodeId } from '../../../modules';
import { divideRectangle, scaleToBottomRight, translateToOrigin } from '../../../modules/actions/divide';
import type { Vec2 } from '../../../modules/geo/vector';

describe('iD.actionDivide', () => {
  const mockProjection = (coord: Vec2) => coord;
  mockProjection.invert = (coord: Vec2) => coord;

  beforeEach(() => {
    iD.osmIdManager.next = {
      changeset: -1, node: -1, way: -1, relation: -1
    };
  });

  describe('maths', () => {
    it('splits a rectangle into a grid of smaller rectangle', () => {
      const input: Vec2[] = [[0, 2], [3, 5], [5, 3], [2, 0]];
      const { isValid, newShapes } = divideRectangle(2, 3, input);
      expect(isValid).toBe(true);
      expect(newShapes).toStrictEqual([
        [[0, 2], [1, 1], [2, 2], [1, 3]],
        [[1, 3], [2, 2], [3, 3], [2, 4]],
        [[2, 4], [3, 3], [4, 4], [3, 5]],
        [[1, 1], [2, 0], [3, 1], [2, 2]],
        [[2, 2], [3, 1], [4, 2], [3, 3]],
        [[3, 3], [4, 2], [5, 3], [4, 4]]
      ]);
    });

    it('is a no-op when the dimensions are 1x1', () => {
      const [A, B, C, D]: Vec2[] = [[0, 2], [3, 5], [5, 3], [2, 0]];
      const { isValid, newShapes } = divideRectangle(1, 1, [A, B, C, D]);
      expect(isValid).toBe(true);
      expect(newShapes).toStrictEqual([[A, D, C, B]]);
    });

    it('recognises when a shape is self-intersecting', () => {
      // 4
      // |\
      // | \
      // | 3
      // |  ﹨
      // |    ﹨
      // 1------2
      //
      const [n1, n2, n3, n4]: Vec2[] = [[0, 0], [0, 4], [1, 1], [4, 0]];

      // valid for 1x1, because the original shape is valid
      const original = divideRectangle(1, 1, [n1, n2, n3, n4]);
      expect(original.isValid).toBe(true);
      expect(original.newShapes).toStrictEqual([[n1, n4, n3, n2]]);

      // invalid for 2x1
      const divided = divideRectangle(2, 1, [n1, n2, n3, n4]);
      expect(divided.isValid).toBe(false);
      expect(divided.newShapes).toStrictEqual(
        [
          [[0, 0], [4, 0], [2.5, 0.5], [0, 2]],
          [[0, 2], [2.5, 0.5], [1, 1], [0, 4]]
        ]
      );

      // sanity check that both combinations are invalid
      expect(divideRectangle(1, 2, [n1, n2, n3, n4]).isValid).toBe(false);
      expect(divideRectangle(2, 1, [n1, n2, n3, n4]).isValid).toBe(false);


      // 2x2 is technically valid, because it's not self-intersecting,
      // it's just concave.
      expect(divideRectangle(2, 2, [n1, n2, n3, n4]).isValid).toBe(true);
    });

    it('maintains reference-equality between identical coordinates', () => {
      const input: Vec2[] = [[0, 2], [3, 5], [5, 3], [2, 0]];
      const { newShapes } = divideRectangle(2, 2, input);
      expect(newShapes).toStrictEqual(
        [
          [[0, 2], [1, 1], [2.5, 2.5], [1.5, 3.5]],
          [[1.5, 3.5], [2.5, 2.5], [4, 4], [3, 5]],
          [[1, 1], [2, 0], [3.5, 1.5], [2.5, 2.5]],
          [[2.5, 2.5], [3.5, 1.5], [5, 3], [4, 4]]
        ]
      );
      expect(newShapes[0][2]).toBe(newShapes[1][1]);
      expect(newShapes[0][2]).toBe(newShapes[2][3]);
      expect(newShapes[0][2]).toBe(newShapes[3][0]);

      // it also has reference-equality with the original array
      expect(input[0]).toBe(newShapes[0][0]);
      expect(input[3]).toBe(newShapes[2][1]);
    });
  });

  it('splits a way into a grid of smaller ways', () => {
    //    2
    //   / \
    //  /   3
    // 1   /
    //  \ /
    //   4
    //
    // this test only makes sense with the diagram:
    // https://desmos.com/calculator/c9j1euq7nf
    //
    let graph = new iD.coreGraph([
        new iD.osmNode({ id: 'n1', loc: [0, 2] }),
        new iD.osmNode({ id: 'n2', loc: [3, 5] }),
        new iD.osmNode({ id: 'n3', loc: [5, 3] }),
        new iD.osmNode({ id: 'n4', loc: [2, 0] }),
        new iD.osmWay({ id: 'w1', nodes: ['n1', 'n2', 'n3', 'n4', 'n1'], tags: { amenity: 'parking_space' } })
    ]);

    // split into a 2x3 grid (2 along the short edge, 3 along long edge)
    graph = iD.actionDivide('w1', mockProjection)(graph, null, { short_length: 2, long_length: 3 });

    // the original way is still here
    expect(graph.hasEntity('w1')).toBeTruthy();

    // the original nodes (1,2,3,4) also still exist
    expect(graph.hasEntity('n1')).toBeTruthy();

    // in our 2x3 grid, we now have 2*3 ways, made up of (2+1)*(3+1) nodes

    // the first way is row 0, col 0. It re-uses node A.
    expect(graph.entity('w1').nodes).toStrictEqual(['n1', 'n-1', 'n-2', 'n-3', 'n1']);
    expect(graph.entity('w-1').nodes).toStrictEqual(['n-3', 'n-2', 'n-4', 'n-5', 'n-3']);
    expect(graph.entity('w-2').nodes).toStrictEqual(['n-5', 'n-4', 'n-6', 'n2', 'n-5']);
    expect(graph.entity('w-3').nodes).toStrictEqual(['n-1', 'n4', 'n-7', 'n-2', 'n-1']);
    expect(graph.entity('w-4').nodes).toStrictEqual(['n-2', 'n-7', 'n-8', 'n-4', 'n-2']);
    expect(graph.entity('w-5').nodes).toStrictEqual(['n-4', 'n-8', 'n3', 'n-6', 'n-4']);
    // the last way is row 1, col 2. It re-uses node C.

    expect(graph.entity('n-1').loc).toStrictEqual([1, 1]);
    expect(graph.entity('n-2').loc).toStrictEqual([2, 2]);
    expect(graph.entity('n-3').loc).toStrictEqual([1, 3]);
    expect(graph.entity('n-4').loc).toStrictEqual([3, 3]);
    expect(graph.entity('n-5').loc).toStrictEqual([2, 4]);
    expect(graph.entity('n-6').loc).toStrictEqual([4, 4]);
    expect(graph.entity('n-7').loc).toStrictEqual([3, 1]);
    expect(graph.entity('n-8').loc).toStrictEqual([4, 2]);

    // check that it copies the tags to all its ways
    expect(graph.entity('w-1').tags).toStrictEqual({ amenity: 'parking_space' });
    expect(graph.entity('w-5').tags).toStrictEqual({ amenity: 'parking_space' });
    expect(graph.entity('w1').tags).toStrictEqual({ amenity: 'parking_space' });
  });

  describe('splits abutting ways', () => {
    it.each`
      before               | after
      ${'BghCB'}           | ${'BghC4B'}
      ${'BChgB'}           | ${'B4ChgB'}
      ${'elABChgfe'}       | ${'elA3B4Chgfe'}
      ${'elABCDkjihgfe'}   | ${'elA3B4C5Dkjihgfe'}
      ${'kDAlk'}           | ${'kD1Alk' /* wrap around the end of array (D->A) */}
      ${'klADk'}           | ${'klA1Dk'}
      ${'kDABgfelk'}       | ${'kD1A3Bgfelk'}
      ${'klefgBADk'}       | ${'klefgB3A1Dk'}
      ${'AfelA'}           | ${'AfelA' /* noop, only touches one corner */}
      ${'ADklA'}           | ${'A1DklA'}
      ${'ABCDA'}           | ${'A3B4C5D1A'}
      ${'ADCBA'}           | ${'A1D5C4B3A' /* exact same as input */}
      ${'ABCijDA'}         | ${'A3B4CijD1A'}
      ${'AB'}              | ${'A3B' /* unclosed line */}
      ${'DAB'}             | ${'D1A3B'}
      ${'BAD'}             | ${'B3A1D'}
      ${'ABD'}             | ${'A3BD'}
      ${'kDABCD'}          | ${'kD1A3B4C5D' /* balloon loop */}
    `('converts $before into $after', ({ before, after }: { before: string; after: string }) => {
      //
      // All test cases use the same grid, where ABCD is the original
      // shape, and nodes -1 through -5 are inserted during the 2x2 split.
      //
      // For example: any other areas that abut edge AB need to become A3B, CBA needs to become C4B3A, etc.
      //
      // 4    e-----------f
      //      |           |
      // 3    l   A-3-B   g
      //      |   | | |   |
      // 2    |   1-2-4   |
      //      |   | | |   |
      // 1    k   D-5-C   h
      //      |           |
      // 0    j-----------i
      //(y)
      //   (x)0   1 2 3   4
      //

      // expand the concise syntax used above
      const beforeNodes: NodeId[] = before.split('').map((n) => <NodeId>(Number.isNaN(+n) ? n : `n-${n}`));
      const afterNodes: NodeId[] = after.split('').map(n => <NodeId>(Number.isNaN(+n) ? n : `n-${n}`));

      let graph = new iD.coreGraph([
        new iD.osmNode({ id: <NodeId>'A', loc: [1, 3] }),
        new iD.osmNode({ id: <NodeId>'B', loc: [3, 3] }),
        new iD.osmNode({ id: <NodeId>'C', loc: [3, 1] }),
        new iD.osmNode({ id: <NodeId>'D', loc: [1, 1] }),
        new iD.osmNode({ id: <NodeId>'e', loc: [0, 4] }),
        new iD.osmNode({ id: <NodeId>'f', loc: [4, 4] }),
        new iD.osmNode({ id: <NodeId>'g', loc: [4, 3] }),
        new iD.osmNode({ id: <NodeId>'h', loc: [4, 1] }),
        new iD.osmNode({ id: <NodeId>'i', loc: [4, 0] }),
        new iD.osmNode({ id: <NodeId>'j', loc: [0, 0] }),
        new iD.osmNode({ id: <NodeId>'k', loc: [0, 1] }),
        new iD.osmNode({ id: <NodeId>'l', loc: [0, 3] }),
        new iD.osmWay({ id: 'w1', nodes: [<NodeId>'A', <NodeId>'B', <NodeId>'C', <NodeId>'D', <NodeId>'A'], tags: { amenity: 'parking_space' } }),
        new iD.osmWay({ id: 'w2', nodes: beforeNodes, tags: { amenity: 'parking' } })
      ]);

      // split into a 2x2 grid
      graph = iD.actionDivide('w1', mockProjection)(graph, null, { short_length: 2, long_length: 2 });

      expect(graph.entity('w1').nodes).toStrictEqual(['A', 'n-1', 'n-2', 'n-3', 'A']);
      expect(graph.entity('w-1').nodes).toStrictEqual(['n-3', 'n-2', 'n-4', 'B', 'n-3']);
      expect(graph.entity('w-2').nodes).toStrictEqual(['n-1', 'D', 'n-5', 'n-2', 'n-1']);
      expect(graph.entity('w-3').nodes).toStrictEqual(['n-2', 'n-5', 'C', 'n-4', 'n-2']);
      expect(graph.entity('w2').nodes).toStrictEqual(afterNodes);
    });
  });
});

describe('translateToOrigin', () => {
  it('sets the uppermost point to 0 and translates everything', () => {
    const coords: Vec2[][] = [[[1, 2], [2, 2], [3, 9]]];
    expect(translateToOrigin()(coords)).toStrictEqual([[[0, 0], [1, 0], [2, 7]]]);
  });

  it('works with a custom origin', () => {
    const coords: Vec2[][] = [[[1, 2], [2, 2], [3, 9]]];
    expect(translateToOrigin([4, 4])(coords)).toStrictEqual([[[4, 4], [5, 4], [6, 11]]]);
  });
});


describe('scaleToBottomRight', () => {
  it('scales the shape to fit the container', () => {
    const coords: Vec2[][] = [[[0, 0], [1, 0], [2, 7]]];
    expect(scaleToBottomRight([10, 15])(coords)).toStrictEqual([[[0, 0], [2.142857142857143, 0], [4.285714285714286, 15]]]);
  });
});
