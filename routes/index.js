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
    next(error); // Pass the error to the next middleware
  }
});

module.exports = router;