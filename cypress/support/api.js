
    export const ifcUpload = (formData) => {
        return cy.getAuthToken().its('body.access_token').should('not.be.empty').then((token) => {

           return cy.request({
            method: 'POST',
            url: '/storage/svc/67b5c34d-7e45-44ee-8b10-067e7937ee5a/ifc/upload',        
            body: formData,
            failOnStatusCode: false,
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization':  `Bearer ${token}`,
              'x-api-key' : '666a1db866394f68a8d8629190116304',
              'X-User-Id' : 'b50bea0e-a900-4c9e-9876-67e38b82ef69',
              'Api-Version': 'v1',
                    },
            })
        })
    }

        export const pdfUpload = (formData) => {
        return cy.getAuthToken().its('body.access_token').should('not.be.empty').then((token) => {

           return cy.request({
            method: 'POST',
            url: '/storage/svc/67b5c34d-7e45-44ee-8b10-067e7937ee5a/pdf/upload',        
            body: formData,
            failOnStatusCode: false,
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization':  `Bearer ${token}`,
              'x-api-key' : '666a1db866394f68a8d8629190116304',
              'X-User-Id' : 'b50bea0e-a900-4c9e-9876-67e38b82ef69',
              'Api-Version': 'v1',
                    },
            })
        })
    }

        export const createProject = (formData) => {
        return cy.getAuthToken().its('body.access_token').should('not.be.empty').then((token) => {

           return cy.request({
            method: 'POST',
            url: '/project/svc/',        
            body: formData,
            failOnStatusCode: false,
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization':  `Bearer ${token}`,
              'x-api-key' : '666a1db866394f68a8d8629190116304',
              'X-User-Id' : 'b50bea0e-a900-4c9e-9876-67e38b82ef69',
              'Api-Version': 'v1',
                    },
            })
        })
    }
    export const blobFileCheck = (blobURL) => {
       return   cy.request({
                method: 'HEAD',
                url: blobURL,
                failOnStatusCode: false // don’t fail if file not found
            })
    }    

    export const deleteBlobFile = (blobURL) => {
       return   cy.request({
                method: 'DELETE',
                url: blobURL,
                failOnStatusCode: false // don’t fail if file not found
            })

    }

