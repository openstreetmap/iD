describe('iD.serviceVegbilder', function() {
  const dimensions = [64, 64];
  const testImages = [{
    loc: [5.7, 58.90001],
    key: 'Vegbilder_2021.2021-01-01T11.11.11.000000_EV00001_S001D1_m00001',
    ca: 90,
    image_path: 'https://s3vegbilder.atlas.vegvesen.no/foo/bar1.jpg',
    road_reference: 'EV1 S1D1',
    metering: 1,
    lane_code: '1K',
    captured_at: new Date('2021-01-01T11.11.11Z'),
    is_sphere: false
  }, {
    loc: [5.7, 58.90002],
    key: 'Vegbilder_2021.2021-01-01T11.11.12.000000_EV00001_S001D1_m00002',
    ca: 90,
    image_path: 'https://s3vegbilder.atlas.vegvesen.no/foo/bar2.jpg',
    road_reference: 'EV1 S1D1',
    metering: 2,
    lane_code: '1K',
    captured_at: new Date('2021-01-01T11.11.12Z'),
    is_sphere: false
  }, {
    loc: [5.7, 59.90003],
    key: 'Vegbilder_2021.2021-01-01T11.11.13.000000_EV00001_S002D1_m00003',
    ca: 90,
    image_path: 'https://s3vegbilder.atlas.vegvesen.no/foo/bar3.jpg',
    road_reference: 'EV1 S2D1',
    metering: 3,
    lane_code: '1K',
    captured_at: new Date('2021-01-01T11.11.13Z'),
    is_sphere: false
  }];
  const stacedImages = [{
    loc: [5.7, 58.9],
    key: 'Vegbilder_2021.2021-01-01T11.11.11.000000_EV00001_S001D1_m00001',
    ca: 90,
    image_path: 'https://s3vegbilder.atlas.vegvesen.no/foo/bar1.jpg',
    road_reference: 'EV1 S1D1',
    metering: 1,
    lane_code: '1K',
    captured_at: new Date('2021-01-01T11.11.11Z'),
    is_sphere: false
  }, {
    loc: [5.7, 58.9],
    key: 'Vegbilder_2021.2021-01-01T11.11.12.000000_EV00001_S001D1_m00002',
    ca: 90,
    image_path: 'https://s3vegbilder.atlas.vegvesen.no/foo/bar2.jpg',
    road_reference: 'EV1 S1D1',
    metering: 2,
    lane_code: '1K',
    captured_at: new Date('2021-01-01T11.11.12Z'),
    is_sphere: false
  }, {
    loc: [5.7, 58.9],
    key: 'Vegbilder_2021.2021-01-01T11.11.13.000000_EV00001_S001D1_m00003',
    ca: 90,
    image_path: 'https://s3vegbilder.atlas.vegvesen.no/foo/bar3.jpg',
    road_reference: 'EV1 S1D1',
    metering: 3,
    lane_code: '1K',
    captured_at: new Date('2021-01-01T11.11.13Z'),
    is_sphere: false
  }, {
    loc: [5.7, 58.9],
    key: 'Vegbilder_2021.2021-01-01T11.11.14.000000_EV00001_S001D1_m00004',
    ca: 90,
    image_path: 'https://s3vegbilder.atlas.vegvesen.no/foo/bar4.jpg',
    road_reference: 'EV1 S1D1',
    metering: 4,
    lane_code: '1K',
    captured_at: new Date('2021-01-01T11.11.14Z'),
    is_sphere: false
  }, {
    loc: [5.7, 58.9],
    key: 'Vegbilder_2021.2021-01-01T11.11.15.000000_EV00001_S001D1_m00005',
    ca: 90,
    image_path: 'https://s3vegbilder.atlas.vegvesen.no/foo/bar5.jpg',
    road_reference: 'EV1 S1D1',
    metering: 5,
    lane_code: '1K',
    captured_at: new Date('2021-01-01T11.11.15Z'),
    is_sphere: false
  }, {
    loc: [5.7, 58.9],
    key: 'Vegbilder_2021.2021-01-01T11.11.16.000000_EV00001_S001D1_m00006',
    ca: 90,
    image_path: 'https://s3vegbilder.atlas.vegvesen.no/foo/bar6.jpg',
    road_reference: 'EV1 S1D1',
    metering: 6,
    lane_code: '1K',
    captured_at: new Date('2021-01-01T11.11.16Z'),
    is_sphere: false
  }];

  let context, vegbilder;

  function asFeature(images) {
    return images.map(image => ({
      minX: image.loc[0],
      minY: image.loc[1],
      maxX: image.loc[0],
      maxY: image.loc[1],
      data: image
    }));
  }

  before(function() {
    iD.services.vegbilder = iD.serviceVegbilder;
  });

  after(function() {
    delete iD.services.vegbilder;
  });

  beforeEach(async function() {
    context = iD.coreContext().assetPath('../dist/').init();
    // bbox maxX: 5.705423355102539 maxY: 58.900168239328906 minX: 5.699930191040039 minY: 58.8973307343531
    context.projection
            .scale(iD.geoZoomToScale(14))
            .translate([-66409, 853915])
            .clipExtent([[0,0], dimensions]);

    vegbilder = iD.services.vegbilder;
    await vegbilder.reset();
    fetchMock.reset();
  });

  afterEach(function() {
    fetchMock.reset();
  });

  describe('#init', function() {
    it('Initializes cache one time', function() {
      const cache = vegbilder.cache();
      expect(cache).to.have.property('wfslayers');
      expect(cache).to.have.property('rtree');
      expect(cache).to.have.property('image2sequence_map');

      vegbilder.init();
      const cache2 = vegbilder.cache();
      expect(cache).to.equal(cache2);
    });

    it('fetches available layers', function() {
      const availableLayers = vegbilder.cache().wfslayers;
      expect(availableLayers).to.have.key('vegbilder_1_0:Vegbilder_2020');
      expect(availableLayers).to.not.have.key('not_matched_layer:Vegbilder_2020');
    });
  });

  describe('#reset', function() {
    it('resets cache', async function() {
      vegbilder.cache().foo = 'bar';
      await vegbilder.reset();
      expect(vegbilder.cache()).to.not.have.property('foo');
    });
  });

  describe('loadImages', function () {
    it('fires loadedImages when images are loaded', function() {
      const response = {
        'type': 'FeatureCollection',
        'features': [
          {
            'type': 'Feature',
            'id': 'Vegbilder_2021.2021-05-05T08.42.47.315227_EV00039_S100D1_m14966_KD1_m00319',
            'geometry': {'type': 'Point', 'coordinates': [5.686, 58.901]},
            'properties':{
              'BILDETYPE':'Planar','AAR':2021,'TIDSPUNKT':'2021-05-05T06:42:47Z','FYLKENUMMER':11,'VEGKATEGORI':'E','VEGSTATUS':'V',
              'VEGNUMMER':39,'STREKNING':100,'HP':null,'DELSTREKNING':1,'ANKERPUNKT':14966,'KRYSSDEL':1,'SIDEANLEGGSDEL':null,
              'METER':319.0,'FELTKODE':'1K','REFLINKID':null,'REFLINKPOSISJON':null,'RETNING':176.2,
              'URL':'https://s3vegbilder.atlas.vegvesen.no/foo/bar1.jpg'
            }
          }, {
            'type': 'Feature',
            'id': 'Vegbilder_2021.2021-05-05T08.42.47.627214_EV00039_S100D1_m14966_KD1_m00320',
            'geometry': {'type': 'Point', 'coordinates': [5.687, 58.902]},
            'properties': {
              'BILDETYPE':'Planar','AAR':2021,'TIDSPUNKT':'2021-05-05T06:42:47Z','FYLKENUMMER':11,'VEGKATEGORI':'E','VEGSTATUS':'V',
              'VEGNUMMER':39,'STREKNING':100,'HP':null,'DELSTREKNING':1,'ANKERPUNKT':14966,'KRYSSDEL':1,'SIDEANLEGGSDEL':null,
              'METER':320.0,'FELTKODE':'1K','REFLINKID':null,'REFLINKPOSISJON':null,'RETNING':178.5,
              'URL':'https://s3vegbilder.atlas.vegvesen.no/foo/bar2.jpg'
              }
        }, {
            'type': 'Feature',
            'id': 'Vegbilder_2021.2021-05-05T08.42.47.627214_EV00039_S100D1_m14966_KD1_m00321',
            'geometry': {'type':'Point','coordinates':[5.688, 58.903]},
            'properties': {
              'BILDETYPE':'Planar','AAR':2021,'TIDSPUNKT':'2021-05-05T06:42:47Z','FYLKENUMMER':11,'VEGKATEGORI':'E','VEGSTATUS':'V',
              'VEGNUMMER':39,'STREKNING':100,'HP':null,'DELSTREKNING':1,'ANKERPUNKT':14966,'KRYSSDEL':1,'SIDEANLEGGSDEL':null,
              'METER':321.0,'FELTKODE':'1K','REFLINKID':null,'REFLINKPOSISJON':null,'RETNING':178.5,
              'URL':'https://s3vegbilder.atlas.vegvesen.no/foo/bar3.jpg'
            }
          }
        ],
        'totalFeatures': 3
      };

      fetchMock.mock({
        url: 'https://www.vegvesen.no/kart/ogc/vegbilder_1_0/ows',
        query: {
          service: 'WFS',
          request: 'GetFeature'
        }
      }, response);

      return new Promise((resolve) => {
        vegbilder.on('loadedImages', () => {
          expect(fetchMock.calls().length).to.eql(1);
          resolve();
        });

        vegbilder.loadImages(context, 0);
      });
    });

    it('does not load images around null island', async function() {
      const response = {
        'type': 'FeatureCollection',
        'features': [
          {
            'type': 'Feature',
            'id': 'Vegbilder_2021.2021-01-01T11.11.11.000000_EV00001_S001D1_m00001',
            'geometry': {'type': 'Point', 'coordinates': [0.0, 0.0]},
            'properties':{
              'BILDETYPE':'Planar','AAR':2021,'TIDSPUNKT':'2021-01-01T11.11.11Z','FYLKENUMMER':1,'VEGKATEGORI':'E','VEGSTATUS':'V',
              'VEGNUMMER':1,'STREKNING':1,'HP':null,'DELSTREKNING':1,'ANKERPUNKT':null,'KRYSSDEL':null,'SIDEANLEGGSDEL':null,
              'METER':1.0,'FELTKODE':'1K','REFLINKID':null,'REFLINKPOSISJON':null,'RETNING':null,
              'URL':'https://s3vegbilder.atlas.vegvesen.no/foo/bar.jpg'
            }
          }
        ],
        'totalFeatures': 1
      };

      fetchMock.mock({
        url: 'https://www.vegvesen.no/kart/ogc/vegbilder_1_0/ows',
        query: {
          service: 'WFS',
          request: 'GetFeature'
        }
      }, response);

      context.projection.translate([0, 0]);

      const spy = sinon.spy();
      vegbilder.on('loadedImages', spy);
      vegbilder.loadImages(context, 0);

      await new Promise((resolve) => { window.setTimeout(resolve, 200); });

      expect(spy).to.have.been.not.called;
      expect(fetchMock.calls().length).to.eql(0);
    });
  });

  describe('#images', function() {
    it('returns images in the visible map area', function() {
      const features = asFeature(testImages);

      vegbilder.cache().rtree.load(features);
      const result = vegbilder.images(context.projection);

      expect(result).to.deep.eql(testImages.slice(0, 2));
    });

    it('limits results no more than 5 stacked images in one spot', function() {
      const features = asFeature(stacedImages);

      vegbilder.cache().rtree.load(features);
      const result = vegbilder.images(context.projection);
      expect(features).to.have.length.of.at.least(6);
      expect(result).to.have.length.of.at.most(5);
    });
  });
  describe('#sequences', function() {
    it('returns sequence linestrings in the visible map area', function() {
      const features = asFeature(testImages);
      const cache = vegbilder.cache();

      cache.rtree.load(features);

      const sequence = {
        images: testImages,
        key: '1',
        geometry : {
          type : 'LineString',
          coordinates : testImages.map(image => image.loc)
        }};

      for (const image of testImages) {
        cache.image2sequence_map.set(image.key, sequence);
      }

      const result = vegbilder.sequences(context.projection);
      expect(result).to.deep.eql([{
        type: 'LineString',
        coordinates: [[5.7, 58.90001], [5.7, 58.90002], [5.7, 59.90003]],
        key: '1',
        images: testImages
      }]);
    });
  });
});
