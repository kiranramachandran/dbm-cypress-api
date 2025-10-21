import { defineStep } from '@badeball/cypress-cucumber-preprocessor';
import { createProject, ifcUpload, pdfUpload, blobFileCheck, containerCheck, makeSureFileIsDeleted } from '../reusable.js'


defineStep("New Project created for fileUploads", () => {
 //Create New Project
  createProject().then((projectResponse) => {
    expect(projectResponse.status,'Create Project Status Code').to.eq(201);
    expect(projectResponse.body.project_status_id,'Project Creation - Status ID').to.eq(102);

    projectGuid = projectResponse.body.project_guid;
    expect(projectGuid, "project_guid should be returned").to.not.be.undefined;
    //Project GUID is saved for later steps
    cy.wrap(projectGuid).as("projectGuid");
   
  });
});

defineStep(`IFC file {string} is uploaded using Storage API`, (fileName) => {

    const fileType = 'application/octet-stream'; // Generic binary type for IFC 
        
        makeSureFileIsDeleted(fileName)   
        cy.wrap(fileName).as('blobFileName')

        cy.fixture(fileName, 'base64')
        .then((fileContent) => Cypress.Blob.base64StringToBlob(fileContent, fileType))
        .then((blob) => {
            let formData = new FormData();
            formData.append('file', blob, fileName);
            formData.append('overwrite', 'true' );
  
            // Send POST request to upload endpoint
            ifcUpload(formData)
            .as('FileUpload')    
            .then((response) =>{
              cy.wrap(response.headers['x-correlation-id']).as('requestGUID')
            })           
          })
})

defineStep(`PDF file {string} is uploaded using Storage API`, (fileName) => {

    const fileType = 'application/octet-stream'; // Generic binary type for PDF 
    // const blobURL = `https://${Cypress.env('AZURE_STORAGE_ACCOUNT')}.blob.core.windows.net/${Cypress.env('AZURE_CONTAINER')}/${fileName}?${Cypress.env('AZURE_STORAGE_SAS')}`;
          
        cy.wrap(fileName).as('blobFileName')
        cy.fixture(fileName, 'base64')
        .then((fileContent) => Cypress.Blob.base64StringToBlob(fileContent, fileType))
        .then((blob) => {
            let formData = new FormData();
            formData.append('file', blob, fileName);
            formData.append('overwrite', 'true' );
            // Send POST request to upload endpoint
            pdfUpload(formData).as('FileUpload')  
                 .then((response) =>{
              cy.wrap(response.headers['x-correlation-id']).as('requestGUID')
            })               
          })
})

defineStep("the API response code is {int}", (statusCode) => {
      cy.get("@FileUpload").then((resp) => {
      expect(resp.status).to.eq(statusCode);
  });
});

defineStep("Uploaded File can be viewed in Azure Blob", () => {
      cy.get("@blobFileURL").then((url) => {
      //Blob File Check
      cy.log('Azure Blob File Present Status: ')
      blobFileCheck(url).its('status').should('eq',200)
 })
});

defineStep("Uploaded File Not Present in Azure Blob", () => {
   const fileLocation = `https://${Cypress.env('AZURE_STORAGE_ACCOUNT')}.blob.core.windows.net/upload-file/`
      
      //Blob File Check
      cy.log('Azure Blob File Present Status: ')

      containerCheck(fileLocation).then((resp) => 
      {
        expect(resp.status).to.eq(200)
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(resp.body, "text/xml");
        const blobs = Array.from(xmlDoc.getElementsByTagName("Name")).map(el => el.textContent);


    cy.get("@blobFileName").then((fileName) => {
      
              if (blobs != [])
                expect(blobs,'File Not exist check').to.not.include(fileName);
              else 
                cy.log(`${fileName} does not exist`)     
  });
});
});

defineStep("Uploaded File can be deleted from Azure Blob and DB", () => {
    cy.get('@blobFileName').then((docName) => {
      makeSureFileIsDeleted(docName)
    })
   })