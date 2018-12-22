describe('iD.serviceOsmWikibase', function () {
  var server, wikibase;

  before(function () {
    iD.services.osmWikibase = iD.serviceOsmWikibase;
  });

  after(function () {
    delete iD.services.osmWikibase;
  });

  beforeEach(function () {
    wikibase = iD.services.osmWikibase;
    wikibase.init();
    server = sinon.fakeServer.create();
  });

  afterEach(function () {
    server.restore();
  });


  function query(url) {
    return iD.utilStringQs(url.substring(url.indexOf('?') + 1));
  }

  var keyData = {
    pageid: 205725,
    ns: 120,
    title: 'Item:Q61',
    lastrevid: 1721242,
    modified: '2018-12-18T07:00:43Z',
    type: 'item',
    id: 'Q61',
    labels: {
      en: {language: 'en', value: 'amenity'}
    },
    descriptions: {
      en: {language: 'en', value: 'For describing useful and important facilities for visitors and residents.'}
    },
    aliases: {},
    claims: {
      P2: [ // instance of
        {
          mainsnak: {
            snaktype: 'value',
            datatype: 'wikibase-item',
            datavalue: {value: {'entity-type': 'item', id: 'Q7'}, type: 'wikibase-entityid'}
          },
          type: 'statement',
          rank: 'normal'
        }
      ],
      P16: [
        {
          mainsnak: {
            snaktype: 'value',
            datatype: 'string',
            datavalue: {value: 'amenity', type: 'string'}
          },
          type: 'statement',
          rank: 'normal'
        }
      ],
      P25: [
        {
          mainsnak: {
            snaktype: 'value',
            datatype: 'wikibase-item',
            datavalue: {value: {'entity-type': 'item', id: 'Q4679'}, type: 'wikibase-entityid'}
          },
          type: 'statement',
          rank: 'normal'
        }
      ],
      P9: [
        {
          mainsnak: {
            snaktype: 'value',
            datatype: 'wikibase-item',
            datavalue: {value: {'entity-type': 'item', id: 'Q8'}, type: 'wikibase-entityid'}
          },
          type: 'statement',
          rank: 'normal'
        }
      ],
      P6: [
        {
          mainsnak: {
            snaktype: 'value',
            datatype: 'wikibase-item',
            datavalue: {value: {'entity-type': 'item', id: 'Q15'}, type: 'wikibase-entityid'}
          },
          type: 'statement',
          rank: 'preferred'
        },
        {
          mainsnak: {
            snaktype: 'value',
            datatype: 'wikibase-item',
            datavalue: {value: {'entity-type': 'item', id: 'Q14'}, type: 'wikibase-entityid'}
          },
          type: 'statement',
          qualifiers: {
            P26: [
              {
                snaktype: 'value',
                datatype: 'wikibase-item',
                datavalue: {value: {'entity-type': 'item', id: 'Q6994'}, type: 'wikibase-entityid'}
              }
            ]
          },
          rank: 'normal'
        }
      ],
      P28: [
        {
          mainsnak: {
            snaktype: 'value',
            datatype: 'string',
            datavalue: {value: 'Mapping-Features-Parking-Lot.png', type: 'string'}
          },
          type: 'statement',
          rank: 'normal'
        }
      ]
    },
    sitelinks: {
      wiki: {
        site: 'wiki',
        title: 'Key:amenity',
        badges: []
      }
    }
  };

  var tagData = {
    pageid: 210934,
    ns: 120,
    title: 'Item:Q4904',
    lastrevid: 1718041,
    modified: '2018-12-18T03:51:05Z',
    type: 'item',
    id: 'Q4904',
    labels: {
      en: {language: 'en', value: 'amenity=parking'}
    },
    descriptions: {
      en: {language: 'en', value: 'A place for parking cars'},
      fr: {language: 'fr', value: 'Un lieu pour garer des voitures'}
    },
    aliases: {},
    claims: {
      P2: [ // instance of = Q2 (tag)
        {
          mainsnak: {
            snaktype: 'value',
            datatype: 'wikibase-item',
            datavalue: {value: {'entity-type': 'item', id: 'Q2'}, type: 'wikibase-entityid'}
          },
          type: 'statement',
          rank: 'normal'
        }
      ],
      P19: [
        {
          mainsnak: {
            snaktype: 'value',
            datatype: 'string',
            datavalue: {value: 'amenity=parking', type: 'string'}
          },
          type: 'statement',
          rank: 'normal'
        }
      ],
      P10: [
        {
          mainsnak: {
            snaktype: 'value',
            datatype: 'wikibase-item',
            datavalue: {value: {'entity-type': 'item', id: 'Q61'}, type: 'wikibase-entityid'}
          },
          type: 'statement',
          rank: 'normal'
        }
      ],
      P4: [
        {
          mainsnak: {
            snaktype: 'value',
            datatype: 'commonsMedia',
            datavalue: {value: 'Primary image.jpg', type: 'string'}
          },
          type: 'statement',
          rank: 'preferred'
        }
      ],
      P6: [
        {
          mainsnak: {
            snaktype: 'value',
            datatype: 'wikibase-item',
            datavalue: {value: {'entity-type': 'item', id: 'Q14'}, type: 'wikibase-entityid'}
          },
          type: 'statement',
          rank: 'preferred'
        },
        {
          mainsnak: {
            snaktype: 'value',
            datatype: 'wikibase-item',
            datavalue: {value: {'entity-type': 'item', id: 'Q13'}, type: 'wikibase-entityid'}
          },
          type: 'statement',
          qualifiers: {
            P26: [
              {
                snaktype: 'value',
                datatype: 'wikibase-item',
                datavalue: {value: {'entity-type': 'item', id: 'Q6994'}, type: 'wikibase-entityid'}
              }
            ]
          },
          rank: 'normal'
        }
      ],
      P25: [
        {
          mainsnak: {
            snaktype: 'value',
            datatype: 'wikibase-item',
            datavalue: {value: {'entity-type': 'item', id: 'Q4679'}, type: 'wikibase-entityid'}
          },
          type: 'statement',
          rank: 'normal'
        }
      ]
    },
    sitelinks: {
      wiki: {
        site: 'wiki',
        title: 'Tag:amenity=parking',
        badges: []
      }
    }
  };


  var localeData = {
    id: 'Q7792',
    sitelinks: {wiki: {site: 'wiki', title: 'Locale:fr'}}
  };

  describe('#getEntity', function () {
    it('calls the given callback with the results of the getEntity data item query', function () {
      var callback = sinon.spy();
      wikibase.getEntity({key: 'amenity', value: 'parking', langCode: 'fr'}, callback);

      server.respondWith('GET', /action=wbgetentities/,
        [200, {'Content-Type': 'application/json'}, JSON.stringify({
          entities: {
            Q61: keyData,
            Q4904: tagData,
            Q7792: localeData,
          },
          success: 1
        })]
      );
      server.respond();

      expect(query(server.requests[0].url)).to.eql(
        {
          action: 'wbgetentities',
          format: 'json',
          languages: 'en|fr',
          origin: '*',
          sites: 'wiki',
          titles: 'Locale:fr|Key:amenity|Tag:amenity=parking',
        }
      );
      expect(callback).to.have.been.calledWith(null, {key: keyData, tag: tagData});
    });
  });


  it('creates correct sitelinks', function () {
    expect(wikibase.toSitelink('amenity')).to.eql('Key:amenity');
    expect(wikibase.toSitelink('amenity_')).to.eql('Key:amenity');
    expect(wikibase.toSitelink('_amenity_')).to.eql('Key: amenity');
    expect(wikibase.toSitelink('amenity or_not_')).to.eql('Key:amenity or not');
    expect(wikibase.toSitelink('amenity', 'parking')).to.eql('Tag:amenity=parking');
    expect(wikibase.toSitelink(' amenity_', '_parking_')).to.eql('Tag: amenity = parking');
    expect(wikibase.toSitelink('amenity or_not', '_park ing_')).to.eql('Tag:amenity or not= park ing');
  });

  it('gets correct value from entity', function () {
    wikibase.addLocale('de', 'Q6994');
    wikibase.addLocale('fr', 'Q7792');
    expect(wikibase.claimToValue(tagData, 'P4', 'en')).to.eql('Primary image.jpg');
    expect(wikibase.claimToValue(keyData, 'P6', 'en')).to.eql('Q15');
    expect(wikibase.claimToValue(keyData, 'P6', 'fr')).to.eql('Q15');
    expect(wikibase.claimToValue(keyData, 'P6', 'de')).to.eql('Q14');
  });

  it('gets correct description from entity', function () {
    expect(wikibase.getDescription(tagData)).to.eql('Un lieu pour garer des voitures');
    expect(wikibase.getDescription(keyData)).to.eql('For describing useful and important facilities for visitors and residents.');
  });

});
