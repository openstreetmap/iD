describe("iD.validations.dashes", function () {
    var context;

    beforeEach(function () {
        context = iD.coreContext().assetPath("../dist/").init();
    });

    function createWay(tags) {
        var n1 = iD.osmNode({ id: "n-1", loc: [4, 4] });
        var n2 = iD.osmNode({ id: "n-2", loc: [4, 5] });
        var w = iD.osmWay({ id: "w-1", nodes: ["n-1", "n-2"], tags: tags });

        context.perform(
            iD.actionAddEntity(n1),
            iD.actionAddEntity(n2),
            iD.actionAddEntity(w)
        );
    }

    function validate() {
        var validator = iD.validationDashes(context);
        var changes = context.history().changes();
        var entities = changes.modified.concat(changes.created);
        var issues = [];
        entities.forEach(function (entity) {
            issues = issues.concat(validator(entity, context.graph()));
        });
        return issues;
    }

    it("has no errors on init", function () {
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it("ignores non dash-sensitive tags", function () {
        //Here EN dash is used in the "name" tag but because it is not a dash-sensitive tag ,
        // it should be ignored
        createWay({ name: "Main–Street" }); //EN dash
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it("flags invalid dash in dash-sensitive keys", function () {
        createWay({ opening_hours: "Mo–Fr 10:00-18:00" }); // EN dash
        var issues = validate();
        expect(issues).to.have.lengthOf(1);

        var issue = issues[0];
        expect(issue.type).to.eql("invalid_dashes");
        expect(issue.subtype).to.eql("nonstandard_dash");
        expect(issue.entityIds[0]).to.eql("w-1");
    });

    it("ignores correct dash (hyphen-minus)", function () {
        createWay({ opening_hours: "Mo-Fr 10:00-18:00" }); //only "-" (hyphen-minus) is used
        var issues = validate();
        expect(issues).to.have.lengthOf(0);
    });

    it("flags multiple bad dash values", function () {
        createWay({
            opening_hours: "Mo–Fr 10:00–18:00", // EN dash
            service_times: "10﹘20", // small em dash
        });
        var issues = validate();
        expect(issues).to.have.lengthOf(1);

        var issue = issues[0];
        expect(issue.entityIds).to.include("w-1");
        expect(issue.data).to.eql("_multi"); // multiple bad tags
    });

    it("replaces invalid dashes only outside comments ", function () {
        // en dash before Fr (invalid, should be fixed)
        // em dash inside quotes (valid, should stay as it is)
        createWay({ opening_hours: 'Mo–Fr 08:00-18:00 "holiday — closed"' });
        var issues = validate();
        expect(issues).to.have.lengthOf(1);

        var fixes = issues[0].dynamicFixes(context);

        var replaceFix = fixes.find(
            (f) => f.title.stringId === "issues.fix.replace_dashes.title"
        );

        expect(replaceFix).to.exist;

        // Simulate running the fix
        replaceFix.onClick.call({ issue: issues[0] }, context);

        var entity = context.hasEntity("w-1");
        expect(entity.tags.opening_hours).to.eql(
            'Mo-Fr 08:00-18:00 "holiday — closed"'
        );
    });
});
