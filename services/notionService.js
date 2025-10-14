const { Client } = require('@notionhq/client');

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Regex to find Notion's "Formula 2.0" property placeholders.
const NOTION_V2_FORMULA_REGEX = /\{\{notion:block_property:([^:]+):[^{}]*}}/g;

/**
 * Fetches all child database blocks from a given Notion page.
 * @param {string} pageId - The ID of the Notion page.
 * @returns {Promise<Array<string>>} - A promise that resolves to an array of database IDs.
 */
async function getDatabasesFromPage(pageId) {
  try {
    const response = await notion.blocks.children.list({ block_id: pageId });
    const databaseIds = response.results
      .filter(block => block.type === 'child_database')
      .map(block => block.id);
    return databaseIds;
  } catch (error) {
    console.error('Error fetching blocks from page:', error.body || error);
    throw error;
  }
}

/**
 * Replaces Notion's internal property placeholders in a formula with human-readable prop("...") syntax.
 * @param {string} expression - The raw formula expression from the Notion API.
 * @param {Object<string, string>} idToNameMap - A map of property IDs to property names for the current database.
 * @returns {string} - The human-readable formula string.
 */
function humanizeFormula(expression, idToNameMap) {
    if (!expression) return "";

    return expression.replace(NOTION_V2_FORMULA_REGEX, (match, encodedId) => {
        // **FIX**: Use the encoded ID directly for the lookup, without decoding.
        const propName = idToNameMap[encodedId];
        // Replace with prop("...") syntax if we found a matching property name
        return propName ? `prop("${propName}")` : match; 
    });
}

/**
 * Parses a formula expression to find dependencies on other properties.
 * Handles both new (Formula 2.0) and old formula syntax.
 * @param {string} expression - The formula expression string.
 * @param {Object<string, string>} idToNameMap - A map of property IDs to property names.
 * @returns {Array<string>} - An array of property names this formula depends on.
 */
function getFormulaDependencies(expression, idToNameMap) {
    if (!expression) return [];
    const dependencies = new Set();
    let matches;

    // For global regexes used with .exec(), reset lastIndex before the loop.
    NOTION_V2_FORMULA_REGEX.lastIndex = 0;
    // Find all dependencies using the new formula format (e.g., {{notion:block_property:id:...}}).
    while ((matches = NOTION_V2_FORMULA_REGEX.exec(expression)) !== null) {
        // **FIX**: Use the captured encoded ID directly for the lookup.
        const encodedId = matches[1];
        const propName = idToNameMap[encodedId];
        if (propName) {
            dependencies.add(propName);
        } else {
            // This case can happen if a formula references a property that has been deleted.
            // We log a warning so the user can investigate the broken formula in Notion.
            console.warn(`[WARN] Found a dangling property reference. Encoded ID "${encodedId}" has no matching property name in the map.`);
        }
    }

    // Regex for old formula format (e.g., prop("Name")) for backward compatibility.
    // This handles both the standard `prop("Name")` and the internal `propKATEX_INLINE_OPEN"Name"KATEX_INLINE_CLOSE` format.
    const v1Regex = /prop(?:KATEX_INLINE_OPEN)?"([^"]+)"(?:KATEX_INLINE_CLOSE)?/g;
    while ((matches = v1Regex.exec(expression)) !== null) {
        dependencies.add(matches[1]);
    }

    return Array.from(dependencies);
}

/**
 * Retrieves detailed information about a specific database, including properties, formulas, and relations.
 * @param {string} databaseId - The ID of the Notion database.
 * @returns {Promise<Object>} - A promise that resolves to an object containing database details.
 */
async function getDatabaseDetails(databaseId) {
  try {
    const response = await notion.databases.retrieve({ database_id: databaseId });
    const properties = [];

    // Create a map from property ID to property name for resolving formula dependencies.
    // The key here is the raw `prop.id` which may be URL-encoded.
    const idToNameMap = Object.values(response.properties).reduce((map, prop) => {
        map[prop.id] = prop.name;
        return map;
    }, {});

    for (const [name, prop] of Object.entries(response.properties)) {
      let details = {
        name: name,
        type: prop.type,
        formula: null,
        dependencies: [],
        relation: null,
        rollup: null,
        template: ''
      };

      if (prop.type === 'formula' && prop.formula) {
        const rawExpression = prop.formula.expression;
        // Convert formula to a more human-readable format
        details.formula = humanizeFormula(rawExpression, idToNameMap);
        // Extract dependencies from the raw formula
        details.dependencies = getFormulaDependencies(rawExpression, idToNameMap);
      }

      if (prop.type === 'relation' && prop.relation) {
        details.relation = {
            database_id: prop.relation.database_id
        };
      }

      if (prop.type === 'rollup' && prop.rollup) {
        details.rollup = {
            relation_property_name: prop.rollup.relation_property_name,
            rollup_property_name: prop.rollup.rollup_property_name,
            function: prop.rollup.function
        };
      }
      
      properties.push(details);
    }

    return {
      id: response.id,
      title: response.title.length > 0 ? response.title[0].plain_text : 'Untitled Database',
      description: response.description.length > 0 ? response.description[0].plain_text : '',
      properties: properties,
    };
  } catch (error) {
    console.error(`Error fetching details for database ${databaseId}:`, error.body || error);
    throw error;
  }
}

/**
 * Main function to generate documentation for all databases on a page.
 * @param {string} pageId - The ID of the Notion page.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of documentation objects for each database.
 */
async function generateDocumentation(pageId) {
  const databaseIds = await getDatabasesFromPage(pageId);
  if (databaseIds.length === 0) {
    return [];
  }

  const documentation = await Promise.all(
    databaseIds.map(id => getDatabaseDetails(id))
  );

  // Create a map of database IDs to their titles for easy lookup
  const dbIdToTitleMap = documentation.reduce((acc, db) => {
      acc[db.id] = db.title;
      return acc;
  }, {});

  // Augment documentation with relation titles and calculate "Used By"
  documentation.forEach(db => {
      // Initialize usedBy array for each property
      db.properties.forEach(prop => {
          prop.usedBy = [];
      });

      // Populate the usedBy array
      db.properties.forEach(prop => {
          if (prop.dependencies && prop.dependencies.length > 0) {
              prop.dependencies.forEach(depName => {
                  const dependentProp = db.properties.find(p => p.name === depName);
                  if (dependentProp) {
                      dependentProp.usedBy.push(prop.name);
                  }
              });
          }
          if (prop.relation && dbIdToTitleMap[prop.relation.database_id]) {
              prop.relation.database_title = dbIdToTitleMap[prop.relation.database_id];
          }
      });
  });

  return documentation;
}

module.exports = { generateDocumentation };
