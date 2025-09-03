
import { ifcUpload, blobFileCheck, deleteBlobFile } from '../../support/api.js'

describe('Storage API Test', () => {
  context ('Valid IFC-2x3 File Upload',() => {

    it('Upload Valid IFC 2x3 File with overwrite, check and delete file in blob', () => {
      const fileName = '2x3-Test-5MB.ifc'; //  IFC file in cypress/fixtures
      const fileType = 'application/octet-stream'; // Generic binary type for IFC 
      const blobUrl = `https://${Cypress.env('AZURE_STORAGE_ACCOUNT')}.blob.core.windows.net/${Cypress.env('AZURE_CONTAINER')}/${fileName}?${Cypress.env('AZURE_STORAGE_SAS')}`;

      cy.fixture(fileName, 'base64')
      .then((fileContent) => Cypress.Blob.base64StringToBlob(fileContent, fileType))
      .then((blob) => {

        let formData = new FormData();
        formData.append('file', blob, fileName);
        formData.append('overwrite', 'true' );

          // Send POST request to upload endpoint
          ifcUpload(formData).then((response) => {
            expect(response.status).to.eq(201);
            
            //Blob File Check
            blobFileCheck(blobUrl).then((blobResponse) => {
            expect(blobResponse.status,'File Present Status: ').to.equal(200)
            
              //Delete the existing file
             deleteBlobFile(blobUrl).its('status').should('eq',202)
            })
          });

        })
    })    

  });
});
