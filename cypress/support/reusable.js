import { getFileByName, deleteUploadedFile, getDocumentbyProjectName, deleteProjectbyName, 
  deleteProjectbyRequestID, deleteProjectNotInRequest, getProjectByUser, deleteProjectByUser,deleteProjectbyGUID } from '../support/db.js'
import { v4 as uuidv4 } from 'uuid';

export const makeSureFileIsDeleted = (fileName) =>
    {
        const fileLocation = `https://${Cypress.env('AZURE_STORAGE_ACCOUNT')}.blob.core.windows.net/upload-file/`

        //Check and Delete if File already exists in DB
        getFileByName(fileName).then((rows) => {
            if (rows.length > 0)
            {  
                cy.log(`There are ${rows.length} file(s) with name: ${fileName} available in DB`)
                rows.forEach(row => {
                    const blobURL = `${fileLocation}${row.url}?${Cypress.env('AZURE_STORAGE_SAS')}`
                    
                    cy.log(`Blob URL to be checked: ${blobURL}`);
                   
                    //IF File exists in Blob, it is deleted
                    blobFileCheck(blobURL)
                    .then((response) => {
                        if (response.status == 200)
                        {
                            deleteBlobFile(blobURL).its('status').should('eq',202)
                            blobFileCheck(blobURL).its('status').should('eq',404)
                        }
                        else
                            expect(response.status,'File Not Found in Azure Blob').to.eq(404)
                    })
                    .then(() => {
                      //File is deleted in DB
                      deleteUploadedFile(row.document_guid)
                        .its('length')
                        .should('eq',0)
                    })
                    .then(() => {
                      deleteProjectbyGUID(row.project_guid)
                       .its('length')
                        .should('eq',0)
                    })

                })
            }
        })
    }

    export const ifcUpload = (formData) => {
        return cy.getAuthToken().its('body.access_token').should('not.be.empty').then((token) => {
            cy.log(`Project GUID in ifcUpload: ${projectGuid}`)
           return cy.request({
            method: 'POST',
             url: `/storage/svc/${projectGuid}/ifc/upload`,      
            body: formData,
            failOnStatusCode: false,
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization':  `Bearer ${token}`,
              'x-api-key' : Cypress.env('X_API_KEY'),
              'Api-Version': 'v1',
                    },
            })
        })
    }

        export const pdfUpload = (formData) => {
        return cy.getAuthToken().its('body.access_token').should('not.be.empty').then((token) => {

           return cy.request({
            method: 'POST',
            url: `/storage/svc/${projectGuid}/pdf/upload`,        
            body: formData,
            failOnStatusCode: false,
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization':  `Bearer ${token}`,
              'x-api-key' : Cypress.env('X_API_KEY'),
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

  export const containerCheck = (folderURL, container ='/') => {
       return   cy.request({
                method: 'GET',
                url: `${folderURL}?${Cypress.env('AZURE_STORAGE_SAS')}`,
                failOnStatusCode: false, // don’t fail if file not found
                qs:
                {
                    'restype': 'container',
                    'comp': 'list',
                    'prefix' : container,
                    'delimiter': '/',
                    'maxresults': 100,
                    'include': '',
                },
        })
    }    

      export const folderCheck = (folderURL, folderName) => {
       return   cy.request({
                method: 'GET',
                url: `${folderURL}?${Cypress.env('AZURE_STORAGE_SAS')}`,
                failOnStatusCode: false, // don’t fail if file not found
                qs:
                {
                    'restype': 'container',
                    'comp': 'list',
                    'prefix' : folderName
                },
      })
    }   

    export const createProject = (requestGUID = uuidv4(),
    project_name = "Test Automation Project API",
    project_descr = "This is a test project created by Cypress test",
    project_status_id = 100 ) => {

      cy.log(`RequestGUID used to create project: ${requestGUID}`)

        return cy.getAuthToken()
            .its("body.access_token")
            .should("not.be.empty")
            .then((token) => {
           return cy.request({
                method: "POST",
                url: "/project/svc/",
                body: {  
                    request_guid: requestGUID,
                    project_name: project_name,
                    project_descr: project_descr,
                    project_status_id: project_status_id
                },
                    headers: {
                    "Content-Type": "application/json", 
                    Authorization: `Bearer ${token}`,
                    "X-Correlation-ID": requestGUID,
                    "X-Session-ID": requestGUID,
                    "x-api-key": Cypress.env('X_API_KEY'),
                    "Api-Version": "v1",
                },
                failOnStatusCode: false,
            });
            });
    }  

    export const createBlobProject = (request_Guid = uuidv4(), folder = Cypress.env("AZURE_CONTAINER") ) => {
        const  blobURL = `https://${Cypress.env('AZURE_STORAGE_ACCOUNT')}.blob.core.windows.net/upload-file/
        ${folder}/${request_Guid}/project.json?${Cypress.env("AZURE_STORAGE_SAS")}`;
  
        cy.wrap(blobURL).as('azureURL')

         return cy.request({
            method: "PUT",
            url: blobURL,
            body: JSON.stringify({ request_guid: request_Guid }),
            headers: {
            "x-ms-blob-type": "BlockBlob",
            "Content-Type": "application/json",
            },
            failOnStatusCode: true,
        })
    }

    export const getProjectWithProjectGuid = (projectGuid) =>{
        return cy.getAuthToken()
                .its("body.access_token")
                .should("not.be.empty")
                .then((token) => {
                return cy.request({
                    method: "GET",
                    url: `/project/svc/${projectGuid}`,
                        headers: {
                        "Content-Type": "application/json", 
                        Authorization: `Bearer ${token}`,
                        "X-User-ID": projectGuid,
                        "x-api-key": Cypress.env('X_API_KEY'),
                        "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
                        "Api-Version": "v1",
                    },
                    failOnStatusCode: false,
                });
            });
    }

export const createProjectConfigWithProjectGuid = (projectGuid) => {
  return cy.getAuthToken()
    .its("body.access_token")
    .should("not.be.empty")
    .then((token) => {
      return cy.request({
        method: "POST",
        url: `/project/svc/${projectGuid}/config`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-User-ID": projectGuid, // keep only one consistent casing
          "x-api-key": Cypress.env('X_API_KEY'),
          "Api-Version": "v1",
        },
        body: {
          key: `column-height-${Date.now()}`, // dynamic key instead of {{$timestamp}}
          value: "20",
        },
        failOnStatusCode: false,
      });
    });
};

export const updateProjectConfigWithProjectGuid = (projectGuid) => {
  // Step 1: Create the config
  return cy.getAuthToken()
    .its("body.access_token")
    .should("not.be.empty")
    .then((token) => {
      return cy.request({
        method: "POST",
        url: `/project/svc/${projectGuid}/config`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
         // "X-User-ID": projectGuid,  // keep consistent casing
          "x-api-key": Cypress.env('X_API_KEY'),
          "Api-Version": "v1",
        },
        body: {
          key: "column-height",
          value: "20",
        },
        failOnStatusCode: false,
      }).then((createResp) => {
        expect(createResp.status).to.eq(201); // expect 201 for creation

        // Step 2: Update the config
        return cy.request({
          method: "POST",
          url: `/project/svc/${projectGuid}/config`,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          // "X-User-ID": projectGuid,
            "x-api-key": Cypress.env('X_API_KEY'),
            "Api-Version": "v1",
          },
          body: {
            key: "column-height",
            value: Math.floor(Math.random() * 100).toString(), // random update value
          },
          failOnStatusCode: false,
        // }).then((updateResp) => {
        //   cy.log("Update Response:", JSON.stringify(updateResp.body, null, 2));
        //   expect(updateResp.status).to.eq(200); // expect 200 for update
        //   return updateResp;
        });
      });
    });
};

export const startEligibilityProcess = (projectGuid, versionGuid) => {
  return cy.getAuthToken()
    .its("body.access_token")
    .should("not.be.empty")
    .then((token) => {
      return cy.request({
        method: "POST",
        url: "/mlops/svc/eligibility/start/",
        body: {
          project_guid: projectGuid,
          version_guid: versionGuid,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-api-key": Cypress.env('X_API_KEY'),
          "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
          "Api-Version": "v1",
        },
        failOnStatusCode: false,
      });
    });
};

export const startPredictionProcess = (projectGuid, versionGuid) => {
  return cy.getAuthToken()
    .its("body.access_token")
    .should("not.be.empty")
    .then((token) => {
      return cy.request({
        method: "POST",
        url: "/mlops/svc/prediction/start/",
        body: {
          project_guid: projectGuid,
          version_guid: versionGuid,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-api-key": Cypress.env('X_API_KEY'),
          "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
          "Api-Version": "v1",
        },
        failOnStatusCode: false,
      });
    });
};


export const uploadIfcFile = (fileName) => {
  const fileType = "application/octet-stream"; // Generic binary type for IFC

  // Ensure any previous file is cleared before uploading
  makeSureFileIsDeleted(fileName);

  // Store alias for debugging
  cy.wrap(fileName).as("blobFileName");

  return cy.fixture(fileName, "base64")
    .then((fileContent) => Cypress.Blob.base64StringToBlob(fileContent, fileType))
    .then((blob) => {
      const formData = new FormData();
      formData.append("file", blob, fileName);
      formData.append("overwrite", "true");

      // Upload IFC via existing service
      return ifcUpload(formData).then((response) => {
        const requestGUID = response.headers["x-correlation-id"];
        cy.log(`IFC uploaded: ${fileName}, requestGUID: ${requestGUID}`);

        // Keep Cypress alias for later steps
        cy.wrap(requestGUID).as("requestGUID");
        cy.wrap(response).as("FileUpload");

        return cy.wrap(requestGUID);
      });
    });
};

export const getEligibilityTaskStatus = (job_id, task_id) => {
  return cy.getAuthToken()
    .its("body.access_token")
    .should("not.be.empty")
    .then((token) => {
      return cy.request({
        method: "GET",
        url: `/mlops/svc/eligibility/status?job_id=${job_id}&task_id=${task_id}`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-api-key": Cypress.env('X_API_KEY'),
          "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
          "Api-Version": "v1"
        },
        failOnStatusCode: false,
      });
    });
};

export const getPredictionTaskStatus = (job_id, task_id) => {
  return cy.getAuthToken()
    .its("body.access_token")
    .should("not.be.empty")
    .then((token) => {
      return cy.request({
        method: "GET",
        url: `/mlops/svc/prediction/status?job_id=${job_id}&task_id=${task_id}`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-api-key": Cypress.env('X_API_KEY'),
          "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
          "Api-Version": "v1"
        },
        failOnStatusCode: false,
      });
    });
};

