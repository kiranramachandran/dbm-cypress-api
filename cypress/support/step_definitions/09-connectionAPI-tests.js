import { defineStep } from "@badeball/cypress-cucumber-preprocessor";

// DB Helpers
import {
  getConnectionOptionGuid,
  queryPredictionActionsTable,
  getGuidsFromPartsTable,
  getPredictionActionStatus,
  getEligibilityProfileCount,
  deleteOverallConnectionMetrics,
  deleteEligibilityMetric,
  deleteEligibilityConnection,
  deleteEligibilityMember,
  deletePrediction,
  deletePredictionActions,
  deletePredictionOption,
  deleteDropReasonsByProjectAndVersion,
  deletePredictionSelectedConnection,
  deleteFromPredictionAttribute,
  deleteFromPredictionMetric,
  deleteFromPredictionBatchSetting,
  getEligibilityProfileSummary,
  getPrimaryProfileCount,
  getSecondaryProfileCount,
  getConnectionList,
  deleteEligibilityAndPredictionData,
  view_eligibility_connection_summary
} from "../db.js";

// Reusable API Helpers
import {
  createProject,
  ifcUploadHelper,
  startEligibilityProcess,
  startPredictionProcess,
  fetchEligibilityMetric,
  waitForEligibilityCompleted,
  waitForPredictionCompleted,
} from "../reusable.js";

let projectGuid, versionGuid;


defineStep("I execute full eligibility and prediction workflow for {string}", (fileName) => {
 
  // 1. Create Project
  cy.log("Creating new project...");
  createProject().then((projectResponse) => {
    expect(projectResponse.status).to.eq(201);
    const projectGuid = projectResponse.body.project_guid;
    expect(projectGuid, "project_guid should be returned").to.not.be.undefined;
    cy.wrap(projectGuid).as("projectGuid");
    cy.log(`Project created: ${projectGuid}`);

    // 2. Upload IFC File
    cy.log(`Uploading IFC file: ${fileName}`);
    ifcUploadHelper(fileName, projectGuid).then((uploadResp) => {
      cy.log("IFC Upload Response:", JSON.stringify(uploadResp.body));

      // 3. Fetch GUIDs from parts_report
      cy.log(`Fetching GUIDs for document: ${fileName}`);
      getGuidsFromPartsTable(fileName).then((rows) => {
        expect(rows.length, `No rows found for ${fileName}`).to.be.greaterThan(0);
        const { project_guid, version_guid } = rows[0];
        cy.wrap(project_guid).as("projectGuid");
        cy.wrap(version_guid).as("versionGuid");

        // 4. Start Eligibility
        cy.log("Starting Eligibility Process...");
        startEligibilityProcess(project_guid, version_guid).then((eligResp) => {
          cy.log("Eligibility Start Response:", JSON.stringify(eligResp.body, null, 2));
          const { job_id, task_id } = eligResp.body;
          cy.wrap(job_id).as("eligibilityJobId");
          cy.wrap(task_id).as("eligibilityTaskId");

          // 5. Poll Eligibility Status
          cy.log("Polling Eligibility Task Status...");
          waitForEligibilityCompleted(job_id, task_id).then(() => {
            cy.log("Eligibility process completed!");

            // // 6. Fetch Eligibility Metric
            // fetchEligibilityMetric(project_guid).then((metricResp) => {
            //   expect(metricResp.status).to.eq(200);
            //   cy.log(`Eligibility Metrics: ${JSON.stringify(metricResp.body)}`);
            // });

            // 7. Start Prediction Process
            cy.log("Starting Prediction Process...");
            startPredictionProcess(project_guid, version_guid).then((predResp) => {
              cy.log("Prediction Start Response:", JSON.stringify(predResp.body, null, 2));
              const { job_id: predJobId, task_id: predTaskId } = predResp.body;
              cy.wrap(predJobId).as("predictionJobId");
              cy.wrap(predTaskId).as("predictionTaskId");

              // 8. Poll Prediction Status
              cy.log("Polling Prediction Task Status...");
              waitForPredictionCompleted(predJobId, predTaskId).then(() => {
                cy.log("Prediction process completed!");
              });
            });
          });
        });
      });
    });
  });
});

defineStep("I fetch the connection guid and option guid for the project", function () {
  cy.get("@projectGuid").then((projectGuid) => {
    getConnectionOptionGuid(projectGuid).then((rows) => {
      cy.log(`Fetched ${rows.length} rows from prediction_option`);
      cy.wrap(rows).as("connectionOptionRows"); // store for later use

      // Example: log first record
      if (rows.length > 0) {
        const { connection_guid, option_guid } = rows[0];
        cy.log(`Connection GUID: ${connection_guid}`);
        cy.log(`Option GUID: ${option_guid}`);
      }
    });
  });
});

