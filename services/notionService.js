const { Client } = require('@notionhq/client');

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

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
 * Parses a formula expression to find dependencies on other properties.
 * @param {string} expression - The formula expression string.
 * @returns {Array<string>} - An array of property names this formula depends on.
 */
function getFormulaDependencies(expression) {
    if (!expression) return [];
    const regex = /prop\("(.+?)"\)/g;
    let matches;
    const dependencies = new Set();
    while ((matches = regex.exec(expression)) !== null) {
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
        details.formula = prop.formula.expression;
        details.dependencies = getFormulaDependencies(prop.formula.expression);
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

  // Augment documentation with relation titles
  documentation.forEach(db => {
      db.properties.forEach(prop => {
          if (prop.relation && dbIdToTitleMap[prop.relation.database_id]) {
              prop.relation.database_title = dbIdToTitleMap[prop.relation.database_id];
          }
      });
  });

  return documentation;
}

module.exports = { generateDocumentation };