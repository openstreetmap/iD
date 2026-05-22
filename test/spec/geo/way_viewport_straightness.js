describe('geoPolylineStraightness', () => {
    it('treats an L-shaped path as not straight enough', () => {
        const result = iD.geoPolylineStraightness([[0, 0], [200, 0], [200, 200]]);
        expect(result.isStraightEnough).to.be.false;
        expect(result.totalTurnDeg).to.be.closeTo(90, 1);
    });
});

describe('geoWayStraightnessInViewport', () => {
    /** @type {import('../../modules/geo/raw_mercator').Projection} */
    let projection;

    beforeEach(() => {
        projection = iD.geoRawMercator();
        projection.scale(256 * Math.pow(2, 19))
            .translate([100, 100])
            .clipExtent([[0, 0], [400, 400]]);
    });

    function node(id, loc) {
        return new iD.osmNode({ id, loc });
    }

    it('treats a straight visible segment as straight enough', () => {
        const a = node('a', [0, 0]);
        const b = node('b', [0.05, 0]);
        const result = iD.geoWayStraightnessInViewport(projection, [a, b], false);
        expect(result.isStraightEnough).to.be.true;
        expect(result.tortuosity).to.be.closeTo(1, 0.05);
    });

    it('treats a sharp visible bend as not straight enough', () => {
        const visible = [[100, 100], [300, 100], [300, 300]];
        const result = iD.geoPolylineStraightness(visible);
        expect(result.isStraightEnough).to.be.false;
        expect(result.maxTurnDeg).to.be.above(40);
    });

    it('treats a visible circular arc as not straight enough', () => {
        const visible = [];
        const steps = 16;
        const radius = 80;
        for (let i = 0; i <= steps; i++) {
            const t = (i / steps) * Math.PI;
            visible.push([
                200 + radius * Math.cos(t),
                200 + radius * Math.sin(t)
            ]);
        }
        const result = iD.geoPolylineStraightness(visible);
        expect(result.isStraightEnough).to.be.false;
        expect(result.totalTurnDeg).to.be.above(90);
    });

    it('only measures the portion inside the viewport', () => {
        const points = [[50, 200], [200, 200], [350, 200]];
        const visible = iD.geoVisiblePolylineInExtent(
            points,
            iD.geoExtent([[150, 0], [250, 400]]),
            false
        );
        expect(visible).to.eql([[150, 200], [200, 200], [250, 200]]);
        expect(iD.geoPolylineStraightness(visible).isStraightEnough).to.be.true;
    });

    it('ignores geometry outside the viewport when judging curves', () => {
        const nodes = [
            node('a', [-0.05, -0.05]),
            node('b', [0, 0]),
            node('c', [0.05, 0.05])
        ];
        const center = projection([0, 0]);
        projection.clipExtent([
            [center[0] - 20, center[1] - 20],
            [center[0] + 20, center[1] + 20]
        ]);
        const result = iD.geoWayStraightnessInViewport(projection, nodes, false);
        expect(result.isStraightEnough).to.be.true;
    });
});
