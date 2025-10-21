import { defineStep } from "@badeball/cypress-cucumber-preprocessor";
import { v4 as uuidv4 } from 'uuid';
import { createProject, createBlobProject, getProjectWithProjectGuid, blobFileCheck, makeSureBlobFolderNotExists, getProjectList, deleteProjectNotinContainer, deleteBlobFile } from '../reusable.js'
import { getProjectbyGUID, getProjectByUser, getProjectbyRequest } from '../db.js'

const ProjectNotFound ='e3e23ff7-1216-4903-bd0c-b1e9764fa9e0';

defineStep("Get the list of all projects with response code {int}", (statusCode) => {
  getProjectList()
  .as("newProjectList")
  .its('status').should('eq',statusCode);
    });

defineStep("GetProjects API is used with project GUID", () => {
  cy.get('@newProjectGUID').then((response) => {
    getProjectWithProjectGuid(response).as('matchProject').its('status').should('eq',200)
    })
});

defineStep("the get project response code is {int}", (statusCode) => {
      cy.get("@matchProject")
        .then((response) => {
        expect(response.status).to.eq(statusCode);
        expect(response.body).not.be.empty;
        cy.get('@createdProject')
          .then((project) => {
            expect(response.body.project_guid).to.eq(project.body.project_guid)
            expect(response.body.request_guid).to.eq(project.body.request_guid)
            expect(response.body.project_status_id).to.eq(project.body.project_status_id)
            expect(response.body.project_name).to.eq(project.body.project_name)
            expect(response.body.project_descr).to.eq(project.body.project_descr)
            expect(response.body.insert_user_guid).to.eq(project.body.insert_user_guid)
            expect(response.body.delete_user_guid).to.eq(project.body.delete_user_guid)
            expect(response.body.modify_user_guid).to.eq(project.body.insert_user_guid)
            cy.wrap(project.body.project_name).as('project_db')
          })
  
      });
});

defineStep('Create project using Project API with Azure request GUID',()=> {
  cy.get('@projectRequestGuid').then((requestGuid) => {
    createProject(requestGuid).as('createdProject')
  })

})

defineStep("Create project in Azure Blob", () => {
  const container = uuidv4()

  createBlobProject(container).its("status").should('eq',201)
  cy.wrap(container).as('projectRequestGuid')
    
});

defineStep("{string} is created in Azure Blob", (folder) => {

  makeSureBlobFolderNotExists(folder)
  const container = uuidv4()

  createBlobProject(container,folder).its("status").should('eq',201)
  cy.wrap(container).as('projectRequestGuid')
    
});

defineStep("the create project response code is {int}", (statusCode) => {
      cy.get("@createdProject").then((response) => {
      expect(response.status).to.eq(statusCode);
      expect(response.body).not.be.empty
      expect(response.body.project_guid,'New Project GUID').to.be.a('string')
      cy.wrap(response.body.project_guid).as('newProjectGUID')
  });
});

defineStep("I try to get a list of all projects using invalid guid", () => {
  cy.getAuthToken()
    .its("body.access_token")
    .should("not.be.empty")
    .then((token) => {
      cy.request({
        method: "POST",
        url: "/project/svc/9262dc34-6a57-4b67-aadf-4a46822a0900X",
        body: {},
            headers: {
            Authorization: `Bearer ${token}`,
            "x-api-key": Cypress.env('X_API_KEY'),
            "Api-Version": "v1",
        },
        failOnStatusCode: false,
      }).as("createProjectResponse");
    });
});


defineStep("I try to get Project details of a ProjectID which does not exist in DB", () => {
  cy.getAuthToken()
    .its("body.access_token")
    .should("not.be.empty")
    .then((token) => {
      cy.request({
        method: "GET",
        url: `/project/svc/${ProjectNotFound}`,
            headers: {
            "Content-Type": "application/json", 
            Authorization: `Bearer ${token}`,
            "x-api-key": Cypress.env('X_API_KEY'),
            "Api-Version": "v1",
        },
        failOnStatusCode: false,
      }).as("createProjectResponse");
    });
});

defineStep('the project is available in Blob and DB',() => {
  cy.get('@newProjectGUID').then((projectid) => {
    getProjectbyGUID(projectid).then((rows) =>{
      expect(rows.length).to.be.eq(1)
      })
    } )
  cy.get('@azureURL').then((url) => blobFileCheck(url).its('status').should('eq',200))
  })

  defineStep('There are no existing projects outside {string}', (blobContainer) => {
      getProjectList().then((list) => {
        cy.log(`Existing Project Count before Deletion: ${list.body.length}`)
        if(list.body.length > 0)
        deleteProjectNotinContainer(blobContainer, list.body[0].insert_user_guid)
      })

  })

  defineStep('Project is created using Project API',()=> {
    createProject().then((userProject) => {
      expect(userProject.status).to.eq(201)
      cy.wrap(userProject.body.insert_user_guid).as('userID')
      cy.wrap(userProject.body.project_guid).as('newProjectID')
    })
  })

  defineStep('the project list matches with DB',() => {
    cy.get('@newProjectList').then((response) => 
    {
        expect(response.body,'project list').not.be.empty;
        cy.get('@userID').then((user) => {
          const userCount = response.body.filter((match) => match.insert_user_guid == user)
          
            expect(response.body.length,'Projects with Current user').to.eq(userCount.length)
            getProjectByUser(user).then((rows) => {
              const matchUser = response.body.filter((match) => match.insert_user_guid == user)

              expect(response.body.length,'DB Vs API match').to.eq(rows.length)
              expect(response.body.length).to.eq(matchUser.length)
              
            })
        })

      cy.get('@newProjectID').then((project) => {
        const projectMatch = response.body.filter((match) => match.project_guid == project)
        expect(projectMatch.length,'new Project GUID match').to.eq(1)
      })
      
    })
  })

  defineStep('the project is NOT available in DB',() => {
  cy.get('@blobRequestID').then((requestid) => {
    getProjectbyRequest(requestid).then((rows) =>{
      expect(rows.length).to.be.eq(0)
      })
    } )
  cy.get('@azureURL').then((url) => 
    {
      blobFileCheck(url).its('status').should('eq',200)
      deleteBlobFile(url).its('status').should('eq',202)
      blobFileCheck(url).its('status').should('eq',404)
    })
  })
