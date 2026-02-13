describe('iD.validations.redundant_area_yes', function () {
  var context, _savedAreaKeys;

  beforeEach(function () {
    _savedAreaKeys = iD.osmAreaKeys;
    context = iD.coreContext().init();
    // osmAreaKeys is a discard list: keys with values that can be lines.
    // So landuse: {} means "landuse implies area" (no line values); landuse: { path: true } would mean path can be line.
    iD.osmSetAreaKeys({
      landuse: {},
      natural: {}
    });
  });

  afterEach(function () {
    iD.osmSetAreaKeys(_savedAreaKeys);
  });

  function createClosedWay(tags) {
    var n1 = iD.osmNode({ id: 'n-1', loc: [4, 4] });
    var n2 = iD.osmNode({ id: 'n-2', loc: [4, 5] });
    var n3 = iD.osmNode({ id: 'n-3', loc: [5, 5] });
    var w = iD.osmWay({ id: 'w-1', nodes: ['n-1', 'n-2', 'n-3', 'n-1'], tags: tags });
    context.perform(
      iD.actionAddEntity(n1),
      iD.actionAddEntity(n2),
      iD.actionAddEntity(n3),
      iD.actionAddEntity(w)
    );
  }

  function validate(validator) {
    var changes = context.history().changes();
    var entities = changes.modified.concat(changes.created);
    var issues = [];
    entities.forEach(function (entity) {
      issues = issues.concat(validator(entity, context.graph()));
    });
    return issues;
  }

  it('has no errors on init', function () {
    var validator = iD.validationRedundantAreaYes(context);
    var issues = validate(validator);
    expect(issues).to.have.lengthOf(0);
  });

  it('ignores ways without area=yes', function () {
    createClosedWay({ landuse: 'forest' });
    var validator = iD.validationRedundantAreaYes(context);
    var issues = validate(validator);
    expect(issues).to.have.lengthOf(0);
  });

  it('ignores area=yes when no other tags imply area', function () {
    createClosedWay({ area: 'yes', name: 'Unnamed' });
    var validator = iD.validationRedundantAreaYes(context);
    var issues = validate(validator);
    expect(issues).to.have.lengthOf(0);
  });

  it('flags redundant area=yes with landuse', function () {
    createClosedWay({ landuse: 'forest', area: 'yes' });
    var validator = iD.validationRedundantAreaYes(context);
    var issues = validate(validator);
    expect(issues).to.have.lengthOf(1);
    expect(issues[0].type).to.eql('redundant_area_yes');
    expect(issues[0].severity).to.eql('warning');
    expect(issues[0].entityIds).to.eql(['w-1']);
  });

  it('flags redundant area=yes with highway=services', function () {
    createClosedWay({ highway: 'services', area: 'yes' });
    var validator = iD.validationRedundantAreaYes(context);
    var issues = validate(validator);
    expect(issues).to.have.lengthOf(1);
    expect(issues[0].type).to.eql('redundant_area_yes');
  });

  it('fix removes area tag', function () {
    createClosedWay({ landuse: 'farmland', area: 'yes' });
    var validator = iD.validationRedundantAreaYes(context);
    var issues = validate(validator);
    expect(issues).to.have.lengthOf(1);
    var fix = issues[0].fixes(context)[0];
    expect(fix.title.stringId).to.include('remove_named_tag');
    fix.onClick(context);
    var way = context.entity('w-1');
    expect(way.tags.area).to.be.undefined;
    expect(way.tags.landuse).to.eql('farmland');
  });
});
