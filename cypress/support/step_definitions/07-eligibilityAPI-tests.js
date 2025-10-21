import { defineStep } from "@badeball/cypress-cucumber-preprocessor";
// ------------------ Reusable Helpers ------------------
import {
  createProject,
  uploadIfcFile,
  startEligibilityProcess,
  getEligibilityTaskStatus,
  fetchEligibilityMetric,
  closeEligibilityJob,
  ifcUploadHelper,
  waitForEligibilityCompleted
} from "../reusable.js";

// ------------------ Database Helpers ------------------
import {
  getGuidsFromPartsTable,
  deleteProjectData,
  deletePartsReportByDocument,
  deletePartsReportVersions,
  deleteDocumentByName,
  deletePartsReportByProjectId,
  deleteEligibilityMetric,
  deleteEligibilityData
} from "../db.js";


const invalid_guid = "1000000";
let projectGuid,versionGuid;


//-----------------------------------------------------------------------------//
            // ELIGIBILITY PROCESS NEGATIVE SCENARIOS
//-----------------------------------------------------------------------------//

    defineStep("Metric not found for the projectGuid", function () {
    cy.getAuthToken()
    .its("body.access_token")
    .should("not.be.empty")
    .then((token) => {
 cy.request({
        method: "GET",
        url: `eligibility-metric/svc/`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-api-key": Cypress.env('X_API_KEY'),
          "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
          "Api-Version": "v1",
        },
        failOnStatusCode: false,
     }).then((resp) => {
    
        // Save if needed later
          this.eligibilityResponse = resp;
  });
});
});

defineStep("Metric not found due to Invalid Projectguid", function () {
    cy.getAuthToken()
    .its("body.access_token")
    .should("not.be.empty")
    .then((token) => {
 cy.request({
        method: "GET",
        url: `eligibility-metric/svc/${invalid_guid}`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-api-key": Cypress.env('X_API_KEY'),
          "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
          "Api-Version": "v1",
        },
        failOnStatusCode: false,
     }).then((resp) => {
    
        // Save if needed later
          this.eligibilityResponse = resp;
  });
});
});

defineStep("the eligibilityAPI negative response is {int}", function (statusCode) {
  expect(this.eligibilityResponse.status).to.eq(statusCode);
});

defineStep("the eligibilityAPI positive response is {int}", function (statusCode) {
  const resp = this.eligibilityResponse;
  cy.log("Eligibility Response:", JSON.stringify(resp.body, null, 2));
  expect(resp.status).to.eq(statusCode);
  expect(resp.body).to.have.property("project_guid");
  expect(resp.body).to.have.property("metric_json");

  // Parse the metric_json string
  const metricJson = JSON.parse(resp.body.metric_json);

  // Assert on individual fields
  expect(metricJson).to.have.property("members_qty");
  expect(metricJson).to.have.property("parts_qty");
  expect(metricJson).to.have.property("conflicted_connections_qty");

  // Or if you want to check multiple keys exist (not specific values):
  expect(metricJson).to.include.all.keys(
    "members_qty",
    "parts_qty",
    "conflicted_connections_qty",
    "connections_qty"
  );
});

//-----------------------------------------------------------------------------//
            // ELIGIBILITY PROCESS E2E POSITIVE SCENARIO
//-----------------------------------------------------------------------------//

// Create project and save GUID
defineStep("New Project created for eligibilityAPI", () => {
  createProject().then((projectResponse) => {
    expect(projectResponse.status).to.eq(201);

    projectGuid = projectResponse.body.project_guid;
    expect(projectGuid, "project_guid should be returned").to.not.be.undefined;

    cy.wrap(projectGuid).as("projectGuid");
   // this.projectGuid = projectGuid;
  });
});

