# Project Overview

This is a Node.js web application that automatically generates documentation for Notion databases. It uses the Express.js framework and the EJS templating engine. The application takes a Notion Page ID as input, fetches all the databases on that page, and displays their schema, including properties, formulas, and relations.

The core logic is in `services/notionService.js`, which uses the `@notionhq/client` library to interact with the Notion API.

## Building and Running

**1. Install Dependencies:**

```bash
npm install
```

**2. Set up Environment Variables:**

Create a `.env` file in the root of the project and add your Notion API key:

```
NOTION_API_KEY=your_notion_api_key
```

**3. Run the Application:**

```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Development Conventions

*   **Linting:** There is no linter configured in the project.
*   **Testing:** There is no testing framework configured in the project.
*   **Code Style:** The code style is based on the Prettier code formatter, but it is not enforced.
*   **Contribution Guidelines:** There are no contribution guidelines in the project.