defineStep("I keep connection on ConnectionsAPI successfully", function () {
  cy.get("@projectGuid").then((projectGuid) => {
    expect(projectGuid, "Project GUID must exist").to.not.be.undefined;

    cy.get("@connectionOptionRows").then((rows) => {
      expect(rows.length, "At least one connection/option pair expected").to.be.greaterThan(0);

      // Pick the first connection/option pair
      const { connection_guid, option_guid } = rows[0];
      cy.log(`Using connection_guid=${connection_guid}, option_guid=${option_guid}`);

      // Get token and call Connections API
      cy.getAuthToken()
        .its("body.access_token")
        .should("not.be.empty")
        .then((token) => {
          cy.request({
            method: "POST",
            url: `/connection/svc/${projectGuid}/keep`,
            body: {
              connections: [
                {
                  connection_guid,
                  option_guid,
                },
              ],
            },
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "x-api-key": Cypress.env("X_API_KEY"),
              "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
              "Api-Version": "v1",
            },
            failOnStatusCode: false,
          }).then((response) => {
            cy.log("KEEP Connections Response: " + JSON.stringify(response.body));

            // ✅ Validate API Response
            expect(
              [200, 204],
              `Expected 200 or 204 but got ${response.status}`
            ).to.include(response.status);

            if (response.status === 200 && response.body) {
              expect(response.body).to.have.property("status").and.to.eq("success");
              cy.log("✅ Connection kept successfully (200)");
            } else if (response.status === 204) {
              cy.log("✅ Connection kept successfully (204 No Content)");
            } else {
              throw new Error(`Unexpected response: ${JSON.stringify(response.body)}`);
            }

            // Save aliases if needed later
            cy.wrap(response).as("keepConnectionsResponse");
            cy.wrap(projectGuid).as("keepProjectGuid");
          });
        });
    });
  });
});

defineStep("I fetch prediction actions for the project", function () {
  cy.get("@projectGuid").then((projectGuid) => {
    queryPredictionActionsTable(projectGuid).then((rows) => {
      cy.log(`Fetched ${rows.length} rows from prediction_option for project ${projectGuid}`);

      // Save full table response for reuse
      cy.wrap(rows).as("predictionActionsRows");

      // Log details of each row
      if (rows.length > 0) {
        rows.forEach((row, index) => {
          cy.log(
            `Row ${index + 1}: connection_guid=${row.connection_guid}, option_guid=${row.option_guid}, status=${row.status}`
          );
        });
      } else {
        cy.log("No records found in prediction_option for this project");
      }
    });
  });
});

defineStep("the prediction actions table should have valid GUIDs and status", () => {
  cy.get("@predictionActionsRows").then((rows) => {
    expect(rows.length, "Should have at least one prediction action").to.be.greaterThan(0);

    rows.forEach((row) => {
      expect(row.connection_guid, "connection_guid should not be null").to.not.be.empty;
      expect(row.option_guid, "option_guid should not be null").to.not.be.empty;
      expect(row.status, "status should not be null").to.not.be.empty;
    });
  });
});

defineStep("I drop connection on ConnectionsAPI successfully", function () {
  cy.get("@projectGuid").then((projectGuid) => {
    expect(projectGuid, "Project GUID must exist").to.not.be.undefined;

    cy.get("@connectionOptionRows").then((rows) => {
      expect(rows.length, "At least one connection/option pair expected").to.be.greaterThan(0);

      // Pick the first connection/option pair
      const { connection_guid, option_guid } = rows[0];
      cy.log(`Using connection_guid=${connection_guid}, option_guid=${option_guid}`);

      // Get token and call Connections API
      cy.getAuthToken()
        .its("body.access_token")
        .should("not.be.empty")
        .then((token) => {
          cy.request({
            method: "POST",
            url: `/connection/svc/${projectGuid}/drop`,
            body: {
              connections: [
                {
                  connection_guid,
                  option_guid,
                  "reason_id": 1,
                  "comments": "Too many bolts"
                },
              ],
            },
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "x-api-key": Cypress.env("X_API_KEY"),
              "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
              "Api-Version": "v1",
            },
            failOnStatusCode: false,
          }).then((response) => {
            cy.log("DROP Connections Response: " + JSON.stringify(response.body));

            // Validate API Response
            expect(
              [200, 204],
              `Expected 200 or 204 but got ${response.status}`
            ).to.include(response.status);

            if (response.status === 200 && response.body) {
              expect(response.body).to.have.property("status").and.to.eq("success");
              cy.log("Connection dropped successfully (200)");
            } else if (response.status === 204) {
              cy.log("Connection dropped successfully (204 No Content)");
            } else {
              throw new Error(`Unexpected response: ${JSON.stringify(response.body)}`);
            }

            // Save aliases if needed later
            cy.wrap(response).as("dropConnectionsResponse");
            cy.wrap(projectGuid).as("dropProjectGuid");
          });
        });
    });
  });
});


