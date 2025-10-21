  Feature: ProjectAPI - Update Project
  
  Scenario: 200-Update Project
    Given Create project in Azure Blob
    When Create project using Project API with Azure request GUID
    Then the create project response code is 201
    And I update the project details with response code 200
    And the GUID is stored in Azure Blob
    And I delete the project named "Updated Project Name"
    
  Scenario: 400-Update Project with Invalid Project Guid
    Given Create project in Azure Blob
    When Create project using Project API with Azure request GUID
    Then the create project response code is 201
    And Update Project with invalid ProjectGuid gets response code 400