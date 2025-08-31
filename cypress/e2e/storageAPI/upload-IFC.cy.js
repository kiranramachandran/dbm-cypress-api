
describe('IFC File Upload API Test', () => {

  it('Upload a valid IFC file-2x3', () => {
    const fileName = '2x3-Test-5MB.ifc'; //  IFC file in cypress/fixtures
    const fileType = 'application/octet-stream'; // Generic binary type for IFC 

    // --- AUTHORISATION
    cy.getAuthToken().then((response) => {

      cy.fixture(fileName, 'base64')
      .then((fileContent) => Cypress.Blob.base64StringToBlob(fileContent, fileType))
      .then((blob) => {

      let formData = new FormData();
      formData.append('file', blob, fileName);
      formData.append('overwrite',true);

      // Send POST request to upload endpoint
      cy.request({
            method: 'POST',
            url: 'https://api-dev.connectionai.com.au/storage/67b5c34d-7e45-44ee-8b10-067e7937ee5a/ifc/upload',        
            body: formData,
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization':  `Bearer ${response.body.access_token}`,
              'x-api-key' : '666a1db866394f68a8d8629190116304',
              'X-User-Id' : 'b50bea0e-a900-4c9e-9876-67e38b82ef69',
              'Api-Version': 'v1',
        },
      }).then((response) => {
        expect(response.status).to.eq(201);
        cy.log(JSON.stringify(response.body))
      });

      })

      })
      
  });
  });

// });