//--------- CONNECTION STATUS --------------//

defineStep("I update connection status", function () {
  cy.get("@projectGuid").then((projectGuid) => {
    expect(projectGuid, "Project GUID must exist").to.not.be.undefined;

    cy.get("@connectionOptionRows").then((rows) => {
      expect(rows.length, "At least one connection/option pair expected").to.be.greaterThan(0);

      // Pick the first connection/option pair
      const { connection_guid, option_guid } = rows[0];
      cy.log(`Using connection_guid=${connection_guid}, option_guid=${option_guid}`);

      // Get token and call Connections API
      cy.getAuthToken()
        .its("body.access_token")
        .should("not.be.empty")
        .then((token) => {
          cy.request({
            method: "PUT",
            url: `/connection/svc/${projectGuid}/status`,
                body: {
                  connection_guid,
                  option_guid,
                  status: "kept"
                },
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "x-api-key": Cypress.env("X_API_KEY"),
              "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
              "Api-Version": "v1",
            },
            failOnStatusCode: false,
          }).then((response) => {
            cy.log("Connection status Response: " + JSON.stringify(response.body));

            // Validate API Response
            expect(
              [200, 204],
              `Expected 200 or 204 but got ${response.status}`
            ).to.include(response.status);

            if (response.status === 200 && response.body) {
              expect(response.body).to.have.property("status").and.to.eq("success");
              cy.log("Connection status Updated Successfully (200)");
            } else if (response.status === 204) {
              cy.log("Connection status Updated Successfully (204 No Content)");
            } else {
              throw new Error(`Unexpected response: ${JSON.stringify(response.body)}`);
            }

            // Save aliases if needed later
            cy.wrap(response).as("connectionStatusResponse");
            cy.wrap(projectGuid).as("conStatusProjectGuid");
          });
        });
    });
  });
});

//--------- CONNECTION METRICS --------------//

defineStep("I get overall connection metrics", function () {
  cy.get("@projectGuid").then((projectGuid) => {
    expect(projectGuid, "Project GUID must exist").to.not.be.undefined;

    cy.get("@connectionOptionRows").then((rows) => {
      expect(rows.length, "At least one connection/option pair expected").to.be.greaterThan(0);

      // Pick the first connection/option pair
      const { connection_guid, option_guid } = rows[0];
      cy.log(`Using connection_guid=${connection_guid}, option_guid=${option_guid}`);

      // Get token and call Connections API
      cy.getAuthToken()
        .its("body.access_token")
        .should("not.be.empty")
        .then((token) => {
          cy.request({
            method: "GET",
            url: `/connection/svc/${projectGuid}/metrics`,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "x-api-key": Cypress.env("X_API_KEY"),
              "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
              "Api-Version": "v1",
            },
            failOnStatusCode: false,
          }).then((response) => {
            cy.log("Overall Connection Metrics Response: " + JSON.stringify(response.body));

            // Validate API Response
            expect(
              [200, 204],
              `Expected 200 or 204 but got ${response.status}`
            ).to.include(response.status);

            if (response.status === 200 && response.body) {
              cy.log("Overall Connection Metrics Response (200)");
            } else if (response.status === 204) {
              cy.log("Overall Connection Metrics Response (204 No Content)");
            } else {
              throw new Error(`Unexpected response: ${JSON.stringify(response.body)}`);
            }

            // Save aliases if needed later
            cy.wrap(response).as("connectionMetricsResponse");
            cy.wrap(projectGuid).as("conStatusProjectGuid");
          });
        });
    });
  });
});

defineStep("I fetch prediction action status for the project", function () {
  cy.get("@projectGuid").then((projectGuid) => {
    getPredictionActionStatus(projectGuid).then((rows) => {
      const { kept, dropped } = rows[0];
      cy.log(`Prediction Actions → Kept: ${kept}, Dropped: ${dropped}`);
      cy.wrap(kept).as("keptCount");
      cy.wrap(dropped).as("droppedCount");
    });
  });
});

defineStep("I fetch eligibility profile count for the project", function () {
  cy.get("@projectGuid").then((projectGuid) => {
    getEligibilityProfileCount(projectGuid).then((rows) => {
      const total = rows[0].total;
      cy.log(`Eligibility Profiles → Total: ${total}`);
      cy.wrap(total).as("eligibilityProfileCount");
    });
  });
});