export const closeEligibilityJob = (job_id) => {
  return cy.getAuthToken()
    .its("body.access_token")
    .should("not.be.empty")
    .then((token) => {
      return cy.request({
        method: "POST",
        url: "/mlops/svc/eligibility/closeout/",
        body: {
           "job_id" : `${job_id}`,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-api-key": Cypress.env('X_API_KEY'),
          "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
          "Api-Version": "v1",
        },
        failOnStatusCode: false,
      });
    });
};

export const closePredictionJob = (job_id) => {
  return cy.getAuthToken()
    .its("body.access_token")
    .should("not.be.empty")
    .then((token) => {
      return cy.request({
        method: "POST",
        url: "/mlops/svc/prediction/closeout/",
        body: {
           "job_id" : `${job_id}`,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-api-key": Cypress.env('X_API_KEY'),
          "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
          "Api-Version": "v1",
        },
        failOnStatusCode: false,
      });
    });
};

export const fetchEligibilityMetric = (projectGuid) => {
  return cy.getAuthToken()
    .its("body.access_token")
    .should("not.be.empty")
    .then((token) => {
      return cy.request({
        method: "GET",
        url: `/eligibility-metric/svc/${projectGuid}`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-api-key": Cypress.env('X_API_KEY'),
          "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
          "Api-Version": "v1",
        },
        failOnStatusCode: false,
      });
    });
};

