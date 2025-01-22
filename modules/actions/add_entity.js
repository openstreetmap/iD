export function actionAddEntity(way) {
    return function(graph) {
        // Check if the entity type is appropriate
        if (isInappropriateEntity(way)) {
            alert('Warning: You are attempting to attach a real-life object to an abstract concept.');
            return graph; // Prevent adding the entity
        }
        return graph.replace(way);
    };
}

// Function to determine if the entity is inappropriate
function isInappropriateEntity(entity) {
    // Logic to determine if the entity is inappropriate
    // This could involve checking the entity type or properties
    return false; // Placeholder for actual logic
}