defineStep("Then I delete overall connection metrics for the project", function () {
  cy.get("@projectGuid").then((projectGuid) => {
    cy.log(`Deleting overall connection metrics for project: ${projectGuid}`);

    deleteOverallConnectionMetrics(projectGuid).then(() => {
      cy.log(`Successfully deleted connection metrics (part 1) for project_guid: ${projectGuid}`);
    });
  });
});


//--------- CONNECTION COUNTS --------------//

defineStep("I get connection counts for a project", function () {
  cy.get("@projectGuid").then((projectGuid) => {
    expect(projectGuid, "Project GUID must exist").to.not.be.undefined;

     cy.get("@versionGuid").then((versionGuid) => {
    expect(versionGuid, "Version GUID must exist").to.not.be.undefined;

    cy.get("@connectionOptionRows").then((rows) => {
      expect(rows.length, "At least one connection/option pair expected").to.be.greaterThan(0);

      // Pick the first connection/option pair
      const { connection_guid, option_guid } = rows[0];
      cy.log(`Using connection_guid=${connection_guid}, option_guid=${option_guid}`);

      // Get token and call Connections API
      cy.getAuthToken()
        .its("body.access_token")
        .should("not.be.empty")
        .then((token) => {
          cy.request({
            method: "GET",
            url: `/connection/svc/${projectGuid}/${versionGuid}/bcf/count`,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "x-api-key": Cypress.env("X_API_KEY"),
              "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
              "Api-Version": "v1",
            },
            failOnStatusCode: false,
          }).then((response) => {
            cy.log("Get Connection Counts Response: " + JSON.stringify(response.body));

            // Validate API Response
            expect(
              [200, 204],
              `Expected 200 or 204 but got ${response.status}`
            ).to.include(response.status);

            if (response.status === 200 && response.body) {
              cy.log("Get Connection Count Success (200)");
            } else if (response.status === 204) {
              cy.log("Get Connection Count Success (204 No Content)");
            } else {
              throw new Error(`Unexpected response: ${JSON.stringify(response.body)}`);
            }

            // Save aliases if needed later
            cy.wrap(response).as("connectionCountResponse");
            cy.wrap(projectGuid).as("conStatusProjectGuid");
          });
        });
    });
  });
});
});

defineStep("Then I fetch connection count for a project from DB", function () {
  cy.get("@projectGuid").then((projectGuid) => {
    cy.get("@versionGuid").then((versionGuid) => {
      cy.log(`Fetching eligibility profile summary for project: ${projectGuid} | version: ${versionGuid}`);

      getEligibilityProfileSummary(projectGuid, versionGuid).then((result) => {
        const { connection_count, profile_count } = result[0];

        cy.log(`Connection Count: ${connection_count}`);
        cy.log(`Profile Count: ${profile_count}`);

        // Store the result for later validation
        cy.wrap(connection_count).as("connectionCount");
        cy.wrap(profile_count).as("profileCount");
      });
    });
  });
});

//--------- PRIMARY MEMBER --------------//

defineStep("I retrieve primary member counts on project and version", function () {
  cy.get("@projectGuid").then((project_guid) => {
    expect(project_guid, "Project GUID must exist").to.not.be.undefined;

    cy.get("@versionGuid").then((version_guid) => {
      expect(version_guid, "Version GUID must exist").to.not.be.undefined;

      cy.getAuthToken()
        .its("body.access_token")
        .should("not.be.empty")
        .then((token) => {
          cy.request({
            method: "POST",
            url: `/connection/svc/primary-members`,
            body: {
              project_guid,
              version_guid,
              framing_condition: "bbw",
              limit: 10,
              offset: 0,
            },
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "x-api-key": Cypress.env("X_API_KEY"),
              "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
              "Api-Version": "v1",
            },
            failOnStatusCode: false,
          }).then((response) => {
            cy.log("Response: " + JSON.stringify(response.body));

            expect([200, 204]).to.include(
              response.status,
              `Expected 200 or 204 but got ${response.status}`
            );

            cy.wrap(response).as("retrievePrimaryMemberResponse");
          });
        });
    });
  });
});