export const fetchPredictionMetric = (projectGuid) => {
  return cy.getAuthToken()
    .its("body.access_token")
    .should("not.be.empty")
    .then((token) => {
      return cy.request({
        method: "GET",
        url: `/prediction-metric/svc/${projectGuid}`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-api-key": Cypress.env('X_API_KEY'),
          "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
          "Api-Version": "v1",
        },
        failOnStatusCode: false,
      });
    });
};

export const ifcUploadHelper = (fileName, projectGuid) => {
  const fileType = "application/octet-stream"; // IFC files are binary

  return cy.fixture(fileName, "base64")
    .then((fileContent) => Cypress.Blob.base64StringToBlob(fileContent, fileType))
    .then((blob) => {
      const formData = new FormData();
      formData.append("file", blob, fileName);
      formData.append("overwrite", "true");

      return cy.getAuthToken()
        .its("body.access_token")
        .should("not.be.empty")
        .then((token) => {
          return cy.request({
            method: "POST",
            url: `/storage/svc/${projectGuid}/ifc/upload`, 
            body: formData,
            failOnStatusCode: false,
            headers: {
              "Content-Type": "multipart/form-data",
              "Authorization": `Bearer ${token}`,
              "x-api-key": Cypress.env('X_API_KEY'),
              "X-User-Id": "b50bea0e-a900-4c9e-9876-67e38b82ef69",
              "Api-Version": "v1",
            },
          });
        });
    });
};

