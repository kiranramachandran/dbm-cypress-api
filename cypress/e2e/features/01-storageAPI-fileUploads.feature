# -----------------------------------------------------------------------------------
# -------------------------- IFC File Upload Scenarios ------------------------------
# -----------------------------------------------------------------------------------

Feature: StorageAPI - Upload IFC & PDF Files to Azure Blob using StorageAPI

Scenario: 201-Upload - Valid IFC2x3
Given New Project created for fileUploads
When IFC file "2x3-Test-5MB.ifc" is uploaded using Storage API
Then the API response code is 201
Then Uploaded File can be found in DB
And Uploaded File can be viewed in Azure Blob
And Uploaded File can be deleted from Azure Blob and DB

Scenario: 201-Upload - Valid IFCZIP
Given New Project created for fileUploads
When IFC file "ZIP-Test-118KB.ifcZIP" is uploaded using Storage API
Then the API response code is 201
And Uploaded File can be found in DB
And Uploaded File can be viewed in Azure Blob
And Uploaded File can be deleted from Azure Blob and DB

Scenario: 422-Upload - Disguised IFC
Given New Project created for fileUploads
When IFC file "Disguised-Fake.ifc" is uploaded using Storage API
Then the API response code is 422
And Uploaded File cannot be found in DB
And Uploaded File Not Present in Azure Blob

Scenario: 422-Upload - Non-IFC
Given New Project created for fileUploads
When IFC file "2x3-Test-1KB.txt" is uploaded using Storage API
Then the API response code is 422
And Uploaded File cannot be found in DB
And Uploaded File Not Present in Azure Blob

Scenario: 422-Upload - Valid IF4
Given New Project created for fileUploads
When IFC file "IFC4-Test-1.1MB.ifc" is uploaded using Storage API
Then the API response code is 422
And Uploaded File can be found in DB
And Uploaded File can be viewed in Azure Blob
And Uploaded File can be deleted from Azure Blob and DB

# -----------------------------------------------------------------------------------
# -------------------------- PDF File Upload Scenarios ------------------------------
# -----------------------------------------------------------------------------------

Scenario Outline: 201-Upload a Valid PDF
Given New Project created for fileUploads
When PDF file "PDF-Test-108KB.pdf" is uploaded using Storage API
Then the API response code is 201
And Uploaded File can be found in DB
And Uploaded File can be viewed in Azure Blob
And Uploaded File can be deleted from Azure Blob and DB

Scenario: 422-Upload - Non-PDF
Given New Project created for fileUploads
When PDF file "2x3-Test-1KB.txt" is uploaded using Storage API
Then the API response code is 422
And Uploaded File cannot be found in DB
And Uploaded File Not Present in Azure Blob 

Scenario: 422-Upload - Invalid-PDF-Format
Given New Project created for fileUploads
When PDF file "Invalid_PDF.pdf" is uploaded using Storage API
Then the API response code is 422
And Uploaded File cannot be found in DB
And Uploaded File Not Present in Azure Blob 