// Start Eligibility Process
defineStep("I start eligibility process by uploading {string}", (fileName) => {

  // Upload IFC file
  ifcUploadHelper(fileName,projectGuid).then((resp) => {
    cy.wrap(fileName).as("fileName"); 
   cy.log("IFC Upload Response:", JSON.stringify(resp.body));
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

  // Start eligibility
  cy.get("@projectGuid").then((projectGuid) => {
    cy.get("@versionGuid").then((versionGuid) => {
      startEligibilityProcess(projectGuid, versionGuid).then((resp) => {
        cy.log("Eligibility Response:", JSON.stringify(resp.body, null, 2));
        cy.wrap(resp).as("eligibilityStartResponse");
      });
    });
  });
});

// Assert on Eligibility Response
defineStep("the Response Status is {int}", (statusCode) => {
  cy.get("@eligibilityStartResponse").then((resp) => {
  expect
  (resp.status, `Expected : ${statusCode}, Actual : ${resp.status}`).to.eq(statusCode);
  });
});

// Extract and store values from eligibility start response
defineStep("the eligibility response contains values", () => {
  cy.get("@eligibilityStartResponse").then((resp) => {
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
    cy.wrap(status).as("eligibilityStatus");
    cy.wrap(job_id).as("jobId");
    cy.wrap(task_id).as("taskId");
    cy.wrap(message).as("eligibilityMessage");
    cy.wrap(project_guid).as("projectGuid");
    cy.wrap(version_guid).as("versionGuid");

    // Optionally keep on scenario context
    cy.then(function () {
      this.eligibilityStatus = status;
      this.jobId = job_id;
      this.taskId = task_id;
      this.eligibilityMessage = message;
      this.projectGuid = project_guid;
      this.versionGuid = version_guid;
    });
  });
});

// Fetch eligibility task status using jobId/taskId
defineStep("I fetch the eligibility task status", () => {
  cy.get("@jobId").then((jobId) => {
    cy.get("@taskId").then((taskId) => {
      getEligibilityTaskStatus(jobId, taskId).then((response) => {
        cy.log("Eligibility Task Status Response:", JSON.stringify(response.body, null, 2));
            // Wrap whole response for later steps
              cy.wrap(response).as("eligibilityTaskStatusResponse");
              // Also store the task_status separately for conditional checks
              const { task_status } = response.body;
              cy.wrap(task_status).as("taskStatus");
      });
    });
  });
});

  defineStep("the eligibility task status response is 200", (jobId, taskId) => {
  cy.get("@eligibilityTaskStatusResponse").then((response) => {
    expect(response.status).to.eq(200);
  });
});

defineStep('I wait until eligibility is completed and fetch the metric', () => {
  cy.get('@jobId').then((jobId) => {
    cy.get('@taskId').then((taskId) => {
      cy.get('@projectGuid').then((projectGuid) => {
        waitForEligibilityCompleted(jobId, taskId).then(() => {
          fetchEligibilityMetric(projectGuid).then((resp) => {
            cy.log('Eligibility Metric Response:', JSON.stringify(resp.body));
            cy.wrap(resp).as('eligibilityMetricResponse');
            if (resp.body) cy.wrap(resp.body).as('eligibilityMetricBody');
          });
        });
      });
    });
  });
});

// Step: Validate eligibility metric only if task_status is completed
defineStep("the eligibility metric response contains required values", () => {
  cy.get("@taskStatus").then((taskStatus) => {
    if (taskStatus === "completed") {
      cy.get("@eligibilityMetricResponse").then((resp) => {
        expect(resp.status).to.eq(200);

        // Validate the body structure
        expect(resp.body).to.have.property("members_qty");
        expect(resp.body).to.have.property("parts_qty");
        expect(resp.body).to.have.property("connections_qty");

        // Example numeric checks
        expect(resp.body.members_qty).to.be.a("number");
        expect(resp.body.parts_qty).to.be.a("number");
        expect(resp.body.connections_qty).to.be.a("number");
      });
    } else {
      cy.log(`Skipping validation because task_status=${taskStatus}`);
    }
  });
});

//-----------------------------------------------------------------------------//
            // DATA TEAR-DOWN
//-----------------------------------------------------------------------------//

defineStep("I delete parts report for document {string}", (fileName) => {
  deletePartsReportByDocument(fileName).then((result) => {
    cy.log(`Deleted parts report rows: ${result.rowsAffected}`);
  });
});

defineStep("I delete parts report for the project", () => {
  cy.get("@projectGuid").then((projectGuid) => {
    deletePartsReportByProjectId(projectGuid).then((result) => {
      cy.log(`Deleted parts report rows: ${result.rowsAffected}`);
    });
  });
});

defineStep("I delete parts report versions for the project", () => {
  cy.get("@projectGuid").then((projectGuid) => {
    deletePartsReportVersions(projectGuid).then((result) => {
      cy.log(`Deleted parts report versions: ${result.rowsAffected}`);
    });
  });
});

defineStep("I delete document {string} for the project", (fileName) => {
  cy.get("@projectGuid").then((projectGuid) => {
    deleteDocumentByName(fileName, projectGuid).then((result) => {
      cy.log(`Deleted document rows: ${result.rowsAffected}`);
    });
  });
});

defineStep("I delete eligibility metric for the project", () => {
  cy.get("@projectGuid").then((projectGuid) => {
    deleteEligibilityMetric(projectGuid).then((result) => {
      cy.log(`Deleted eligibility metrics: ${result.rowsAffected}`);
    });
  });
});

defineStep("I delete the project data", () => {
  cy.get("@projectGuid").then((projectGuid) => {
    deleteProjectData(projectGuid).then((result) => {
      cy.log(`Deleted project rows: ${result.rowsAffected}`);
    });
  });
});

defineStep("I delete all eligibility data for the project", function () {
  cy.get("@projectGuid").then((project_guid) => {
    expect(project_guid, "Project GUID must exist").to.not.be.undefined;

    deleteEligibilityData(project_guid).then(() => {
      cy.log(`Eligibility data deleted successfully for project: ${project_guid}`);
    });
  });
});

// NOT YET IMPLEMENTED BY DEVELOPER - IGNORE FOR NOW

// defineStep("I close the eligibility job", function () {
//   cy.get("@jobId").then((jobId) => {
//     closeEligibilityJob(jobId).then((response) => {
//       cy.log("Close Eligibility Job Response:", JSON.stringify(response.body));
//       cy.wrap(response).as("eligibilityCloseResponse");
//     });
//   });
// });

// NOT YET IMPLEMENTED BY DEVELOPER - IGNORE FOR NOW

// defineStep("the eligibility close response is successful", () => {
//   cy.get("@eligibilityCloseResponse").then((resp) => {
//     // Check status code
//     expect(resp.status).to.be.oneOf([200, 202]);

//     // Check key fields exist in the body (adjust to your API spec)
//     expect(resp.body).to.have.property("status");
//     expect(resp.body).to.have.property("job_id");
//     expect(resp.body).to.have.property("message");

//     // Optionally store values as aliases for later steps
//     cy.wrap(resp.body.status).as("closeStatus");
//     cy.wrap(resp.body.message).as("closeMessage");
//   });
// });



