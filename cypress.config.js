
const { defineConfig } = require('cypress')
const createEsbuildPlugin =
  require("@badeball/cypress-cucumber-preprocessor/esbuild").createEsbuildPlugin;
const addCucumberPreprocessorPlugin =
  require("@badeball/cypress-cucumber-preprocessor").addCucumberPreprocessorPlugin;
const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
require('dotenv').config();
const fs = require('fs');
const sql = require("mssql");

const ENV = process.env.ENV_NAME || 'dev';
const envFile = 'cypress.env.json';
const envJson = fs.existsSync(envFile) ? JSON.parse(fs.readFileSync(envFile)) : {};
const envFromJson = envJson[ENV] || {};

module.exports = defineConfig({
  e2e: {
    specPattern: [
      "cypress/e2e/**/*.feature", //feature files
      "cypress/e2e/**/*.cy.js" //js test files
    ],
    supportFile: 'cypress/support/e2e.js',
    projectId: "4gnthq",
       async setupNodeEvents(on, config) {

        const envName = process.env.ENV_NAME || config.env.ENV_NAME || "dev"; // default dev
          console.log("Using envName =", envName);
          
          if (envName === "dev") {
            config.baseUrl = "https://api-dev.connectionai.com.au";
          } else if (envName === "stg") {
            config.baseUrl = "https://api-stg.connectionai.com.au";
          } else if (envName === "prod") {
            config.baseUrl = "https://api.connectionai.com.au";
          }
          
// -------- DATABASE CONNECTION CONFIG ------

    on("task", {
        async queryDatabase({ query }) {
 
          try {
            const pool = await sql.connect({
              server: config.env.DB_SERVER,
              database: config.env.DB_NAME,
              authentication: {
                type: "azure-active-directory-service-principal-secret",
                options: {
                  clientId: config.env.DB_CLIENT_ID,
                  tenantId: config.env.DB_TENANT_ID,
                  clientSecret: config.env.DB_CLIENT_SECRET
                },
              },
              options: {
                encrypt: true,
              },
            });
 
            const result = await pool.request().query(query);
            if (!result || !result.recordset) {
             return [];  // return empty array instead of undefined
            }
            return result.recordset;
          } catch (err) {
            console.error("DB Error:", err);
            throw err;
          }
        },
      });
    
          //cucumber plugin
          await addCucumberPreprocessorPlugin(on, config);
          //esbuild bundler
            on(
              "file:preprocessor",
              createBundler({
                plugins: [createEsbuildPlugin(config)],
              })
            );
    
            return config;
          },


// -------- ASYNCH API TIMEOUT CONFIG ------

    // increase timeouts to allow > 20 minute async operations
    defaultCommandTimeout: 30000,   // 25 min for commands
    requestTimeout: 30000,
    responseTimeout: 30000,
    // overall test timeout (milliseconds). Set to 25 minutes = 1,500,000 ms
    testTimeout: 30000
  },

// ---------- AZURE BLOB CONFIG ---------

  env: {
    ...envFromJson,
    AZURE_STORAGE_SAS: process.env.AZURE_STORAGE_SAS || envFromJson.AZURE_STORAGE_SAS || '',
    AZURE_STORAGE_ACCOUNT: process.env.AZURE_STORAGE_ACCOUNT || envFromJson.AZURE_STORAGE_ACCOUNT || '',
    AZURE_CONTAINER: process.env.AZURE_CONTAINER || envFromJson.AZURE_CONTAINER || '',
    DB_CLIENT_ID: process.env.DB_CLIENT_ID || envFromJson.DB_CLIENT_ID || '',
    DB_TENANT_ID: process.env.DB_TENANT_ID || envFromJson.DB_TENANT_ID || '',
    DB_CLIENT_SECRET: process.env.DB_CLIENT_SECRET || envFromJson.DB_CLIENT_SECRET || '',
    DB_NAME: process.env.DB_NAME || envFromJson.DB_NAME || '',
    DB_SERVER: process.env.DB_SERVER || envFromJson.DB_SERVER || '',
    TOKEN_SCOPE: process.env.TOKEN_SCOPE || envFromJson.TOKEN_SCOPE || '',
    TOKEN_URL: process.env.TOKEN_URL || envFromJson.TOKEN_URL || '',
    AUTH_CLIENT_ID: process.env.AUTH_CLIENT_ID || envFromJson.AUTH_CLIENT_ID || '',
    AUTH_CLIENT_SECRET: process.env.AUTH_CLIENT_SECRET || envFromJson.AUTH_CLIENT_SECRET || '',
    X_API_KEY: process.env.X_API_KEY || envFromJson.X_API_KEY || '',
  },

  // ---------- HTML Reporter CONFIG ---------

  reporter: "mochawesome",
  reporterOptions: {
    reportDir: `cypress/reports/${process.env.ENV_NAME || "dev"}/mochawesome`,
    overwrite: false,
    html: false,
    json: true,
    chart: true,
    reportFilename: "[name]-[uuid]" ,
    code: false,
    reportTitle: "DBM API Test Report",
  },
})
