function testWarningMechanism() {
    const graph = {}; // Mock graph object
    const way = {}; // Mock way object

    // Simulate adding an inappropriate entity
    const result = actionAddEntity(way)(graph);

    // Check if the warning was triggered
    console.assert(result === graph, "Warning mechanism did not prevent adding the entity.");
}

// Run the test
testWarningMechanism();