defineStep("I validate the primary members response", function () {
  cy.get("@retrievePrimaryMemberResponse").then((response) => {
    const body = response.body;

    // Assert HTTP status
    expect(response.status, "Response status should be 200").to.eq(200);

    // Assert members array exists and has at least one item
    expect(body.members, "Members array should exist").to.be.an("array").and.not.be.empty;

    // Validate first member structure
    const firstMember = body.members[0];
    expect(firstMember, "First member should exist").to.have.all.keys(
      "name",
      "profile",
      "primary_member_count",
      "status"
    );

    // Validate member data types
    expect(firstMember.name, "Name should be a string").to.be.a("string");
    expect(firstMember.profile, "Profile should be a string").to.be.a("string");
    expect(firstMember.primary_member_count, "Primary member count should be a number").to.be.a("number");
    expect(firstMember.status, "Status should be a string").to.be.a("string");

    // Optional: specific value assertions
    expect(firstMember.status).to.be.oneOf(["Pending", "Completed", "InProgress"]);

    // Validate pagination structure
    expect(body.pagination, "Pagination object should exist").to.be.an("object");
    expect(body.pagination.limit, "Pagination limit should be a number").to.be.a("number");
    expect(body.pagination.offset, "Pagination offset should be a number").to.be.a("number");
    expect(body.pagination.has_more, "Pagination has_more should be a boolean").to.be.a("boolean");

    // Log key info for debug
    cy.log(`✅ Primary Members count: ${firstMember.primary_member_count}`);
    cy.log(`✅ First Member: ${firstMember.name} (${firstMember.profile})`);
  });
});


defineStep("I verify primary profile count from DB", function () {
  cy.get("@projectGuid").then((projectGuid) => {
    expect(projectGuid, "Project GUID should exist").to.not.be.undefined;

    cy.get("@versionGuid").then((versionGuid) => {
      expect(versionGuid, "Version GUID should exist").to.not.be.undefined;

      getPrimaryProfileCount(projectGuid, versionGuid).then((rows) => {
        expect(rows, "Query should return results").to.be.an("array").and.not.be.empty;

        const record = rows[0];
        cy.log("Primary Profile Count Record:", JSON.stringify(record));

        expect(record).to.have.property("project_guid", projectGuid);
        expect(record).to.have.property("version_guid", versionGuid);
        expect(record).to.have.property("framing_condition", "bbw");
        expect(record).to.have.property("primarycount").that.is.a("number").and.gte(0);

        // Save for later use if needed
        cy.wrap(record.profile_count).as("primaryProfileCount");
      });
    });
  });
});


//--------- SECONDARY  MEMBER --------------//

defineStep("I retrieve secondary member counts on project and version", function () {
  cy.get("@projectGuid").then((project_guid) => {
    expect(project_guid, "Project GUID must exist").to.not.be.undefined;

    cy.get("@versionGuid").then((version_guid) => {
      expect(version_guid, "Version GUID must exist").to.not.be.undefined;

      cy.getAuthToken()
        .its("body.access_token")
        .should("not.be.empty")
        .then((token) => {
          cy.request({
            method: "POST",
            url: `/connection/svc/secondary-members`,
            body: {
              project_guid,
              version_guid,
              name: "GIRDER_BEAM",
              profile: "W24X64",
              framing_condition: "bcw",
              limit: 10,
              offset: 0,
            },
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "x-api-key": Cypress.env("X_API_KEY"),
              "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
              "Api-Version": "v1",
            },
            failOnStatusCode: false,
          }).then((response) => {
            cy.log("Response: " + JSON.stringify(response.body));

            expect([200, 204]).to.include(
              response.status,
              `Expected 200 or 204 but got ${response.status}`
            );

            cy.wrap(response).as("retrieveSecondaryMemberResponse");
          });
        });
    });
  });
});

defineStep("I validate the secondary members response", function () {
  cy.get("@retrieveSecondaryMemberResponse").then((response) => {
    const body = response.body;

    // Validate HTTP status
    expect(response.status, "Response status should be 200").to.eq(200);

    // Validate members array exists and is empty
    expect(body, "Response body should have 'members'").to.have.property("members");
    expect(body.members, "Members should be an array").to.be.an("array");
    expect(body.members.length, "Members array should be empty").to.eq(0);

    // Validate pagination structure
    expect(body, "Response should include pagination").to.have.property("pagination");
    const pagination = body.pagination;

    expect(pagination, "Pagination should have required keys").to.have.all.keys(
      "limit",
      "offset",
      "has_more"
    );

    // Validate pagination data types and values
    expect(pagination.limit, "Limit should be 50").to.eq(50);
    expect(pagination.offset, "Offset should be 0").to.eq(0);
    expect(pagination.has_more, "Has_more should be false").to.be.false;
  });
});

defineStep("I verify secondary profile count from DB", function () {
  cy.get("@projectGuid").then((projectGuid) => {
    expect(projectGuid, "Project GUID must be available").to.not.be.undefined;

    cy.get("@versionGuid").then((versionGuid) => {
      expect(versionGuid, "Version GUID must be available").to.not.be.undefined;

      cy.log(`Fetching secondary profile count for project: ${projectGuid}, version: ${versionGuid}`);
      getSecondaryProfileCount(projectGuid, versionGuid).then((rows) => {
        expect(rows, "Database result should not be empty").to.be.an("array").and.not.be.empty;

        const record = rows[0];
        cy.log("Secondary Profile Count Record:", JSON.stringify(record, null, 2));

        expect(record).to.have.property("project_guid", projectGuid);
        expect(record).to.have.property("version_guid", versionGuid);
        expect(record).to.have.property("framing_condition", "bcw");
        expect(record).to.have.property("secondarycount").that.is.a("number").and.gte(0);

        cy.wrap(record.secondary_profile_count).as("secondaryProfileCount");
      });
    });
  });
});

