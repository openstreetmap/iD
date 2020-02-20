describe('iD.serviceOsmWikibase', function () {
  var server, wikibase;

  before(function () {
    iD.services.osmWikibase = iD.serviceOsmWikibase;
  });

  after(function () {
    delete iD.services.osmWikibase;
  });

  beforeEach(function () {
    server = window.fakeFetch().create();
    wikibase = iD.services.osmWikibase;
    wikibase.init();
  });

  afterEach(function () {
    server.restore();
  });


  function query(url) {
    return iD.utilStringQs(url.substring(url.indexOf('?')));
  }

  function adjust(params, data) {
    if (params) {
      if (params.norm) {
        data.description = data.descriptions.fr.value;
        data.label = data.labels.fr.value;
      }
    }
    return data;
  }

  function keyData(params) {
    return adjust(params, {
      pageid: 205725,
      ns: 120,
      title: 'Item:Q42',
      lastrevid: 1721242,
      modified: '2018-12-18T07:00:43Z',
      type: 'item',
      id: 'Q42',
      labels: {
        fr: {language: 'en', value: 'amenity', 'for-language': 'fr'}
      },
      descriptions: {
        fr: {language: 'en', value: 'English description', 'for-language': 'fr'}
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
    });
  }

  function tagData(params) {
    return adjust(params, {
      pageid: 210934,
      ns: 120,
      title: 'Item:Q13',
      lastrevid: 1718041,
      modified: '2018-12-18T03:51:05Z',
      type: 'item',
      id: 'Q13',
      labels: {
        fr: {language: 'en', value: 'amenity=parking', 'for-language': 'fr'}
      },
      descriptions: {
        fr: {language: 'fr', value: 'French description'}
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
              datavalue: {value: {'entity-type': 'item', id: 'Q42'}, type: 'wikibase-entityid'}
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
        ],
        P31: [
          {mainsnak: {datavalue: {value: {text: 'Cs:Key:bridge:movable', language: 'cs'}}}},
          {mainsnak: {datavalue: {value: {text: 'DE:Key:bridge:movable', language: 'de'}}}},
          {mainsnak: {datavalue: {value: {text: 'FR:Key:bridge:movable', language: 'fr'}}}},
          {mainsnak: {datavalue: {value: {text: 'JA:Key:bridge:movable', language: 'ja'}}}},
          {mainsnak: {datavalue: {value: {text: 'Pl:Key:bridge:movable', language: 'pl'}}}},
          {mainsnak: {datavalue: {value: {text: 'Key:bridge:movable', language: 'en'}}}},
        ],
      },
      sitelinks: {
        wiki: {
          site: 'wiki',
          title: 'Tag:amenity=parking',
          badges: []
        }
      }
    });
  }


  var localeData = {
    id: 'Q7792',
    sitelinks: {wiki: {site: 'wiki', title: 'Locale:fr'}}
  };

  describe('#getEntity', function () {
    it('calls the given callback with the results of the getEntity data item query', function (done) {
      var callback = sinon.spy();
      wikibase.getEntity({key: 'amenity', value: 'parking', langCode: 'fr'}, callback);

      server.respondWith('GET', /action=wbgetentities/,
        [200, {'Content-Type': 'application/json'}, JSON.stringify({
          entities: {
            Q42: keyData(),
            Q13: tagData(),
            Q7792: localeData,
          },
          success: 1
        })]
      );
      server.respond();

      window.setTimeout(function() {
        expect(query(server.requests()[0].url)).to.eql(
          {
            action: 'wbgetentities',
            sites: 'wiki',
            titles: 'Locale:fr|Key:amenity|Tag:amenity=parking',
            languages: 'fr',
            languagefallback: '1',
            origin: '*',
            format: 'json',
          }
        );
        expect(callback).to.have.been.calledWith(null, {
          key: keyData({norm: true}),
          tag: tagData({norm: true})
        });
        done();
      }, 50);
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
    expect(wikibase.claimToValue(tagData(), 'P4', 'en')).to.eql('Primary image.jpg');
    expect(wikibase.claimToValue(keyData(), 'P6', 'en')).to.eql('Q15');
    expect(wikibase.claimToValue(keyData(), 'P6', 'fr')).to.eql('Q15');
    expect(wikibase.claimToValue(keyData(), 'P6', 'de')).to.eql('Q14');
  });

  it('gets monolingual value from entity as an object', function () {
    expect(wikibase.monolingualClaimToValueObj(tagData(), 'P31')).to.eql({
      cs: 'Cs:Key:bridge:movable',
      de: 'DE:Key:bridge:movable',
      fr: 'FR:Key:bridge:movable',
      ja: 'JA:Key:bridge:movable',
      pl: 'Pl:Key:bridge:movable',
      en: 'Key:bridge:movable',
    });
  });

});
