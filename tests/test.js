/**
 * Replaces Notion's internal property placeholders in a formula with human-readable prop("...") syntax.
 * @param {string} expression - The raw formula expression from the Notion API.
 * @param {Object<string, string>} idToNameMap - A map of property IDs to property names for the current database.
 * @returns {string} - The human-readable formula string.
 */
function humanizeFormula(expression, idToNameMap) {
    if (!expression) return "";
    // Regex to find Notion's new formula placeholders.
    const regex = /\{\{notion:block_property:([^:]+):[^{}]*\}\}/g;

    return expression.replace(regex, (match, encodedId) => {
        // Use the encoded ID directly for the lookup.
        const propName = idToNameMap[encodedId];
        // Replace with prop("...") syntax if we found a matching property name
        return propName ? `prop("${propName}")` : match;
    });
}


// --- Test Setup ---

// 1. A sample map of property IDs to their human-readable names.
// This simulates the data we'd get from the Notion API for a database.
const sampleIdToNameMap = {
    "a%3A%3E%3D": "Status",
    "_m%3A%5D": "Due Date",
    "f%3Eq%3A": "Completed"
};

// 2. A sample raw formula expression from the Notion API.
// It references the "Status" and "Completed" properties using their encoded IDs.
const rawApiFormula = `if(equal({{notion:block_property:a%3A%3E%3D:....}}, "Done"), {{notion:block_property:f%3Eq%3A:....}}, false)`;


// --- Running the Test ---

console.log("--- Input ---");
console.log("Raw API Formula:", rawApiFormula);
console.log("ID-to-Name Map:", sampleIdToNameMap);
console.log("\n--- Running humanizeFormula() ---\n");

const humanizedResult = humanizeFormula(rawApiFormula, sampleIdToNameMap);

console.log("--- Output ---");
console.log("Humanized Formula:", humanizedResult);

// --- Expected Output ---
// Humanized Formula: if(equal(prop("Status"), "Done"), prop("Completed"), false)