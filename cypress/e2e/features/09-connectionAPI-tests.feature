Feature: Connection API Scenarios- API for managing connections & retrieving connection details.

Scenario: Connection API - Keep connections for a project
    Given New Project created for eligibilityAPI
    When I execute full eligibility and prediction workflow for "ifcForEligibility.ifc"
    Then I fetch the connection guid and option guid for the project
    And I keep connection on ConnectionsAPI successfully
    When I fetch prediction actions for the project
    Then the prediction actions table should have valid GUIDs and status
    And I delete all eligibility and prediction data for the project

 Scenario: Connection API - Drop connections for a project
    Given New Project created for eligibilityAPI
    When I execute full eligibility and prediction workflow for "ifcForEligibility.ifc"
    Then I fetch the connection guid and option guid for the project
    And I drop connection on ConnectionsAPI successfully
    When I fetch prediction actions for the project
    Then the prediction actions table should have valid GUIDs and status
    And I delete all eligibility and prediction data for the project

 Scenario: Connection API - Update status of a connection
    Given New Project created for eligibilityAPI
    When I execute full eligibility and prediction workflow for "ifcForEligibility.ifc"
    Then I fetch the connection guid and option guid for the project
    And I update connection status
    When I fetch prediction actions for the project
    Then the prediction actions table should have valid GUIDs and status
    And I delete all eligibility and prediction data for the project

 Scenario: Connection API - Get all connections metrics for a project
    Given New Project created for eligibilityAPI
    When I execute full eligibility and prediction workflow for "ifcForEligibility.ifc"
    Then I fetch the connection guid and option guid for the project
    And I get overall connection metrics
    And I fetch prediction action status for the project
    And I fetch eligibility profile count for the project
    And I delete all eligibility and prediction data for the project

Scenario: Connection API - Get Connection Counts For A Project
    Given New Project created for eligibilityAPI
    When I execute full eligibility and prediction workflow for "ifcForEligibility.ifc"
    Then I fetch the connection guid and option guid for the project
    And I get connection counts for a project
    And Then I fetch connection count for a project from DB
    And I delete all eligibility and prediction data for the project   

 Scenario: Connection API - Get primary members details
   Given New Project created for eligibilityAPI
   When I execute full eligibility and prediction workflow for "ifcForEligibility.ifc"
   Then I fetch the connection guid and option guid for the project
   And I retrieve primary member counts on project and version
   And I validate the primary members response
   And I verify primary profile count from DB
    And I delete all eligibility and prediction data for the project  

 Scenario: Connection API - Get secondary members details
   Given New Project created for eligibilityAPI
   When I execute full eligibility and prediction workflow for "ifcForEligibility.ifc"
   Then I fetch the connection guid and option guid for the project
   And I retrieve secondary member counts on project and version
   And I validate the secondary members response
   And I verify secondary profile count from DB
    And I delete all eligibility and prediction data for the project

Scenario: Connection API - Get connection list
   Given New Project created for eligibilityAPI
   When I execute full eligibility and prediction workflow for "ifcForEligibility.ifc"
   Then I fetch the connection guid and option guid for the project
   And I retrieve Retrieve connection details for specific primary and secondary member
   And I validate the get connection list response
   And I verify get connection list from DB
   And I get connection member details and status
    And I delete all eligibility and prediction data for the project
    
 Scenario: Connection API - Get reasons for prediction actions
   Given New Project created for eligibilityAPI
   When I execute full eligibility and prediction workflow for "ifcForEligibility.ifc"
   Then I fetch the connection guid and option guid for the project
   And I get all the reasons that can be used to drop a connection
   And I validate the reasons response
    And I delete all eligibility and prediction data for the project

 Scenario: Connection API - Get connection member details and status
   Given New Project created for eligibilityAPI
   When I execute full eligibility and prediction workflow for "ifcForEligibility.ifc"
   Then I fetch the connection guid and option guid for the project
   And I get connection member details and status
   And I validate the connection member details and status response
    And I delete all eligibility and prediction data for the project