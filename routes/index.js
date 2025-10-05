const express = require('express');
const router = express.Router();
const notionService = require('../services/notionService');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Notion Documentation Generator' });
});

/* POST to generate documentation */
router.post('/generate', async (req, res, next) => {
  const { pageId } = req.body;
  if (!pageId) {
    return res.render('index', { 
      title: 'Notion Documentation Generator', 
      error: 'Please provide a Notion Page ID.' 
    });
  }

  try {
    const documentation = await notionService.generateDocumentation(pageId);
    if (documentation.length === 0) {
        return res.render('index', { 
          title: 'Notion Documentation Generator', 
          error: 'No databases found on the specified page. Ensure the page ID is correct and the integration has access.' 
        });
    }
    res.render('documentation', { 
      title: 'Generated Documentation', 
      databases: documentation,
      pageId: pageId
    });
  } catch (error) {
    console.error(error);
    // More specific error messages for the user
    let userError = 'An error occurred while fetching data from Notion. Please check the console for details.';
    if (error.code === 'object_not_found' || error.status === 404) {
        userError = 'The provided Page ID was not found. Please ensure it is correct and that your Notion integration has been shared with that page.';
    }
    if (error.code === 'unauthorized' || error.status === 401) {
        userError = 'The Notion API Key is invalid or has not been provided. Please check your .env file.';
    }
    res.render('index', { 
      title: 'Notion Documentation Generator', 
      error: userError 
    });
  }
});

module.exports = router;