//--------- GET CONNECTION LIST --------------//

defineStep("I retrieve Retrieve connection details for specific primary and secondary member", function () {
  cy.get("@projectGuid").then((project_guid) => {
    expect(project_guid, "Project GUID must exist").to.not.be.undefined;

    cy.get("@versionGuid").then((version_guid) => {
      expect(version_guid, "Version GUID must exist").to.not.be.undefined;

      cy.getAuthToken()
        .its("body.access_token")
        .should("not.be.empty")
        .then((token) => {
          cy.request({
            method: "POST",
            url: `/connection/svc/connection-summary?limit=2&offset=0`,
            body: {
              project_guid,
              version_guid,
              primary_part_name: "BF_BEAM",
              primary_part_profile: "W10X22",
              secondary_part_name: "FILL_BEAM",
              secondary_part_profile: "W14X22",
              framing_condition: "bcw"
            },
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "x-api-key": Cypress.env("X_API_KEY"),
              "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
              "Api-Version": "v1",
            },
            failOnStatusCode: false,
          }).then((response) => {
            cy.log("Response: " + JSON.stringify(response.body));

            expect([200, 204]).to.include(
              response.status,
              `Expected 200 or 204 but got ${response.status}`
            );

            cy.wrap(response).as("getConnectionListResponse");
          });
        });
    });
  });
});

defineStep("I validate the get connection list response", function () {
  cy.get("@getConnectionListResponse").then((response) => {
    const body = response.body;

    // Validate HTTP status
    expect(response.status, "Response status should be 200").to.eq(200);

    // Validate top-level keys
    expect(body, "Response should contain 'connection' and 'pagination'")
      .to.have.all.keys("connection", "pagination");

    // Validate connection array
    expect(body.connection, "'connection' should be an array").to.be.an("array");
    expect(body.connection.length, "connection array can be empty").to.be.gte(0);

    // Validate pagination object
    const pagination = body.pagination;
    expect(pagination, "'pagination' should be an object").to.be.an("object");
    expect(pagination, "Pagination should have expected keys").to.have.all.keys(
      "limit",
      "offset",
      "has_more"
    );

    // Validate pagination data types and values
    expect(pagination.limit, "Limit should be a number").to.be.a("number");
    expect(pagination.offset, "Offset should be a number").to.be.a("number");
    expect(pagination.has_more, "Has_more should be a boolean").to.be.a("boolean");

    // Optional strict validation (if values are always fixed)
    expect(pagination.limit, "Limit should be 2").to.eq(2);
    expect(pagination.offset, "Offset should be 0").to.eq(0);
    expect(pagination.has_more, "Has_more should be false").to.be.false;
  });
});

defineStep("I verify get connection list from DB", function () {
  cy.get("@projectGuid").then((projectGuid) => {
    expect(projectGuid, "Project GUID should exist").to.not.be.undefined;

    cy.get("@versionGuid").then((versionGuid) => {
      expect(versionGuid, "Version GUID should exist").to.not.be.undefined;

      cy.log(`Fetching connection list for project: ${projectGuid}, version: ${versionGuid}`);
      
      getConnectionList(projectGuid, versionGuid).then((rows) => {
      expect(rows, "Database result should not be empty").to.be.an("array").and.not.be.empty;

        const record = rows[0];
        cy.log("Get Connection List Record:", JSON.stringify(record, null, 2));

        expect(record).to.have.property("project_guid", projectGuid);
        expect(record).to.have.property("version_guid", versionGuid);
        expect(record).to.have.property("primaryName");
        expect(record).to.have.property("primaryProfile");
        expect(record).to.have.property("secondaryName");
        expect(record).to.have.property("secondaryProfile");
        expect(record).to.have.property("framing_condition", "bcw");

        cy.log(`Retrieved ${rows.length} connection records`);
        cy.wrap(rows).as("connectionList");
        expect(rows, "Connection list should be an array").to.be.an("array");
      });
    });
  });
});

//--------- GET REASONS --------------//

