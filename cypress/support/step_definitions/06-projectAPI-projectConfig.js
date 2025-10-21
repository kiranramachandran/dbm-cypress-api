import { defineStep } from "@badeball/cypress-cucumber-preprocessor";
import { v4 as uuidv4 } from 'uuid';
import {createProject, createProjectConfigWithProjectGuid, updateProjectConfigWithProjectGuid} from '../reusable.js'
import { deleteProjectConfig } from '../db.js'

// Create project and save GUID
defineStep("I create a new project", () => {
  createProject().then((projectResponse) => {
    expect(projectResponse.status).to.eq(201);

    const projectGuid = projectResponse.body.project_guid;
    expect(projectGuid, "project_guid should be returned").to.not.be.undefined;

    cy.wrap(projectGuid).as("projectGuid");
  });
});

// Create config for that project
defineStep("I create a project config for the project", () => {
  cy.get("@projectGuid").then((projectGuid) => {
    createProjectConfigWithProjectGuid(projectGuid).then((createResp) => {
      cy.wrap(createResp).as("configResponse"); // store full response
    });
  });
});

// Update project config for the project
defineStep("I update the project config", () => {
  cy.get("@projectGuid").then((projectGuid) => {
    updateProjectConfigWithProjectGuid(projectGuid).then((updateResp) => {
      cy.wrap(updateResp).as("updateResp");
    });
  });
});

// Delete project config for the project
defineStep("I delete the project config for project {string}", (updatedProjectname) => {
  deleteProjectConfig(updatedProjectname).then((result) => {
    cy.log("Delete Project Config Result:", JSON.stringify(result, null, 2));
    expect(result).to.not.be.null;
    if (Array.isArray(result) || typeof result === "object") {
      expect(result).to.exist;
    }
  });
});

// Verify the update config response
defineStep("the project config update response is {int}", (statusCode) => {
  cy.get("@updateResp").then((updateResp) => {
  cy.log("Project Config Update Response:", JSON.stringify(updateResp.body, null, 2));
    expect(updateResp.status).to.eq(statusCode);
    expect(updateResp.body).to.have.property("engineering_item_value");
    expect(updateResp.body).to.have.property("engineering_item_description");
    expect(updateResp.body).to.have.property("project_guid"); 
    expect(updateResp.body).to.have.property("project_config_guid"); 
    expect(updateResp.body).to.have.property("insert_user_guid"); 
    expect(updateResp.body).to.have.property("modify_user_guid");
  });
});

// Verify the create config response
defineStep("the projectConfig create response is {int}", (statusCode) => {
  cy.get("@configResponse").then((configResponse) => {
  cy.log("Project Config Response:",JSON.stringify(configResponse.body, null, 2));
    expect(configResponse.status).to.eq(statusCode);    
    expect(configResponse.body).to.have.property("engineering_item_value");
    expect(configResponse.body).to.have.property("engineering_item_description");
    expect(configResponse.body).to.have.property("project_guid"); 
    expect(configResponse.body).to.have.property("project_config_guid"); 
    expect(configResponse.body).to.have.property("insert_user_guid"); 
    expect(configResponse.body).to.have.property("modify_user_guid");

 });
});
