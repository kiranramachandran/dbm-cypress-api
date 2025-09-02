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
npm install -D @shelex/cypress-allure-plugin
npm install --save-dev cypress-mochawesome-reporter
npm install pg
```

2. Run API tests:
```bash
npx cypress run
```
Run API tests on a partucular environment:
```bash
npx cypress run --env environment=<environment> (dev/staging/prod)
```

## Folder Structure

- `cypress/e2e`: Test specs
- `support/commands.js`: Custom Cypress commands

## CI/CD

GitHub Actions workflow is included in `azure-pipelines.yml`

## Repo Structure
```bash
cypress-api-framework/
├─ .azure-pipelines/
│  └─ azure-pipelines.yml
├─ cypress/
│  ├─ e2e/
│  ├─ fixtures/
│  ├─ support/
│  │  └─ e2e.js
├─ package.json
├─ cypress.config.js
├─ README.md
└─ .gitignore
```