export const uploadIfcFileHelper = (fileName) => {
  const fileType = "application/octet-stream"; // Generic binary type for IFC

  // Ensure any previous file is cleared before uploading
  makeSureFileIsDeleted(fileName);

  // Store alias for debugging
  cy.wrap(fileName).as("blobFileName");

  return cy.fixture(fileName, "base64")
    .then((fileContent) => Cypress.Blob.base64StringToBlob(fileContent, fileType))
    .then((blob) => {
      const formData = new FormData();
      formData.append("file", blob, fileName);
      formData.append("overwrite", "true");

      // Upload IFC via existing service
      return ifcUploadHelper(formData,projectGuid).then((response) => {
        const requestGUID = response.headers["x-correlation-id"];
        cy.log(`IFC uploaded: ${fileName}, requestGUID: ${requestGUID}`);

        // Keep Cypress alias for later steps
        cy.wrap(requestGUID).as("requestGUID");
        cy.wrap(response).as("FileUpload");

        return cy.wrap(requestGUID);
      });
    });
};


export const waitForEligibilityCompleted = (
  jobId,
  taskId,
  { timeout = 250000, interval = 5000 } = {}
) => {
  return cy.waitUntil(
    () => {
      // just return the Cypress chainable directly
      return getEligibilityTaskStatus(jobId, taskId).then((resp) => {
        const state = resp?.body?.task_state;
        cy.log(`Eligibility task status: ${state}`);

        // wrap in Cypress.Promise so waitUntil understands it's async
        return Cypress.Promise.resolve(
          state?.toLowerCase() === "completed"
        );
      });
    },
    {
      timeout,
      interval,
      errorMsg: `Eligibility task did not complete within ${
        timeout / 1000
      }s`,
    }
  );
};


export const waitForPredictionCompleted = (
  jobId,
  taskId,
  { timeout = 250000, interval = 5000 } = {}
) => {
  return cy.waitUntil(
    () => {
      // just return the Cypress chainable directly
      return getPredictionTaskStatus(jobId, taskId).then((resp) => {
        const state = resp?.body?.task_state;
        cy.log(`Prediction task status: ${state}`);

        // wrap in Cypress.Promise so waitUntil understands it's async
        return Cypress.Promise.resolve(
          state?.toLowerCase() === "completed"
        );
      });
    },
    {
      timeout,
      interval,
      errorMsg: `Prediction task did not complete within ${
        timeout / 1000
      }s`,
    }
  );
};

  export const makeSureBlobFolderNotExists = (blobContainer) => {
    const fileLocation = `https://${Cypress.env('AZURE_STORAGE_ACCOUNT')}.blob.core.windows.net/upload-file`

    folderCheck(fileLocation,`        ${blobContainer}/`).then((resp) => 
      {
        expect(resp.status).to.eq(200)
      
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(resp.body, "text/xml");
        const blobs = Array.from(xmlDoc.getElementsByTagName("Name")).map(el => el.textContent);
       
        blobs?.forEach((projectURL) =>  {
          const loc = `${fileLocation}/${projectURL}?${Cypress.env('AZURE_STORAGE_SAS')}`
          const deleteRequestGUID = projectURL.substring(projectURL.indexOf('/')+1,projectURL.indexOf('/project.json')).toUpperCase()

            deleteBlobFile(loc).its('status').should('eq',202)
            blobFileCheck(loc).its('status').should('eq',404)
            deleteProjectbyRequestID(deleteRequestGUID).its('length').should('eq',0)
       } ) 
      })
  }

  export const getProjectList = () => {
    return cy.getAuthToken()
      .its("body.access_token")
      .should("not.be.empty")
      .then((token) => {
        cy.request({
          method: "GET",
          url: "/project/svc/",
              headers: {
              "Content-Type": "application/json", 
              Authorization: `Bearer ${token}`,
              "x-api-key": Cypress.env('X_API_KEY'),
              "Api-Version": "v1",
          },
          failOnStatusCode: false,
        })
  })
}

export const deleteProjectNotinContainer = (blobContainer, userID) => {
    const fileLocation = `https://${Cypress.env('AZURE_STORAGE_ACCOUNT')}.blob.core.windows.net/upload-file`
    let listRequest = [];

    folderCheck(fileLocation,`        ${blobContainer}/`).then((resp) => 
      {
        expect(resp.status).to.eq(200)
      
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(resp.body, "text/xml");
        const blobs = Array.from(xmlDoc.getElementsByTagName("Name")).map(el => el.textContent);

        blobs?.forEach((projectURL) =>  {
          const retainRequestGUID = projectURL.substring(projectURL.indexOf('/')+1,projectURL.indexOf('/project.json')).toUpperCase()
          listRequest.push("".concat("'",retainRequestGUID,"'"))
       } ) 

       
       const nameList = listRequest.map(name => `${name}`).join(','); // "'Alice','Bob'"


       if (listRequest.length > 0)
        { 
          getProjectByUser(userID)
          deleteProjectNotInRequest(userID,nameList)
          }
       
      else
        deleteProjectByUser(userID)
  
      })
  }