import { defineStep } from "@badeball/cypress-cucumber-preprocessor";
import { v4 as uuidv4 } from 'uuid';
import { deleteBlobFile, blobFileCheck } from '../reusable.js'
import { deleteDocumentbyProjectGuid, deleteProjectbyGUID } from '../db.js'

let projectGuid;
let correlationid;
let sessionid;
let userid;
let blobURL;

const projectname = "Test Automation Project API";
const projectDescription = "This is a test project created by Cypress test";
const projectStatusId = 100;

defineStep("a new project GUID is generated and uploaded to Azure Blob", () => {

  projectGuid = uuidv4();
  correlationid = uuidv4();
  sessionid = uuidv4();
  userid = uuidv4();

  const blobName = `${projectGuid}/project.json`;
  blobURL = `https://${Cypress.env('AZURE_STORAGE_ACCOUNT')}.blob.core.windows.net/upload-file/${Cypress.env("AZURE_CONTAINER")}/${blobName}?${Cypress.env("AZURE_STORAGE_SAS")}`;

    cy.log(blobURL);
     cy.wrap(blobURL).as('azureURL')
     cy.wrap(projectGuid).as('blobRequestID')

     cy.task("queryDatabase", {
        query: `SELECT * FROM [dbo].[project] where insert_user_guid = '4222608F-6C7A-41ED-8906-927F14E489D3'`
      })
    // "
  cy.request({
    method: "PUT",
    url: blobURL,
    body: JSON.stringify({ request_guid: projectGuid }),
    headers: {
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": "application/json",
    },
    failOnStatusCode: true,
  }).then((blobResp) => {
    expect(blobResp.status).to.eq(201);
  });
});

defineStep("I create a project using the same project GUID", function () {
  cy.getAuthToken()
    .its("body.access_token")
    .should("not.be.empty")
    .then((token) => {
      cy.request({
        method: "POST",
        url: "/project/svc/",
        body: {
          request_guid: projectGuid,
          project_name: projectname,
          project_descr: projectDescription,
          project_status_id: projectStatusId,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Correlation-ID": correlationid,
          "X-Session-ID": sessionid,
          "X-User-ID": userid,
          "x-api-key": Cypress.env('X_API_KEY'),
          "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
          "Api-Version": "v1",
        },
        failOnStatusCode: false,
     }).then((response) => {
        cy.log("Create Project Response: " + JSON.stringify(response.body));

        // Save whole response
        this.createProjectResponse = response;

        // Capture both GUIDs (in case API uses one or the other)
        this.projectGuid = response.body.project_guid;
        this.requestGuid = response.body.request_guid || projectGuid;
        cy.wrap(response.body.project_guid).as('newProjectGUID')
        cy.log("Saved project_guid: " + this.projectGuid);
        cy.log("Saved request_guid: " + this.requestGuid);
      });
    });
});

defineStep("I try to create a project using invalid payload",function () {
  cy.getAuthToken()
    .its("body.access_token")
    .should("not.be.empty")
    .then((token) => {
      cy.request({
        method: "POST",
        url: "/project/svc/",
        body: {},
            headers: {
            Authorization: `Bearer ${token}`,
            "X-User-ID": userid,
            "x-api-key": Cypress.env('X_API_KEY'),
            "Api-Version": "v1",
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.log("Create Project Response: " + JSON.stringify(response.body));

        // Save whole response
        this.createProjectResponse = response;

        // Capture both GUIDs (in case API uses one or the other)
        this.projectGuid = response.body.project_guid;
        this.requestGuid = response.body.request_guid || projectGuid;

        cy.log("Saved project_guid: " + this.projectGuid);
        cy.log("Saved request_guid: " + this.requestGuid);
      });
    });
});


defineStep("the projectAPI response code is {int}", function (statusCode) {
  expect(this.createProjectResponse.status).to.eq(statusCode);
});

defineStep("the GUID is stored in Azure Blob", () => {
  cy.log("GUID also stored at Blob: " + blobURL);
  cy.log("CorrID = " + correlationid);
});


defineStep("the project GUID is deleted from Azure Blob and DB", () => {
  cy.get('@azureURL').then((blobURL) => {
      cy.log(`Blob deleted for project: ${blobURL}`);
      deleteBlobFile(blobURL).its('status').should('eq',202)
      blobFileCheck(blobURL).its('status').should('eq',404)
  })
   cy.get('@newProjectGUID').then((projectid) => {
    deleteDocumentbyProjectGuid(projectid).then((rows) =>{
      expect(rows.length).to.be.eq(0)
      deleteProjectbyGUID(projectid).its('length').should('eq',0)
      })
    } )
});


defineStep("I fetch the project details using that project GUID", function () {
    cy.getAuthToken()
    .its("body.access_token")
    .should("not.be.empty")
    .then((token) => {
 cy.request({
        method: "GET",
        url: `/project/svc/${this.projectGuid}`,
        body: {},
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-api-key": Cypress.env('X_API_KEY'),
          "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
          "Api-Version": "v1",
        },
        failOnStatusCode: false,
     }).then((resp) => {
    cy.log(`/project/svc/${this.projectGuid}`);
    expect(resp.status).to.eq(200);
   // expect(resp.body.project_guid).to.eq(this.projectGuid);
  });
});
});

