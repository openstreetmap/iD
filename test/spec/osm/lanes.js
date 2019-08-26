describe('iD.Lanes', function() {

    describe('default lane tags', function() {

        describe('motorway', function() {

            it('returns 2 lanes for highway=motorway', function() {
                expect(iD.osmWay({tags: { highway: 'motorway' }}).lanes().metadata.count, 'motorway lanes')
                    .to.eql(2);
                expect(iD.osmWay({tags: { highway: 'motorway', oneway: 'yes' }}).lanes().metadata.count, 'motorway lanes')
                    .to.eql(2);
            });

            it('returns 4 lanes for highway=motorway and oneway=no', function() {
                expect(iD.osmWay({tags: { highway: 'motorway', oneway: 'no' }}).lanes().metadata.count, 'motorway lanes')
                    .to.eql(4);
            });

            it('returns 2 lanes for highway=motorway_link', function() {
                expect(iD.osmWay({tags: { highway: 'motorway_link' }}).lanes().metadata.count, 'motorway_link lanes')
                    .to.eql(2);
                expect(iD.osmWay({tags: { highway: 'motorway_link', oneway: 'no' }}).lanes().metadata.count, 'motorway_link lanes')
                    .to.eql(2);
            });

            it('returns 1 lane for highway=motorway_link and oneway=yes', function() {
                expect(iD.osmWay({tags: { highway: 'motorway_link', oneway: 'yes' }}).lanes().metadata.count, 'motorway_link lanes')
                    .to.eql(1);
            });
        });

        describe('trunk', function() {

            it('returns 4 lanes for highway=trunk', function() {
                expect(iD.osmWay({tags: { highway: 'trunk' }}).lanes().metadata.count, 'trunk lanes')
                    .to.eql(4);
                expect(iD.osmWay({tags: { highway: 'trunk', oneway: 'no' }}).lanes().metadata.count, 'trunk lanes')
                    .to.eql(4);
            });

            it('returns 2 lanes for highway=trunk and oneway=yes', function() {
                expect(iD.osmWay({tags: { highway: 'trunk', oneway: 'yes' }}).lanes().metadata.count, 'trunk lanes')
                    .to.eql(2);
            });

            it('returns 2 lanes for highway=trunk_link', function() {
                expect(iD.osmWay({tags: { highway: 'trunk_link' }}).lanes().metadata.count, 'trunk_link lanes')
                    .to.eql(2);
                expect(iD.osmWay({tags: { highway: 'trunk_link', oneway: 'no' }}).lanes().metadata.count, 'trunk_link lanes')
                    .to.eql(2);
            });

            it('returns 1 lane for highway=trunk_link and oneway=yes', function() {
                expect(iD.osmWay({tags: { highway: 'trunk_link', oneway: 'yes' }}).lanes().metadata.count, 'trunk_link lanes')
                    .to.eql(1);
            });
        });

        describe('primary', function() {

            it('returns 2 lanes for highway=primary', function() {
                expect(iD.osmWay({tags: { highway: 'primary' }}).lanes().metadata.count, 'primary lanes')
                    .to.eql(2);
                expect(iD.osmWay({tags: { highway: 'primary', oneway: 'no' }}).lanes().metadata.count, 'primary lanes')
                    .to.eql(2);
            });

            it('returns 1 lane for highway=primary and oneway=yes', function() {
                expect(iD.osmWay({tags: { highway: 'primary', oneway: 'yes' }}).lanes().metadata.count, 'primary lanes')
                    .to.eql(1);
            });

            it('returns 2 lanes for highway=primary_link', function() {
                expect(iD.osmWay({tags: { highway: 'primary_link' }}).lanes().metadata.count, 'primary lanes')
                    .to.eql(2);
                expect(iD.osmWay({tags: { highway: 'primary_link', oneway: 'no' }}).lanes().metadata.count, 'primary lanes')
                    .to.eql(2);
            });

            it('returns 1 lane for highway=primary_link and oneway=yes', function() {
                expect(iD.osmWay({tags: { highway: 'primary_link', oneway: 'yes' }}).lanes().metadata.count, 'primary lanes')
                    .to.eql(1);
            });
        });

        describe('seconday', function() {

            it('returns 2 lanes for highway=secondary', function() {
                expect(iD.osmWay({tags: { highway: 'secondary' }}).lanes().metadata.count, 'secondary lanes')
                    .to.eql(2);
                expect(iD.osmWay({tags: { highway: 'secondary', oneway: 'no' }}).lanes().metadata.count, 'secondary lanes')
                    .to.eql(2);
            });

            it('returns 1 lane for highway=secondary and oneway=yes', function() {
                expect(iD.osmWay({tags: { highway: 'secondary', oneway: 'yes' }}).lanes().metadata.count, 'secondary lanes')
                    .to.eql(1);
            });

            it('returns 2 lane for highway=secondary_link', function() {
                expect(iD.osmWay({tags: { highway: 'secondary_link' }}).lanes().metadata.count, 'secondary_link lanes')
                    .to.eql(2);
                expect(iD.osmWay({tags: { highway: 'secondary_link', oneway: 'no' }}).lanes().metadata.count, 'secondary_link lanes')
                    .to.eql(2);
            });

            it('returns 1 lane for highway=secondary_link and oneway=yes', function() {
                expect(iD.osmWay({tags: { highway: 'secondary_link', oneway: 'yes' }}).lanes().metadata.count, 'secondary_link lanes')
                    .to.eql(1);
            });
        });

        describe('tertiary', function() {

            it('returns 2 lanes for highway=tertiary', function() {
                expect(iD.osmWay({tags: { highway: 'tertiary' }}).lanes().metadata.count, 'tertiary lanes')
                    .to.eql(2);
                expect(iD.osmWay({tags: { highway: 'tertiary', oneway: 'no' }}).lanes().metadata.count, 'tertiary lanes')
                    .to.eql(2);
            });

            it('returns 1 lane for highway=tertiary and oneway=yes', function() {
                expect(iD.osmWay({tags: { highway: 'tertiary', oneway: 'yes' }}).lanes().metadata.count, 'tertiary lanes')
                    .to.eql(1);
            });

            it('returns 2 lane for highway=tertiary_link', function() {
                expect(iD.osmWay({tags: { highway: 'tertiary_link' }}).lanes().metadata.count, 'tertiary_link lanes')
                    .to.eql(2);
                expect(iD.osmWay({tags: { highway: 'tertiary_link', oneway: 'no' }}).lanes().metadata.count, 'tertiary_link lanes')
                    .to.eql(2);
            });

            it('returns 1 lane for highway=tertiary_link and oneway=yes', function() {
                expect(iD.osmWay({tags: { highway: 'tertiary_link', oneway: 'yes' }}).lanes().metadata.count, 'tertiary_link lanes')
                    .to.eql(1);
            });
        });

        describe('residential', function() {

            it('returns 2 lanes for highway=residential', function() {
                expect(iD.osmWay({tags: { highway: 'residential' }}).lanes().metadata.count, 'residential lanes')
                    .to.eql(2);
                expect(iD.osmWay({tags: { highway: 'residential', oneway: 'no' }}).lanes().metadata.count, 'residential lanes')
                    .to.eql(2);
            });

            it('returns 1 lane for highway=residential and oneway=yes', function() {
                expect(iD.osmWay({tags: { highway: 'residential', oneway: 'yes' }}).lanes().metadata.count, 'residential lanes')
                    .to.eql(1);
            });
        });

        describe('service', function() {

            it('returns 2 lanes for highway=service', function() {
                expect(iD.osmWay({tags: { highway: 'service' }}).lanes().metadata.count, 'service lanes')
                    .to.eql(2);
                expect(iD.osmWay({tags: { highway: 'service', oneway: 'no' }}).lanes().metadata.count, 'service lanes')
                    .to.eql(2);
            });

            it('returns 1 lane for highway=service and oneway=yes', function() {
                expect(iD.osmWay({tags: { highway: 'service', oneway: 'yes' }}).lanes().metadata.count, 'service lanes')
                    .to.eql(1);
            });
        });

        describe('track', function() {

            it('returns 2 lanes for highway=track', function() {
                expect(iD.osmWay({tags: { highway: 'track' }}).lanes().metadata.count, 'track lanes')
                    .to.eql(2);
                expect(iD.osmWay({tags: { highway: 'track', oneway: 'no' }}).lanes().metadata.count, 'track lanes')
                    .to.eql(2);
            });

            it('returns 1 lane for highway=track and oneway=yes', function() {
                expect(iD.osmWay({tags: { highway: 'track', oneway: 'yes' }}).lanes().metadata.count, 'track lanes')
                    .to.eql(1);
            });
        });

        describe('path', function() {

            it('returns 2 lanes for highway=path', function() {
                expect(iD.osmWay({tags: { highway: 'path' }}).lanes().metadata.count, 'path lanes')
                    .to.eql(2);
                expect(iD.osmWay({tags: { highway: 'path', oneway: 'no' }}).lanes().metadata.count, 'path lanes')
                    .to.eql(2);
            });

            it('returns 1 lane for highway=path and oneway=yes', function() {
                expect(iD.osmWay({tags: { highway: 'path', oneway: 'yes' }}).lanes().metadata.count, 'path lanes')
                    .to.eql(1);
            });
        });
    });

    describe('oneway tags', function() {
        it('returns correctly oneway when tagged as oneway', function() {
            expect(iD.osmWay({tags: { highway: 'residential', oneway: 'yes' }}).lanes().metadata.oneway, 'residential lanes')
                .to.be.true;
            expect(iD.osmWay({tags: { highway: 'residential', oneway: 'no' }}).lanes().metadata.oneway, 'residential lanes')
                .to.be.false;
        });
    });

    describe('lane direction', function() {

        it('returns correctly the lane:forward and lane:backward count', function() {
            expect(iD.osmWay({tags: { highway: 'residential', lanes: 2, 'lanes:forward': 1, 'lanes:backward': 1 }}).lanes().metadata, 'residential lanes')
                .to.include({
                    count: 2,
                    oneway: false,
                    forward: 1,
                    backward: 1,
                    bothways: 0
                });
            expect(iD.osmWay({tags: { highway: 'residential', lanes: 4, 'lanes:forward': 3, 'lanes:backward': 1 }}).lanes().metadata, 'residential lanes')
                .to.include({
                    count: 4,
                    oneway: false,
                    forward: 3,
                    backward: 1,
                    bothways: 0
                });
        });

        it('returns correctly the count if erroneous values are supplied', function() {
            expect(iD.osmWay({tags: { highway: 'trunk', lanes: 2, 'lanes:forward': 3 }}).lanes().metadata, 'trunk lanes')
                .to.include({
                    count: 2,
                    oneway: false,
                    forward: 2,
                    backward: 0,
                    bothways: 0
                });
        });

        it('returns correctly forward count when oneway=yes', function() {
            expect(iD.osmWay({tags: { highway: 'trunk', lanes: 2, oneway: 'yes' }}).lanes().metadata, 'trunk lanes')
                .to.include({
                    count: 2,
                    oneway: true,
                    forward: 2,
                    backward: 0,
                    bothways: 0
                });
        });

        it('returns correctly backward count the when oneway=-1', function() {
            expect(iD.osmWay({tags: { highway: 'primary', lanes: 4, oneway: '-1' }}).lanes().metadata, 'primary lanes')
                .to.include({
                    count: 4,
                    oneway: true,
                    backward: 4,
                    forward: 0,
                    bothways: 0
                });
        });

        it('skips provided lanes:forward value when oneway=yes', function() {
            expect(iD.osmWay({tags: { highway: 'trunk', lanes: 2, oneway: 'yes', 'lanes:forward': 1 }}).lanes().metadata, 'trunk lanes')
                .to.include({
                    count: 2,
                    oneway: true,
                    forward: 2,
                    backward: 0,
                    bothways: 0
                });
        });

        it('skips provided lanes:backward value when oneway=yes', function() {
            expect(iD.osmWay({tags: { highway: 'trunk', lanes: 2, oneway: 'yes', 'lanes:backward': 1 }}).lanes().metadata, 'trunk lanes')
                .to.include({
                    count: 2,
                    oneway: true,
                    forward: 2,
                    backward: 0,
                    bothways: 0
                });
        });

        it('returns correctly forward count if only backward is supplied', function() {
            expect(iD.osmWay({tags: { highway: 'residential', lanes: 3, 'lanes:backward': 1, }}).lanes().metadata, 'residential lanes')
                .to.include({
                    count: 3,
                    oneway: false,
                    forward: 2,
                    backward: 1,
                    bothways: 0
                });
            expect(iD.osmWay({tags: { highway: 'residential', lanes: 4, 'lanes:backward': 3, }}).lanes().metadata, 'residential lanes')
                .to.include({
                    count: 4,
                    oneway: false,
                    forward: 1,
                    backward: 3,
                    bothways: 0
                });
        });

        it('returns correctly backward count if only forward is supplied', function() {
            expect(iD.osmWay({tags: { highway: 'residential', lanes: 3, 'lanes:forward': 1, }}).lanes().metadata, 'residential lanes')
                .to.include({
                    count: 3,
                    oneway: false,
                    forward: 1,
                    backward: 2,
                    bothways: 0
                });
            expect(iD.osmWay({tags: { highway: 'residential', lanes: 2, 'lanes:forward': 1, }}).lanes().metadata, 'residential lanes')
                .to.include({
                    count: 2,
                    oneway: false,
                    forward: 1,
                    backward: 1,
                    bothways: 0
                });
        });

        it('returns correctly backward count if forward and both_ways are supplied', function() {
            expect(iD.osmWay({tags: { highway: 'residential', lanes: 3, 'lanes:forward': 1, 'lanes:both_ways': 1 }}).lanes().metadata, 'residential lanes')
                .to.include({
                    count: 3,
                    oneway: false,
                    forward: 1,
                    backward: 1,
                    bothways: 1
                });
            expect(iD.osmWay({tags: { highway: 'residential', lanes: 5, 'lanes:forward': 1, 'lanes:both_ways': 1 }}).lanes().metadata, 'residential lanes')
                .to.include({
                    count: 5,
                    oneway: false,
                    forward: 1,
                    backward: 3,
                    bothways: 1
                });
        });

        it('returns correctly forward count if backward and both_ways are supplied', function() {
            expect(iD.osmWay({tags: { highway: 'residential', lanes: 3, 'lanes:backward': 1, 'lanes:both_ways': 1 }}).lanes().metadata, 'residential lanes')
                .to.include({
                    count: 3,
                    oneway: false,
                    forward: 1,
                    backward: 1,
                    bothways: 1
                });
            expect(iD.osmWay({tags: { highway: 'residential', lanes: 5, 'lanes:backward': 1, 'lanes:both_ways': 1 }}).lanes().metadata, 'residential lanes')
                .to.include({
                    count: 5,
                    oneway: false,
                    forward: 3,
                    backward: 1,
                    bothways: 1
                });
        });

        it('returns correctly the lane:both_ways count as 1', function() {
            expect(iD.osmWay({tags: { highway: 'residential', lanes: 2, 'lanes:forward': 1, 'lanes:both_ways': 1 }}).lanes().metadata, 'residential lanes')
                .to.include({
                    count: 2,
                    oneway: false,
                    forward: 1,
                    backward: 0,
                    bothways: 1
                });
        });

        it('returns correctly when lane:both_ways>1', function() {
            expect(iD.osmWay({tags: { highway: 'residential', lanes: 5, 'lanes:forward': 2, 'lanes:both_ways': 2, 'lanes:backward': 2 }}).lanes().metadata, 'residential lanes')
                .to.include({
                    count: 5,
                    oneway: false,
                    forward: 2,
                    backward: 2,
                    bothways: 1
                });
        });

        it('returns correctly when lane:both_ways is 0 or Not a Number', function() {
            expect(iD.osmWay({tags: { highway: 'residential', lanes: 5, 'lanes:forward': 2, 'lanes:both_ways': 0, 'lanes:backward': 3 }}).lanes().metadata, 'residential lanes')
                .to.include({
                    count: 5,
                    oneway: false,
                    forward: 2,
                    backward: 3,
                    bothways: 0
                });
            expect(iD.osmWay({tags: { highway: 'residential', lanes: 2, 'lanes:forward': 1, 'lanes:both_ways': 'none' }}).lanes().metadata, 'residential lanes')
                .to.include({
                    count: 2,
                    oneway: false,
                    forward: 1,
                    backward: 1,
                    bothways: 0
                });
        });

    });

    describe.skip('lanes array', function() {
      it('should have correct number of direction elements', function() {
        var lanes = iD.osmWay({tags: { highway: 'residential', lanes: 5, 'lanes:forward': 2, 'lanes:both_ways': 0, 'lanes:backward': 3 }}).lanes().lanes;
        var forward = lanes.filter(function(l) {
          return l.direction === 'forward';
        });
        var backward = lanes.filter(function(l) {
          return l.direction === 'backward';
        });
        var bothways = lanes.filter(function(l) {
          return l.direction === 'bothways';
        });
        expect(forward.length).to.eql(2);
        expect(backward.length).to.eql(3);
        expect(bothways.length).to.eql(0);

      });
      it('should have corrent number of direction elements', function() {
        var lanes = iD.osmWay({tags: { highway: 'residential', lanes: 5, 'lanes:backward': 1, 'lanes:both_ways': 1 }}).lanes().lanes;
        var forward = lanes.filter(function(l) {
          return l.direction === 'forward';
        });
        var backward = lanes.filter(function(l) {
          return l.direction === 'backward';
        });
        var bothways = lanes.filter(function(l) {
          return l.direction === 'bothways';
        });
        expect(forward.length).to.eql(3);
        expect(backward.length).to.eql(1);
        expect(bothways.length).to.eql(1);
      });
    });

    describe('turn lanes', function() {
        it('returns correctly when oneway=yes', function() {
            var metadata = iD.osmWay({
                tags: {
                    highway: 'trunk',
                    oneway: 'yes',
                    'turn:lanes': 'none|slight_right'
                }
            }).lanes().metadata;
            expect(metadata.turnLanes.unspecified)
                .to.deep.equal([
                    ['none'], ['slight_right']
                ]);
        });

        it('returns correctly when oneway=yes and lanes=2', function() {
            var metadata = iD.osmWay({
                tags: {
                    highway: 'tertiary',
                    oneway: 'yes',
                    lanes: '2',
                    'turn:lanes': 'none|slight_right'
                }
            }).lanes().metadata;

            expect(metadata.turnLanes.unspecified)
                .to.deep.equal([
                    ['none'], ['slight_right']
                ]);
        });

        it('returns correctly when lanes=5 and both_ways=1', function() {
            var metadata = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 5,
                    'lanes:forward': 1,
                    'lanes:both_ways': 1,
                    'turn:lanes:forward': 'slight_left',
                    'turn:lanes:backward': 'none|through|through;slight_right',
                }
            }).lanes().metadata;
            expect(metadata.turnLanes.forward)
                .to.deep.equal([
                    ['slight_left']
                ]);
            expect(metadata.turnLanes.backward)
                .to.deep.equal([
                    ['none'], ['through'], ['through', 'slight_right']
                ]);
        });

        it('returns correctly when multiple values are present in a lane and oneway=yes', function() {
            var lanesData = iD.osmWay({
                tags: {
                    highway: 'tertiary',
                    lanes: 5,
                    oneway: 'yes',
                    'turn:lanes': 'slight_left;reverse;left|slight_left;left;through|through|none|through;right',
                }
            }).lanes();

            expect(lanesData.metadata.turnLanes.unspecified)
                .to.deep.equal([
                    ['slight_left', 'reverse', 'left'],
                    ['slight_left', 'left', 'through'],
                    ['through'],
                    ['none'],
                    ['through', 'right']
                ]);
        });

        it('returns correctly when multiple values are present in a lane and oneway=no', function() {
            var lanesData = iD.osmWay({
                tags: {
                    highway: 'tertiary',
                    lanes: 5,
                    oneway: 'no',
                    'lanes:forward': 3,
                    'lanes:backward': 2,
                    'turn:lanes:forward': 'slight_left;reverse;left|slight_left;left;through|through',
                    'turn:lanes:backward': 'none|through;left'
                }
            }).lanes();
            expect(lanesData.metadata.turnLanes.forward)
                .to.deep.equal([
                    ['slight_left', 'reverse', 'left'],
                    ['slight_left', 'left', 'through'],
                    ['through']
                ]);
            expect(lanesData.metadata.turnLanes.backward)
                .to.deep.equal([
                    ['none'],
                    ['through', 'left']
                ]);
        });

        it('returns unknown for every invalid value in turn:lanes', function() {
            var metadata = iD.osmWay({
                tags: {
                    highway: 'tertiary',
                    lanes: 3,
                    oneway: 'yes',
                    'turn:lanes': '||straight;NO_LEFT',
                }
            }).lanes().metadata;
            expect(metadata.turnLanes.unspecified)
                .to.deep.equal([
                    ['none'], ['none'], ['unknown', 'unknown']
                ]);
        });

        it('returns unknown for every invalid value in turn:lanes:forward & turn:lanes:backward', function() {
            var metadata = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 5,
                    'lanes:forward': 1,
                    'lanes:both_ways': 1,
                    'turn:lanes:forward': 'sligh_left',
                    'turn:lanes:backward': 'none|through|though;slight_right',
                }
            }).lanes().metadata;
            expect(metadata.turnLanes.forward)
                .to.deep.equal([
                    ['unknown']
                ]);
            expect(metadata.turnLanes.backward)
                .to.deep.equal([
                    ['none'], ['through'], ['unknown', 'slight_right']
                ]);
        });

        it.skip('fills with [\'unknown\'] when given turn:lanes are less than lanes count', function() {
            var metadata = iD.osmWay({
                tags: {
                    highway: 'tertiary',
                    lanes: 5,
                    oneway: 'yes',
                    'turn:lanes': 'slight_left|',
                }
            }).lanes().metadata;

            expect(metadata.turnLanes.unspecified)
                .to.deep.equal([
                    ['slight_left'], ['none']
                ]);
        });

        it.skip('fills with [\'unknown\'] when given turn:lanes:forward are less than lanes forward count', function() {
            var metadata = iD.osmWay({
                tags: {
                    highway: 'tertiary',
                    lanes: 5,
                    oneway: 'no',
                    'lanes:forward': 3,
                    'turn:lanes:forward': 'slight_left',
                    'turn:lanes:backward': 'through',
                }
            }).lanes().metadata;

            expect(metadata.turnLanes.forward)
                .to.deep.equal([
                    ['slight_left'], ['unknown'], ['unknown']
                ]);
            expect(metadata.turnLanes.backward)
                .to.deep.equal([
                    ['through'], ['unknown']
                ]);
        });

        it.skip('clips when turn lane information is more than lane count', function() {
            var metadata = iD.osmWay({
                tags: {
                    highway: 'tertiary',
                    lanes: 2,
                    oneway: 'yes',
                    'turn:lanes': 'through|through;slight_right|slight_right',
                }
            }).lanes().metadata;

            expect(metadata.turnLanes)
                .to.deep.equal([
                    ['through'], ['through', 'slight_right']
                ]);
        });

        it('turnLanes is undefined when not present', function() {
            var metadata = iD.osmWay({
                tags: {
                    highway: 'tertiary',
                    lanes: 2,
                    oneway: 'yes'
                }
            }).lanes().metadata;

            expect(metadata.turnLanes.unspecified)
                .to.equal(undefined);
            expect(metadata.turnLanes.forward)
                .to.equal(undefined);
            expect(metadata.turnLanes.backward)
                .to.equal(undefined);
        });

        it('turnLanes.forward and turnLanes.backward are both undefined when both are not provided', function() {
            var metadata = iD.osmWay({
                tags: {
                    highway: 'tertiary',
                    lanes: 2,
                    oneway: 'yes',
                    'turn:lanes': 'through|through;slight_right',
                }
            }).lanes().metadata;

            expect(metadata.turnLanes.unspecified)
                .to.deep.equal([['through'], ['through', 'slight_right']]);
            expect(metadata.turnLanes.forward)
                .to.equal(undefined);
            expect(metadata.turnLanes.backward)
                .to.equal(undefined);
        });

        it('parses turnLane correctly when lanes:both_ways=1', function() {
            var lanes = iD.osmWay({
                tags: {
                    highway: 'tertiary',
                    lanes: 5,
                    oneway: 'no',
                    'lanes:forward': 3,
                    'lanes:both_ways': 1,
                    'lanes:backward': 1,
                    'turn:lanes:backward': 'slight_right',
                    'turn:lanes:forward': 'slight_left||',
                }
            }).lanes();
            expect(lanes.metadata.turnLanes.backward)
                .to.deep.equal([['slight_right']]);
            expect(lanes.metadata.turnLanes.forward)
                .to.deep.equal([['slight_left'], ['none'], ['none']]);
        });

        it('parses turnLane correctly when lanes:both_ways=1 & lanes:forward < lanes:backward', function() {
            var lanes = iD.osmWay({
                tags: {
                    highway: 'tertiary',
                    lanes: 5,
                    oneway: 'no',
                    'lanes:forward': 1,
                    'lanes:both_ways': 1,
                    'lanes:backward': 3,
                    'turn:lanes:forward': 'through',
                    'turn:lanes:backward': 'slight_left||',
                }
            }).lanes();
            expect(lanes.metadata.turnLanes.forward)
                .to.deep.equal([['through']]);
            expect(lanes.metadata.turnLanes.backward)
                .to.deep.equal([['slight_left'], ['none'], ['none']]);
        });

        it('parses correctly when turn:lanes= ||x', function() {
            var metadata = iD.osmWay({
                tags: {
                    highway: 'tertiary',
                    lanes: 3,
                    oneway: 'yes',
                    'turn:lanes': '||through;slight_right',
                }
            }).lanes().metadata;

            expect(metadata.turnLanes.unspecified)
                .to.deep.equal([['none'], ['none'], ['through', 'slight_right']]);
        });

        it('parses correctly when turn:lanes= |x|', function() {
            var metadata = iD.osmWay({
                tags: {
                    highway: 'tertiary',
                    lanes: 5,
                    'turn:lanes': '|through|',
                }
            }).lanes().metadata;

            expect(metadata.turnLanes.unspecified)
                .to.deep.equal([['none'], ['through'], ['none']]);
        });

        it('parses correctly when turn:lanes:forward= ||x', function() {
            var metadata = iD.osmWay({
                tags: {
                    highway: 'tertiary',
                    lanes: 4,
                    oneway: 'no',
                    'lanes:forward': 3,
                    'lanes:backward': 1,
                    'turn:lanes:forward': '||through;slight_right',
                    'turn:lanes:backward': 'none',
                }
            }).lanes().metadata;

            expect(metadata.turnLanes.forward)
                .to.deep.equal([['none'], ['none'], ['through', 'slight_right']]);
            expect(metadata.turnLanes.backward)
                .to.deep.equal([['none']]);
        });

        it('parses correctly when turn:lanes:backward= |', function() {
            var metadata = iD.osmWay({
                tags: {
                    highway: 'tertiary',
                    lanes: 5,
                    oneway: 'no',
                    'lanes:forward': 3,
                    'lanes:backward': 2,
                    'turn:lanes:backward': '|',
                    'turn:lanes:forward': 'slight_left||',
                }
            }).lanes().metadata;

            expect(metadata.turnLanes.forward)
                .to.deep.equal([['slight_left'], ['none'], ['none']]);
            expect(metadata.turnLanes.backward)
                .to.deep.equal([['none'], ['none']]);
        });

        it('fills lanes.unspecified with key \'turnLane\' correctly', function() {
            var lanes = iD.osmWay({
                tags: {
                    highway: 'tertiary',
                    lanes: 5,
                    oneway: 'yes',
                    'turn:lanes': 'slight_left||through|through;slight_right|slight_right'
                }
            }).lanes().lanes;
            var turnLanesUnspecified = lanes.unspecified.map(function(l) { return l.turnLane; });
            expect(turnLanesUnspecified).to.deep.equal([
                ['slight_left'], ['none'], ['through'], ['through', 'slight_right'], ['slight_right']
            ]);
            expect(lanes.forward).to.deep.equal([]);
            expect(lanes.backward).to.deep.equal([]);
        });

        it('fills lanes.forward & lanes.backward with key \'turnLane\' correctly', function() {
            var lanes = iD.osmWay({
                tags: {
                    highway: 'tertiary',
                    lanes: 5,
                    'lanes:forward': 3,
                    'lanes:backward': 2,
                    'turn:lanes:backward': 'none|slight_right',
                    'turn:lanes:forward': 'slight_left||',
                }
            }).lanes().lanes;
            expect(lanes.unspecified).to.deep.equal([]);
            var turnLanesForward = lanes.forward.map(function(l) { return l.turnLane; });
            var turnLanesBackward = lanes.backward.map(function(l) { return l.turnLane; });
            expect(turnLanesForward).to.deep.equal([
                ['slight_left'], ['none'], ['none']
            ]);
            expect(turnLanesBackward).to.deep.equal([
                ['none'], ['slight_right']
            ]);
        });
    });

    describe('maxspeed', function() {
        it('should parse maxspeed without any units correctly', function() {
            var maxspeed = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 5,
                    'maxspeed': '70'
                }
            }).lanes().metadata.maxspeed;
            expect(maxspeed).to.equal(70);
            maxspeed = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 5,
                    'maxspeed': 70
                }
            }).lanes().metadata.maxspeed;
            expect(maxspeed).to.equal(70);
        });

        it('should parse maxspeed with km/h correctly', function() {
            var maxspeed = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 5,
                    'maxspeed': '70 km/h'
                }
            }).lanes().metadata.maxspeed;
            expect(maxspeed).to.equal(70);
        });

        it('should parse maxspeed with kmh correctly', function() {
            var maxspeed = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 5,
                    'maxspeed': '70kmh'
                }
            }).lanes().metadata.maxspeed;
            expect(maxspeed).to.equal(70);
        });

        it('should parse maxspeed with kph correctly', function() {
            var maxspeed = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 5,
                    'maxspeed': '70 kph'
                }
            }).lanes().metadata.maxspeed;
            expect(maxspeed).to.equal(70);
        });

        it('should parse maxspeed with mph correctly', function() {
            var maxspeed = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 5,
                    'maxspeed': '70mph'
                }
            }).lanes().metadata.maxspeed;
            expect(maxspeed).to.equal(70);
        });

        it('should parse maxspeed with knots correctly', function() {
            var maxspeed = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 5,
                    'maxspeed': '50knots'
                }
            }).lanes().metadata.maxspeed;
            expect(maxspeed).to.equal(50);
        });

        it('should return undefined when incorrect maxspeed unit provided ', function() {
            var maxspeed = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 5,
                    'maxspeed': '70km'
                }
            }).lanes().metadata.maxspeed;
            expect(maxspeed).to.equal(undefined);
        });

        it('should return undefined when incorrect maxspeed value provided ', function() {
            var maxspeed = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 5,
                    'maxspeed': 'a70knots'
                }
            }).lanes().metadata.maxspeed;
            expect(maxspeed).to.equal(undefined);
        });

        it('should return undefined when maxspeed not provided ', function() {
            var maxspeed = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 5,
                }
            }).lanes().metadata.maxspeed;
            expect(maxspeed).to.equal(undefined);
        });
    });

    describe('maxspeed:lanes', function() {

        it('should parse correctly', function() {
            var maxspeedLanes = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 5,
                    'maxspeed:lanes': '30|40|40|40|40'
                }
            }).lanes().metadata.maxspeedLanes.unspecified;
            expect(maxspeedLanes).to.deep.equal([
                30, 40, 40, 40, 40
            ]);
        });

        it('should parse maxspeed:lanes:forward/backward correctly', function() {
            var metadata = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 5,
                    maxspeed: 30,
                    'lanes:forward': 4,
                    'lanes:backward': 1,
                    'maxspeed:lanes:forward': '30|40|40|40',
                    'maxspeed:lanes:backward': '30'
                }
            }).lanes().metadata;
            expect(metadata.maxspeedLanes.forward).to.deep.equal([
                null, 40, 40, 40
            ]);
            expect(metadata.maxspeedLanes.backward).to.deep.equal([
                null
            ]);
        });

        it('should parse correctly when some values maxspeed:lanes are implied by x||y notation', function() {
            var maxspeedLanes = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 4,
                    maxspeed: '40kmh',
                    'maxspeed:lanes': '30|||40'
                }
            }).lanes().metadata.maxspeedLanes;
            expect(maxspeedLanes.unspecified).to.deep.equal([
                30, null, null, null
            ]);
        });

        it('should parse correctly when some values maxspeed:lanes are implied by x||| notation', function() {
            var lanes = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 5,
                    'lanes:forward': 1,
                    'lanes:both_ways': 1,
                    'turn:lanes:forward': 'slight_left',
                    'turn:lanes:backward': 'none|through|through;slight_right',
                    maxspeed: '60kmh',
                    'maxspeed:lanes': '30|||'
                }
            }).lanes();
            expect(lanes.metadata.maxspeedLanes.unspecified).to.deep.equal([
                30, null, null, null
            ]);
        });

        it('should return none for each maxspeed:lanes which equals maxspeed', function() {
            var maxspeedLanes = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 5,
                    maxspeed: '40kmh',
                    'maxspeed:lanes': '30|40|40|40|40'
                }
            }).lanes().metadata.maxspeedLanes;
            expect(maxspeedLanes.unspecified).to.deep.equal([
                30, null, null, null, null
            ]);
            maxspeedLanes = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 5,
                    maxspeed: '50kmh',
                    'maxspeed:lanes': '30|40|40|40|40'
                }
            }).lanes().metadata.maxspeedLanes;
            expect(maxspeedLanes.unspecified).to.deep.equal([
                30, 40, 40, 40, 40
            ]);
            maxspeedLanes = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 5,
                    maxspeed: '30knots',
                    'maxspeed:lanes': '30|40|40|40|40'
                }
            }).lanes().metadata.maxspeedLanes;
            expect(maxspeedLanes.unspecified).to.deep.equal([
                null, 40, 40, 40, 40
            ]);
        });

        it('should return \'unknown\' for every invalid maxspeed:lane value', function() {
            var maxspeedLanes = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 5,
                    maxspeed: '30kmh',
                    'maxspeed:lanes': '30|40|fourty|40|40'
                }
            }).lanes().metadata.maxspeedLanes;
            expect(maxspeedLanes.unspecified).to.deep.equal([
                null, 40, 'unknown', 40, 40
            ]);
            maxspeedLanes = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 5,
                    maxspeed: '30kmh',
                    'maxspeed:lanes': '30|40|fourty|40|random'
                }
            }).lanes().metadata.maxspeedLanes;

            expect(maxspeedLanes.unspecified).to.deep.equal([
                null, 40, 'unknown', 40, 'unknown'
            ]);
        });

        it('should parse maxspeed when none', function() {
            var maxspeedLanes = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 5,
                    'maxspeed:lanes': '30|40|none|40|40'
                }
            }).lanes().metadata.maxspeedLanes;
            expect(maxspeedLanes.unspecified).to.deep.equal([
                30, 40, 'none', 40, 40
            ]);
        });

        it('fills lanes.unspecified with key \'maxspeed\' correctly', function() {
            var lanes = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 5,
                    maxspeed: '30kmh',
                    'maxspeed:lanes': '30|40|fourty|40|40'
                }
            }).lanes().lanes;
            var maxspeedLanes = lanes.unspecified.map(function (l) {
                return l.maxspeed;
            });
            expect(maxspeedLanes).to.deep.equal([
                null, 40, 'unknown', 40, 40
            ]);
        });
    });

    describe('bicycle lanes', function() {
        it('should parse bicycle:lanes correctly', function() {
            var lanes = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 3,
                    'lanes:bicycleway': 2,
                    'bicycleway:lanes': 'no|yes|no|designated|no',
                    maxspeed: '30kmh',
                    'turn:lanes': 'left|||through|right'
                }
            }).lanes();
            expect(lanes.metadata.bicyclewayLanes.unspecified).to.deep.equal([
                'no','yes','no', 'designated', 'no'
            ]);
            var bicyclewayLanes = lanes.lanes.unspecified.map(function(l) {
                return l.bicycleway;
            });
            expect(bicyclewayLanes).to.deep.equal([
                'no','yes','no', 'designated', 'no'
            ]);
        });

        it('should parse bicycle:lanes:forward/backward correctly', function() {
            var lanes = iD.osmWay({
                tags: {
                    highway: 'residential',
                    'lanes:forward': 4,
                    'lanes:backward': 3,
                    'turn:lanes:forward': 'left;through|left;through|through|right;through|right',
                    'bicycleway:lanes:forward': 'lane|no|no|no|no',
                    'bicycleway:lanes:backward': 'lane|no|no|no'
                }
            }).lanes();
            expect(lanes.metadata.bicyclewayLanes.forward).to.deep.equal([
                'lane','no','no', 'no', 'no'
            ]);
            expect(lanes.metadata.bicyclewayLanes.backward).to.deep.equal([
                'lane','no','no', 'no'
            ]);
            var bicyclewayLanesForward = lanes.lanes.forward.map(function(l) {
                return l.bicycleway;
            });
            expect(bicyclewayLanesForward).to.deep.equal([
                'lane','no','no', 'no', 'no'
            ]);
            var bicyclewayLanesBackward = lanes.lanes.backward.map(function(l) {
                return l.bicycleway;
            });
            expect(bicyclewayLanesBackward).to.deep.equal([
                'lane','no','no', 'no'
            ]);
        });

        it('should replace any invalid value with unknown', function() {
            var lanes = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 3,
                    maxspeed: '30kmh',
                    'bicycleway:lanes': 'no|share|no|designated|no',
                    'turn:lanes': 'left|||through|right'
                }
            }).lanes();
            expect(lanes.metadata.bicyclewayLanes.unspecified).to.deep.equal([
                'no','unknown','no', 'designated', 'no'
            ]);
            var psvLanesForward = lanes.lanes.unspecified.map(function(l) {
                return l.bicycleway;
            });
            expect(psvLanesForward).to.deep.equal([
                'no','unknown','no', 'designated', 'no'
            ]);
        });
    });

    describe('miscellaneous lanes', function() {
        it('should parse psv:lanes correctly', function() {
            var lanes = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 5,
                    maxspeed: '30kmh',
                    'psv:lanes': 'yes|no||no|no'
                }
            }).lanes();
            expect(lanes.metadata.psvLanes.unspecified).to.deep.equal([
                'yes','no','no', 'no', 'no'
            ]);
            var psvLanesForward = lanes.lanes.unspecified.map(function(l) {
                return l.psv;
            });
            expect(psvLanesForward).to.deep.equal([
                'yes','no','no', 'no', 'no'
            ]);
        });
        it('should parse psv:lanes:forward/backward correctly', function() {
            var lanes = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 5,
                    maxspeed: '30kmh',
                    'psv:lanes:forward': 'no|no|',
                    'psv:lanes:backward': 'yes|designated',
                }
            }).lanes();
            expect(lanes.metadata.psvLanes.forward).to.deep.equal([
                'no','no','no'
            ]);
            expect(lanes.metadata.psvLanes.backward).to.deep.equal([
                'yes', 'designated'
            ]);
            var psvLanesForward = lanes.lanes.forward.map(function(l) {
                return l.psv;
            });
            var psvLanesBackward = lanes.lanes.backward.map(function(l) {
                return l.psv;
            });
            expect(psvLanesForward).to.deep.equal([
                'no','no','no'
            ]);
            expect(psvLanesBackward).to.deep.equal([
                'yes', 'designated'
            ]);
        });
        it('should replace any invalid value with unknown', function() {
            var lanes = iD.osmWay({
                tags: {
                    highway: 'residential',
                    lanes: 3,
                    maxspeed: '30kmh',
                    'psv:lanes': 'yes|no|garbage'
                }
            }).lanes();
            expect(lanes.metadata.psvLanes.unspecified).to.deep.equal([
                'yes','no', 'unknown'
            ]);
            var psvLanesForward = lanes.lanes.unspecified.map(function(l) {
                return l.psv;
            });
            expect(psvLanesForward).to.deep.equal([
                'yes','no', 'unknown'
            ]);
        });
    });
});
