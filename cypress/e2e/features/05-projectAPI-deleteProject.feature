  Feature: ProjectAPI - Delete Project

  Scenario: 200-Delete a project in Azure Blob & also in DB
    Given a new project GUID is generated and uploaded to Azure Blob
    When I create a project using the same project GUID
    Then the projectAPI response code is 201 
    And the GUID is stored in Azure Blob
    And the project GUID is deleted from Azure Blob and DB
    And I delete the project named "Test Automation Project API"