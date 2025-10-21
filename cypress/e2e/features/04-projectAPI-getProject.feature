Feature: ProjectAPI - List projects - GET Project

  Scenario: 200-List all projects for the user
    Given There are no existing projects outside "cypress-get-project"
    When Project is created using Project API
    Then Get the list of all projects with response code 200
    And the project list matches with DB

  Scenario: 200-List all projects for a projectGuid
    Given "cypress-get-project" is created in Azure Blob
    When Create project using Project API with Azure request GUID
    Then the create project response code is 201 
    When GetProjects API is used with project GUID
    Then the get project response code is 200
    And the project is available in Blob and DB
    And the project GUID is deleted from Azure Blob and DB

  Scenario: 404-getProject-Project Not Found
    Given I try to get Project details of a ProjectID which does not exist in DB 
    Then the projectAPI response code is 404