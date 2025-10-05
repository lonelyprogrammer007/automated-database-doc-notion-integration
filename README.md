# Notion Documentation Generator
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/lonelyprogrammer007/automated-database-doc-notion-integration)

This project is a web application that automatically generates documentation for your Notion databases. Provide a Notion Page ID, and the application will fetch all the databases on that page and display their schema, including properties, formulas, and relations.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   ```
2. Navigate to the project directory:
   ```bash
   cd automated-doc-notion-api
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```

## Usage

1. Create a `.env` file in the root of the project and add your Notion API key:
   ```
   NOTION_API_KEY=your_notion_api_key
   ```
2. Start the application:
   ```bash
   npm start
   ```
3. Open your browser and go to `http://localhost:3000`.
4. Enter the Notion Page ID of the page containing the databases you want to document and click "Generate".

## Dependencies

*   [@notionhq/client](https://www.npmjs.com/package/@notionhq/client): Official Notion API client
*   [cookie-parser](https://www.npmjs.com/package/cookie-parser): Parse cookie header and populate `req.cookies`
*   [debug](https://www.npmjs.com/package/debug): A tiny JavaScript debugging utility
*   [dotenv](https://www.npmjs.com/package/dotenv): Loads environment variables from a `.env` file
*   [ejs](https://www.npmjs.com/package/ejs): Embedded JavaScript templating
*   [express](https://www.npmjs.com/package/express): Fast, unopinionated, minimalist web framework for Node.js
*   [http-errors](https://www.npmjs.com/package/http-errors): Create HTTP errors for Express, Koa, etc.
*   [morgan](https://www.npmjs.com/package/morgan): HTTP request logger middleware for node.js