defineStep("I get all the reasons that can be used to drop a connection", function () {
  cy.get("@projectGuid").then((projectGuid) => {
    expect(projectGuid, "Project GUID must exist").to.not.be.undefined;

     cy.get("@versionGuid").then((versionGuid) => {
    expect(versionGuid, "Version GUID must exist").to.not.be.undefined;

    cy.get("@connectionOptionRows").then((rows) => {
      expect(rows.length, "At least one connection/option pair expected").to.be.greaterThan(0);

      // Pick the first connection/option pair
      const { connection_guid, option_guid } = rows[0];
      cy.log(`Using connection_guid=${connection_guid}, option_guid=${option_guid}`);

      // Get token and call Connections API
      cy.getAuthToken()
        .its("body.access_token")
        .should("not.be.empty")
        .then((token) => {
          cy.request({
            method: "GET",
            url: `/connection/svc/reasons`,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "x-api-key": Cypress.env("X_API_KEY"),
              "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
              "Api-Version": "v1",
            },
            failOnStatusCode: false,
          }).then((response) => {
            cy.log("Get Connection Counts Response: " + JSON.stringify(response.body));

            // Validate API Response
            expect(
              [200, 204],
              `Expected 200 or 204 but got ${response.status}`
            ).to.include(response.status);

            if (response.status === 200 && response.body) {
              cy.log("Get Connection Count Success (200)");
            } else if (response.status === 204) {
              cy.log("Get Connection Count Success (204 No Content)");
            } else {
              throw new Error(`Unexpected response: ${JSON.stringify(response.body)}`);
            }

            // Save aliases if needed later
            cy.wrap(response).as("getReasonsResponse");
            cy.wrap(projectGuid).as("getReasonsGuid");
          });
        });
    });
  });
});
});

defineStep("I validate the reasons response", function () {
  cy.get("@getReasonsResponse").then((response) => {
    expect(response.status, "Response status should be 200").to.eq(200);

    const body = response.body;
    expect(body, "Response body should be an array").to.be.an("array").and.not.be.empty;

    body.forEach((reason) => {
      expect(reason, "Each item should have correct structure").to.have.all.keys(
        "reason_id",
        "reason_description"
      );
      expect(reason.reason_id, "Reason ID should be a number").to.be.a("number");
      expect(reason.reason_description, "Reason description should be a string").to.be.a("string");
    });
  });
});

//--------- GET CONNECTION MEMBER DETAILS AND STATUS  --------------//

defineStep("I get connection member details and status", function () {
  cy.get("@projectGuid").then((project_guid) => {
    expect(project_guid, "Project GUID must exist").to.not.be.undefined;

    cy.get("@versionGuid").then((version_guid) => {
    expect(version_guid, "Version GUID must exist").to.not.be.undefined;

   view_eligibility_connection_summary(project_guid, version_guid).then((rows) => {
   expect(rows, "Database result should not be empty").to.be.an("array").and.not.be.empty;
  
  const record = rows[0];
  const connectionGuid = record.connection_guid;
  const primaryPartGuid = record.primary_part_guid;
  const secondaryPartGuid = record.secondary_part_guid;

  cy.log(`Connection GUID: ${connectionGuid}`);
  cy.log(`Primary Part GUID: ${primaryPartGuid}`);
  cy.log(`Secondary Part GUID: ${secondaryPartGuid}`);

      cy.getAuthToken()
        .its("body.access_token")
        .should("not.be.empty")
        .then((token) => {
          cy.request({
            method: "POST",
            url: `/connection/svc/status`,
          body: {
              project_guid,
              connection_guid: connectionGuid,
              primary_part_guid: primaryPartGuid,
              secondary_part_guid: secondaryPartGuid
              },
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "x-api-key": Cypress.env("X_API_KEY"),
              "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
              "Api-Version": "v1",
            },
            failOnStatusCode: false,
          }).then((response) => {
            cy.log("Response: " + JSON.stringify(response.body));

            expect([200, 204]).to.include(
              response.status,
              `Expected 200 or 204 but got ${response.status}`
            );

            cy.wrap(response).as("connectionDetailsResponse");
          });
        });
    });
  });
});
});

defineStep("I validate the connection member details and status response", function () {
  cy.get("@connectionDetailsResponse").then((response) => {
    expect(response.status, "Response status should be 200").to.eq(200);

    const body = response.body;
    cy.log("Connection Details Response:", JSON.stringify(body, null, 2));

    expect(body).to.have.all.keys(
      "primary_part_name",
      "primary_part_profile",
      "secondary_part_name",
      "secondary_part_profile",
      "user_friendly_id",
      "option_guid",
      "connection_status"
    );

    expect(body.primary_part_name, "Primary part name should be a string").to.be.a("string");
    expect(body.primary_part_profile, "Primary part profile should be a string").to.be.a("string");
    expect(body.secondary_part_name, "Secondary part name should be a string").to.be.a("string");
    expect(body.secondary_part_profile, "Secondary part profile should be a string").to.be.a("string");
  });
});


