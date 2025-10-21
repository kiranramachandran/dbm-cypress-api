
//----------[DOCUMENT DATABASE VERIFICATION] --------------------------------//

import { defineStep } from '@badeball/cypress-cucumber-preprocessor';
import { getFileByRequestGUID } from '../../support/db.js'

defineStep('Uploaded File can be found in DB',() => {

  const fileLocation = `https://${Cypress.env('AZURE_STORAGE_ACCOUNT')}.blob.core.windows.net/upload-file/`   
  
   cy.get('@requestGUID').then((requestID) => {
      //Get File Details from Database
      getFileByRequestGUID(requestID).then((result) => {
        
        expect(result.length,'Results').to.eq(1)
        expect(result,'Row Count').not.be.empty

        cy.wrap(`${fileLocation}${result[0].url}?${Cypress.env('AZURE_STORAGE_SAS')}`).as('blobFileURL')
            cy.get('@blobFileName').then((docName) => {
              expect(result[0].document_name,'Document Name Check').to.eq(docName)
               expect(result[0].url,'URL check').to.contain(docName)
                expect(result[0].url,'Document GUID Check').to.contain(result[0].document_guid.toLowerCase())
            })
   
        expect(result[0],'Columns check').to.have.all.keys(
        'delete_timestamp', 
        'delete_user_guid', 
        'document_guid', 
        'document_name', 
        'document_type_id', 
        'insert_timestamp', 
        'insert_user_guid', 
        'page_count', 
        'project_guid', 
        'request_guid', 
        'size', 
        'url'
        );
          

      });
   })
  })

  defineStep(/(Deleted|Uploaded) File cannot be found in DB/,() => {

   cy.get('@blobFileName').then((docName) => {
      cy.task("queryDatabase", {
        query: `SELECT * FROM [dbo].[document] WHERE document_name = '${docName}'`
      }).then((result) => {
        expect(result.length,'DB Rows Count').to.equal(0)
      });
   })
  })

    defineStep(/Updated Project cannot be found in DB/,() => {

   cy.get('@blobFileName').then((docName) => {
      cy.task("queryDatabase", {
        query: `Delete FROM [dbo].[project] WHERE project_name = 'Updated Project Name'`
      }).then((result) => {
        expect(result.length).to.equal(0)
      });
   })
  })


