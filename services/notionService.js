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
    // Filter for blocks that are child databases
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
 * Retrieves detailed information about a specific database, including its properties and formulas.
 * @param {string} databaseId - The ID of the Notion database.
 * @returns {Promise<Object>} - A promise that resolves to an object containing database details.
 */
async function getDatabaseDetails(databaseId) {
  try {
    const response = await notion.databases.retrieve({ database_id: databaseId });
    const properties = [];

    for (const [name, prop] of Object.entries(response.properties)) {
      let details = { name: name, type: prop.type, formula: null, template: '' };

      // Extract the formula expression if the property is a formula
      if (prop.type === 'formula' && prop.formula) {
        details.formula = prop.formula.expression;
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

  // Use Promise.all to fetch details for all databases concurrently
  const documentation = await Promise.all(
    databaseIds.map(id => getDatabaseDetails(id))
  );

  return documentation;
}

module.exports = { generateDocumentation };