defineStep("I delete all eligibility and prediction data for the project", function () {
  cy.get("@projectGuid").then((project_guid) => {
    expect(project_guid, "Project GUID must exist").to.not.be.undefined;

    cy.get("@versionGuid").then((version_guid) => {
      expect(version_guid, "Version GUID must exist").to.not.be.undefined;

      cy.log(`Deleting all eligibility and prediction data for project: ${project_guid}, version: ${version_guid}`);
      deleteEligibilityAndPredictionData(project_guid, version_guid);
    });
  });
});



//--------- TEAR DOWN ELIGIBILITY TABLES --------------//

defineStep("Then I delete eligibility metrics for the project", () => {
  cy.get("@projectGuid").then((projectGuid) => {
    cy.get("@versionGuid").then((versionGuid) => {
      deleteEligibilityMetric(projectGuid, versionGuid).then(() => {
        cy.log(`Deleted eligibility_metric for ${projectGuid}`);
      });
    });
  });
});

defineStep("Then I delete eligibility connections for the project", () => {
  cy.get("@projectGuid").then((projectGuid) => {
    cy.get("@versionGuid").then((versionGuid) => {
      deleteEligibilityConnection(projectGuid, versionGuid).then(() => {
        cy.log(`Deleted eligibility_connection for ${projectGuid}`);
      });
    });
  });
});

defineStep("Then I delete eligibility members for the project", () => {
  cy.get("@projectGuid").then((projectGuid) => {
    cy.get("@versionGuid").then((versionGuid) => {
      deleteEligibilityMember(projectGuid, versionGuid).then(() => {
        cy.log(`Deleted eligibility_member for ${projectGuid}`);
      });
    });
  });
});

//--------- TEAR DOWN PREDICTION TABLES --------------//


defineStep("Then I delete drop reasons for the project", function () {
  cy.get("@projectGuid").then((projectGuid) => {
    cy.get("@versionGuid").then((versionGuid) => {
      cy.log(`Deleting drop reasons for project: ${projectGuid}, version: ${versionGuid}`);
      deleteDropReasonsByProjectAndVersion(projectGuid, versionGuid).then(() => {
        cy.log("Drop reasons deleted successfully");
      });
    });
  });
});

defineStep("Then I delete prediction selected connections for the project", () => {
  cy.get("@projectGuid").then((projectGuid) => {
    cy.get("@versionGuid").then((versionGuid) => {
      deletePredictionSelectedConnection(projectGuid, versionGuid).then(() => {
        cy.log(`Deleted records from prediction_selected_connection for project_guid: ${projectGuid} and version_guid: ${versionGuid}`);
      });
    });
  });
});

defineStep("Then I delete prediction actions for the project", () => {
  cy.get("@projectGuid").then((projectGuid) => {
    deletePredictionActions(projectGuid).then(() => {
      cy.log(`Deleted prediction_actions for ${projectGuid}`);
    });
  });
});

defineStep("Then I delete prediction records for the project", () => {
  cy.get("@projectGuid").then((projectGuid) => {
    deletePrediction(projectGuid).then(() => {
      cy.log(`Deleted prediction records for ${projectGuid}`);
    });
  });
});

defineStep("Then I delete prediction options for the project", () => {
  cy.get("@projectGuid").then((projectGuid) => {
    deletePredictionOption(projectGuid).then(() => {
      cy.log(`Deleted prediction_option for ${projectGuid}`);
    });
  });
});

defineStep("Then I delete prediction attribute records for the project", function () {
  cy.get("@projectGuid").then((projectGuid) => {
    cy.get("@versionGuid").then((versionGuid) => {
      deleteFromPredictionAttribute(projectGuid, versionGuid).then(() => {
        cy.log(`Deleted records from prediction_attribute for project: ${projectGuid}, version: ${versionGuid}`);
      });
    });
  });
});

defineStep("Then I delete prediction metric records for the project", function () {
  cy.get("@projectGuid").then((projectGuid) => {
    cy.get("@versionGuid").then((versionGuid) => {
      deleteFromPredictionMetric(projectGuid, versionGuid).then(() => {
        cy.log(`Deleted records from prediction_metric for project: ${projectGuid}, version: ${versionGuid}`);
      });
    });
  });
});

defineStep("Then I delete prediction batch setting records for the project", function () {
  cy.get("@projectGuid").then((projectGuid) => {
    cy.get("@versionGuid").then((versionGuid) => {
      deleteFromPredictionBatchSetting(projectGuid, versionGuid).then(() => {
        cy.log(`Deleted records from prediction_batch_setting for project: ${projectGuid}, version: ${versionGuid}`);
      });
    });
  });
});