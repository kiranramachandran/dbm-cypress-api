Feature: ProjectAPI - Create Project

  Scenario: 201-Create a project with dynamic GUID and store in Azure Blob
    Given "cypress-create-project" is created in Azure Blob
    When Create project using Project API with Azure request GUID
    Then the create project response code is 201 
    And the project is available in Blob and DB
    And the project GUID is deleted from Azure Blob and DB
   

  Scenario: 400-Invalid JSON Payload (Create Project)
    Given a new project GUID is generated and uploaded to Azure Blob
    When I try to create a project using invalid payload
    Then the projectAPI response code is 400
    And the project is NOT available in DB
    # And the project GUID is deleted from Azure Blob and DB
    And I delete the project named "Test Automation Project API"
