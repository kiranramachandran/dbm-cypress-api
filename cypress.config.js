
const { defineConfig } = require('cypress')
 const allureWriter = require('@shelex/cypress-allure-plugin/writer');
 require('dotenv').config();


module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.BASE_URL || 'https://api-dev.connectionai.com.au/',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents(on, config) {
       allureWriter(on, config);
      require('./cypress/plugins')(on, config)
       
   // -------- ENVIRONMENTS CONFIG ------
   
   
          const environment = config.env.environment || 'dev'; // Default to 'dev'
          if (config.env[environment]) {
            config.baseUrl = config.env[environment].apiUrl;
          }


      allureWriter(on, config);
      return config
    },

// -------- ASYNCH API TIMEOUT CONFIG ------

    // increase timeouts to allow > 20 minute async operations
    defaultCommandTimeout: 1500000,   // 25 min for commands
    requestTimeout: 1500000,
    responseTimeout: 1500000,
    // overall test timeout (milliseconds). Set to 25 minutes = 1,500,000 ms
    testTimeout: 1500000
  },

// ---------- AZURE BLOB CONFIG ---------

  env: {
    AZURE_STORAGE_SAS: "sp=racwdl&st=2025-08-29T03:18:18Z&se=2025-10-02T11:33:18Z&spr=https&sv=2024-11-04&sr=c&sig=NecWpiESNLW4ePRJHwlNcRHgkwIE02P0XLhA3ScQA9U%3D",
    AZURE_STORAGE_ACCOUNT: "cxaieusdevclzifcdb1st01",
    AZURE_CONTAINER: "upload-file/67b5c34d-7e45-44ee-8b10-067e7937ee5a",
  },


  // ---------- MOCHAWESOME REPORTER CONFIG ---------

   reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
 reporterEnabled: "spec, mochawesome",
    mochawesomeReporterOptions: {
      reportDir: "cypress/reports/mochawesome",
      reportFilename: "[name]-[status]-[datetime]-[hash]",
      overwrite: true,
      html: true,         // generate JSON only during run
      json: false,          // JSON is later merged -> HTML
      charts: true,
      embeddedScreenshots: true,
      inlineAssets: true
    }
  }
})
