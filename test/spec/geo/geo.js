describe('iD.geo - geography', function() {

    describe('geoLatToMeters', function() {
        it('0 degrees latitude is 0 meters', function() {
            expect(iD.geoLatToMeters(0)).to.eql(0);
        });
        it('1 degree latitude is approx 111 km', function() {
            expect(iD.geoLatToMeters(1)).to.be.closeTo(111319, 10);
        });
        it('-1 degree latitude is approx -111 km', function() {
            expect(iD.geoLatToMeters(-1)).to.be.closeTo(-111319, 10);
        });
    });

    describe('geoLonToMeters', function() {
        it('0 degrees longitude is 0 km', function() {
            expect(iD.geoLonToMeters(0, 0)).to.eql(0);
        });
        it('distance of 1 degree longitude varies with latitude', function() {
            expect(iD.geoLonToMeters(1,  0)).to.be.closeTo(110946, 10);
            expect(iD.geoLonToMeters(1, 15)).to.be.closeTo(107165, 10);
            expect(iD.geoLonToMeters(1, 30)).to.be.closeTo(96082, 10);
            expect(iD.geoLonToMeters(1, 45)).to.be.closeTo(78450, 10);
            expect(iD.geoLonToMeters(1, 60)).to.be.closeTo(55473, 10);
            expect(iD.geoLonToMeters(1, 75)).to.be.closeTo(28715, 10);
            expect(iD.geoLonToMeters(1, 90)).to.eql(0);
        });
        it('distance of -1 degree longitude varies with latitude', function() {
            expect(iD.geoLonToMeters(-1,  -0)).to.be.closeTo(-110946, 10);
            expect(iD.geoLonToMeters(-1, -15)).to.be.closeTo(-107165, 10);
            expect(iD.geoLonToMeters(-1, -30)).to.be.closeTo(-96082, 10);
            expect(iD.geoLonToMeters(-1, -45)).to.be.closeTo(-78450, 10);
            expect(iD.geoLonToMeters(-1, -60)).to.be.closeTo(-55473, 10);
            expect(iD.geoLonToMeters(-1, -75)).to.be.closeTo(-28715, 10);
            expect(iD.geoLonToMeters(-1, -90)).to.eql(0);
        });
    });

    describe('geoMetersToLat', function() {
        it('0 meters is 0 degrees latitude', function() {
            expect(iD.geoMetersToLat(0)).to.eql(0);
        });
        it('111 km is approx 1 degree latitude', function() {
            expect(iD.geoMetersToLat(111319)).to.be.closeTo(1, 0.0001);
        });
        it('-111 km is approx -1 degree latitude', function() {
            expect(iD.geoMetersToLat(-111319)).to.be.closeTo(-1, 0.0001);
        });
    });

    describe('geoMetersToLon', function() {
        it('0 meters is 0 degrees longitude', function() {
            expect(iD.geoMetersToLon(0, 0)).to.eql(0);
        });
        it('distance of 1 degree longitude varies with latitude', function() {
            expect(iD.geoMetersToLon(110946,  0)).to.be.closeTo(1, 1e-4);
            expect(iD.geoMetersToLon(107165, 15)).to.be.closeTo(1, 1e-4);
            expect(iD.geoMetersToLon(96082,  30)).to.be.closeTo(1, 1e-4);
            expect(iD.geoMetersToLon(78450,  45)).to.be.closeTo(1, 1e-4);
            expect(iD.geoMetersToLon(55473,  60)).to.be.closeTo(1, 1e-4);
            expect(iD.geoMetersToLon(28715,  75)).to.be.closeTo(1, 1e-4);
            expect(iD.geoMetersToLon(1, 90)).to.eql(0);
        });
        it('distance of -1 degree longitude varies with latitude', function() {
            expect(iD.geoMetersToLon(-110946,  -0)).to.be.closeTo(-1, 1e-4);
            expect(iD.geoMetersToLon(-107165, -15)).to.be.closeTo(-1, 1e-4);
            expect(iD.geoMetersToLon(-96082,  -30)).to.be.closeTo(-1, 1e-4);
            expect(iD.geoMetersToLon(-78450,  -45)).to.be.closeTo(-1, 1e-4);
            expect(iD.geoMetersToLon(-55473,  -60)).to.be.closeTo(-1, 1e-4);
            expect(iD.geoMetersToLon(-28715,  -75)).to.be.closeTo(-1, 1e-4);
            expect(iD.geoMetersToLon(-1, -90)).to.eql(0);
        });
    });

    describe('geoOffsetToMeters', function() {
        it('[0, 0] pixel offset is [0, -0] meter offset', function() {
            var meters = iD.geoOffsetToMeters([0, 0]);
            expect(meters[0]).to.eql(0);
            expect(meters[1]).to.eql(-0);
        });
        it('[0.00064, -0.00064] pixel offset is roughly [100, 100] meter offset', function() {
            var meters = iD.geoOffsetToMeters([0.00064, -0.00064]);
            expect(meters[0]).to.be.within(99.5, 100.5);
            expect(meters[1]).to.be.within(99.5, 100.5);
        });
    });

    describe('geoMetersToOffset', function() {
        it('[0, 0] meter offset is [0, -0] pixel offset', function() {
            var offset = iD.geoMetersToOffset([0, 0]);
            expect(offset[0]).to.eql(0);
            expect(offset[1]).to.eql(-0);
        });
        it('[100, 100] meter offset is roughly [0.00064, -0.00064] pixel offset', function() {
            var offset = iD.geoMetersToOffset([100, 100]);
            expect(offset[0]).to.be.within(0.000635, 0.000645);
            expect(offset[1]).to.be.within(-0.000645, -0.000635);
        });
    });

    describe('geoSphericalDistance', function() {
        it('distance between two same points is zero', function() {
            var a = [0, 0];
            var b = [0, 0];
            expect(iD.geoSphericalDistance(a, b)).to.eql(0);
        });
        it('a straight 1 degree line at the equator is approximately 111 km', function() {
            var a = [0, 0];
            var b = [1, 0];
            expect(iD.geoSphericalDistance(a, b)).to.be.closeTo(110946, 10);
        });
        it('a pythagorean triangle is (nearly) right', function() {
            var a = [0, 0];
            var b = [4, 3];
            expect(iD.geoSphericalDistance(a, b)).to.be.closeTo(555282, 10);
        });
        it('east-west distances at high latitude are shorter', function() {
            var a = [0, 60];
            var b = [1, 60];
            expect(iD.geoSphericalDistance(a, b)).to.be.closeTo(55473, 10);
        });
        it('north-south distances at high latitude are not shorter', function() {
            var a = [0, 60];
            var b = [0, 61];
            expect(iD.geoSphericalDistance(a, b)).to.be.closeTo(111319, 10);
        });
    });

    describe('geoZoomToScale', function() {
        it('converts from zoom to projection scale (tileSize = 256)', function() {
            expect(iD.geoZoomToScale(17)).to.be.closeTo(5340353.715440872, 1e-6);
        });
        it('converts from zoom to projection scale (tileSize = 512)', function() {
            expect(iD.geoZoomToScale(17, 512)).to.be.closeTo(10680707.430881744, 1e-6);
        });
    });

    describe('geoScaleToZoom', function() {
        it('converts from projection scale to zoom (tileSize = 256)', function() {
            expect(iD.geoScaleToZoom(5340353.715440872)).to.be.closeTo(17, 1e-6);
        });
        it('converts from projection scale to zoom (tileSize = 512)', function() {
            expect(iD.geoScaleToZoom(10680707.430881744, 512)).to.be.closeTo(17, 1e-6);
        });
    });

});
