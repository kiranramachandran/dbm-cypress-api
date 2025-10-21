Feature: Eligibility API - Create Eligibility Metric and retrieve Eligibility Summary

  Scenario: 404-Eligibility Metric Not Found (Negative test for Eligibility API)
    Given New Project created for eligibilityAPI
    When Metric not found for the projectGuid
    Then the eligibilityAPI negative response is 404
    And I delete all eligibility data for the project

Scenario: 400-Invalid Project Guid (Negative test for Eligibility API)
    Given New Project created for eligibilityAPI
    When Metric not found due to Invalid Projectguid
    Then the eligibilityAPI negative response is 400
    And I delete all eligibility data for the project

   Scenario: Eligibility Process-E2E (Positive ASYNC test for Eligibility API)
    Given New Project created for eligibilityAPI
    Then I start eligibility process by uploading "ifcForEligibility.ifc"
    And the Response Status is 202
    And the eligibility response contains values
    When I fetch the eligibility task status
    Then the eligibility task status response is 200
    When I wait until eligibility is completed and fetch the metric
    Then the eligibility metric response contains required values
    And I delete all eligibility data for the project