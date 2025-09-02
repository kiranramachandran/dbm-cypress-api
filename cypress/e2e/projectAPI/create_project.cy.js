
// import { createProject } from '../../support/api.js'

// describe('Project API Test', () => {
//   context ('Create a new project via Project API',() => {

//     it('Create a new project via Project API', () => {
//       const blobUrl = `https://${Cypress.env('AZURE_STORAGE_ACCOUNT')}.blob.core.windows.net/${Cypress.env('AZURE_CONTAINER')}/${fileName}?${Cypress.env('AZURE_STORAGE_SAS')}`;

//           // Send POST request to upload endpoint
//           createProject(formData).then((response) => {
//             expect(response.status).to.eq(201);
            
//             // //Blob File Check
//             // blobFileCheck(blobUrl).then((blobResponse) => {
//             // expect(blobResponse.status,'File Present Status: ').to.equal(200)
            
//             //   //Delete the existing file
//             //  deleteBlobFile(blobUrl).its('status').should('eq',202)
//             })
//           });

//         })
//     })    

//   //});
// //});
