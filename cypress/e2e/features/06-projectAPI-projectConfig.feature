Feature: ProjectAPI - Create and Update Project Config

  Scenario: 201-Create Project Config
    Given I create a new project
    When I create a project config for the project
    Then the projectConfig create response is 201
    And I delete the project named "Test Automation Project API"

  Scenario: 200-Update Project Config
   Given I create a new project
   And I update the project config
   Then the project config update response is 200
  And I delete the project named "Test Automation Project API"

