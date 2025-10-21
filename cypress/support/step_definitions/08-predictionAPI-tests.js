import { defineStep } from "@badeball/cypress-cucumber-preprocessor";
import {createProject, startPredictionProcess, getPredictionTaskStatus} from '../reusable.js'
import { getGuidsFromPartsTable , deletePredictionMetric } from '../db.js'
import { fetchPredictionMetric, closePredictionJob, ifcUploadHelper, waitForPredictionCompleted} from '../reusable.js'
let projectGuid,versionGuid;

//-----------------------------------------------------------------------------//
            // PREDICTION PROCESS POSITIVE SCENARIOS
//-----------------------------------------------------------------------------//

// Create project and save GUID
defineStep("New project created for predictionAPI", () => {
  createProject().then((projectResponse) => {
    expect(projectResponse.status).to.eq(201);

    projectGuid = projectResponse.body.project_guid;
    expect(projectGuid, "project_guid should be returned").to.not.be.undefined;

    cy.wrap(projectGuid).as("projectGuid");
   // this.projectGuid = projectGuid;
  });
});


// Start Prediction Process
defineStep("I start prediction process by uploading {string}", (fileName) => {

        // Upload IFC file
  cy.get("@projectGuid").then((projectGuid) => {
    ifcUploadHelper(fileName, projectGuid).then((responses) => {
      cy.log("IFC Upload Response:", JSON.stringify(responses.body));
      // Save aliases for later steps
      cy.wrap(responses).as("predictionUploadResponse");
    });
  });

  // Get GUIDs from <Parts_Reports> DB
  cy.log(`Looking for document_name = "${fileName}"`);
  getGuidsFromPartsTable(fileName).then((rows) => {
  expect(rows.length, `No rows found for ${fileName}`).to.be.greaterThan(0);
  const { project_guid, version_guid } = rows[0];
  expect(project_guid, "project_guid should exist").to.be.a("string").and.not.be.empty;
  expect(version_guid, "version_guid should exist").to.be.a("string").and.not.be.empty;
  cy.wrap(project_guid).as("projectGuid");
  cy.wrap(version_guid).as("versionGuid");
});

  // Start Prediction
  cy.get("@projectGuid").then((projectGuid) => {
    cy.get("@versionGuid").then((versionGuid) => {
      startPredictionProcess(projectGuid, versionGuid).then((resp) => {
        cy.log("Prediction Response:", JSON.stringify(resp.body, null, 2));
        cy.wrap(resp).as("predictionStartResponse");
      });
    });
  });
});

defineStep("the Prediction Response Status is {int}", (statusCode) => {
  cy.get("@predictionStartResponse").then((resp) => {
  expect
  (resp.status, `Expected : ${statusCode}, Actual : ${resp.status}`).to.eq(statusCode);
  });
});

// Extract and store values from prediction start response
defineStep("the prediction response contains values", () => {
  cy.get("@predictionStartResponse").then((resp) => {
    // Assert required properties
    expect(resp.body).to.have.property("status");
    expect(resp.body).to.have.property("job_id");
    expect(resp.body).to.have.property("task_id");
    expect(resp.body).to.have.property("message");
    expect(resp.body).to.have.property("project_guid");
    expect(resp.body).to.have.property("version_guid");

    // Extract values
    const { status, job_id, task_id, message, project_guid, version_guid } = resp.body;

    // Store for later use in other steps
    cy.wrap(status).as("predictionStatus");
    cy.wrap(job_id).as("jobId");
    cy.wrap(task_id).as("taskId");
    cy.wrap(message).as("predictionMessage");
    cy.wrap(project_guid).as("projectGuid");
    cy.wrap(version_guid).as("versionGuid");

    // Optionally keep on scenario context
    cy.then(function () {
      this.predictionStatus = status;
      this.jobId = job_id;
      this.taskId = task_id;
      this.predictionMessage = message;
      this.projectGuid = project_guid;
      this.versionGuid = version_guid;
    });
  });
});

// Fetch eligibility task status using jobId/taskId
defineStep("I fetch the prediction task status", () => {
  cy.get("@jobId").then((jobId) => {
    cy.get("@taskId").then((taskId) => {
      getPredictionTaskStatus(jobId, taskId).then((response) => {
        cy.log("Prediction Task Status Response:", JSON.stringify(response.body, null, 2));
              cy.wrap(response).as("predictionTaskStatusResponse");
              const { task_status } = response.body;
              cy.wrap(task_status).as("taskStatus");
      });
    });
  });
});

  defineStep("the prediction task status response is 200", (jobId, taskId) => {
  cy.get("@predictionTaskStatusResponse").then((response) => {
    expect(response.status).to.eq(200);
  });
});

defineStep('I wait until prediction is completed and fetch the metric', () => {
  cy.get('@jobId').then((jobId) => {
    cy.get('@taskId').then((taskId) => {
      cy.get('@projectGuid').then((projectGuid) => {
        waitForPredictionCompleted(jobId, taskId).then((resp) => {
          //fetchPredictionMetric(projectGuid).then((resp) => {
            cy.log('Prediction Metric Response:', JSON.stringify(resp.body));
            cy.wrap(resp).as('predictionMetricResponse');
            if (resp.body) cy.wrap(resp.body).as('predictionMetricBody');
          });
        });
      });
    });
  });
//});

defineStep("I delete prediction metric for the project", () => {
  cy.get("@projectGuid").then((projectGuid) => {
    deletePredictionMetric(projectGuid).then((result) => {
      cy.log(`Deleted eligibility metrics: ${result.rowsAffected}`);
    });
  });
});