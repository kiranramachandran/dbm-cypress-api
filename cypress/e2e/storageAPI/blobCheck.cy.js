// cypress/e2e/blobCheck.cy.js
describe.skip('Check Azure Blob File', () => {

 it('should verify if file exists in blob storage', () => {
   const storageAccount = Cypress.env('AZURE_STORAGE_ACCOUNT');
   const containerName = Cypress.env('AZURE_CONTAINER');
   const blobName = 'Test-47MB-2x3.ifc';
   const sasToken = Cypress.env('AZURE_STORAGE_SAS');

   // SAS token must have "Read" permission
   const blobUrl = `https://${storageAccount}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
   cy.log(blobUrl);
   cy.request({
     method: 'HEAD',
     url: blobUrl,
     failOnStatusCode: false // don’t fail if file not found
   }).then((resp) => {
     if (resp.status === 200) {
       cy.log('File exists in blob storage');
     } else if (resp.status === 404) {
       cy.log('File not found in blob storage');
     } else {
       cy.log(`Unexpected status: ${resp.status}`);
     }
   });
 });


  it('should delete a file from blob storage if it exists', () => {
   const storageAccount = Cypress.env('AZURE_STORAGE_ACCOUNT');
   const containerName = Cypress.env('AZURE_CONTAINER');
   const blobName = '2x3-Test-124MB.ifc';
   const sasToken = Cypress.env('AZURE_STORAGE_SAS');

   // SAS token must have "Delete" permission
   const blobUrl = `https://${storageAccount}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
   cy.request({
     method: 'DELETE',
     url: blobUrl,
     failOnStatusCode: false // handle 404 gracefully
   }).then((resp) => {
    cy.log(resp.status)
     if (resp.status === 202) {
       cy.log('File deleted successfully');
     } else if (resp.status === 404) {
       cy.log('File not found (already deleted)');
     } else {
       cy.log(`Unexpected status: ${resp.status}`);
     }
   });
 });

});