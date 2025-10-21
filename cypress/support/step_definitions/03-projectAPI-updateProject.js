import { defineStep } from "@badeball/cypress-cucumber-preprocessor";
import { v4 as uuidv4 } from 'uuid';
import { createProject, createBlobProject, getProjectWithProjectGuid } from '../reusable.js'
import { deleteProject } from '../db.js'

  const updatedProjectname = "Updated Project Name";
  const updatedProjectDescription = "Updated Project Description";
  const projectStatusId = 100;

defineStep("I update the project details with response code 200", function () {
  cy.getAuthToken()
    .its("body.access_token")
    .should("not.be.empty")
    .then((token) => {
      cy.get("@newProjectGUID").then((requestGuid) => {
        cy.request({
          method: "PUT",
          url: `/project/svc/${requestGuid}`,
          body: {
            request_guid: requestGuid,
            project_name: updatedProjectname,
            project_descr: updatedProjectDescription,
            project_status_id: projectStatusId,
          },
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-Correlation-ID": requestGuid,
            "X-Session-ID": requestGuid,
            "x-api-key": Cypress.env('X_API_KEY'),
            "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
            "Api-Version": "v1",
          },
          failOnStatusCode: false,
        }).then((resp) => {
          expect(resp.status).to.eq(200); // ✅ expect update success
          cy.log("Update Project Response: " + JSON.stringify(resp.body));
 
          // Save if needed later
          this.updateProjectResponse = resp;
        });
      });
    });
});

defineStep("Update Project with invalid ProjectGuid gets response code 400", function () {
  cy.getAuthToken()
    .its("body.access_token")
    .should("not.be.empty")
    .then((token) => {
      cy.get("@newProjectGUID").then((requestGuid) => {
        cy.request({
          method: "PUT",
          url: `/project/svc/9262dc34-6a57-4b67-aadf-4a46822a0900X`,
          body: {},
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-api-key": Cypress.env('X_API_KEY'),
            "Api-Version": "v1",
          },
          failOnStatusCode: false,
        }).then((resp) => {
          expect(resp.status).to.eq(400); 
          cy.log("Update Project Response: " + JSON.stringify(resp.body));
 
          // Save if needed later
          this.updateProjectResponse = resp;
        });
      });
    });
});

