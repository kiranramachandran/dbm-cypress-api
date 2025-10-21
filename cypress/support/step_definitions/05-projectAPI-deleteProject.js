import { defineStep } from "@badeball/cypress-cucumber-preprocessor";
import { deleteProject } from '../db.js'

defineStep("I delete the project named {string}", (projectName) => {
  deleteProject(projectName).then((result) => {
    expect(result).to.not.be.null;
  });
});