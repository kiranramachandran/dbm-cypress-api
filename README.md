# Cypress API Testing Framework

This is a complete API testing framework using Cypress and best practices. It includes:
- API tests
- Modular test structure
- Custom commands
- GitHub Actions CI integration

## Run Locally

1. Install dependencies:
```bash
npm install
npm install cypress
npm install pg
npm install --save-dev @badeball/cypress-cucumber-preprocessor @bahmutov/cypress-esbuild-preprocessor esbuild
npm install mssql
npm install -D cypress-wait-until
```

2. Run API tests:
```bash
npx cypress run
```
Run API tests on a partucular environment:
```bash
npx cypress run --env environment=<environment> (dev/staging/prod)
```
Run API tests and generate html report:
```bash
npm run test:report:dev
npm run test:report:stg
```
Run API tests in Cypress UI:
```bash
npm cypress open
npx cross-env ENV_NAME=dev npx cypress open
npx cross-env ENV_NAME=stg npx cypress open
```

## Folder Structure

- `cypress/e2e`: Test specs
- `support/commands.js`: Custom Cypress commands

## CI/CD

GitHub Actions workflow is included in `azure-pipelines.yml`

## Repo Structure
```bash
cypress-api-framework/
├─ cypress/
│  ├─ e2e/
│  │  └─ features           // Cucumber Feature files go here
│  ├─ fixtures/           // Test Data Folder - Keep all IFC and PDF files here
│  ├─ reports/             //Mochawesome.html report
│  ├─ support/
│  │  └─ e2e.js            // Calls Commands.js
│  │  └─reusable.js        // Reusable Javascipt code
│  │  └─step_definitions  // Reusable Javascipt code
│  │  └─index.js           // Cucumber Preprocessor configd
│  │  └─commands.js         // Authentication token
├─ azure-pipelines.yml     // Cypress Integration with CI / CD
├─ cypress.env.json         // Environments URL on which tests are run
├─ package.json             // Installers and dependencies
├─ cypress.config.js        // All Cypress configs
├─ README.md
└─ .gitignore
```
