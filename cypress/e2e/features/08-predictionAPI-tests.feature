Feature: Prediction API - E2E flow from start of prediction to end

 Scenario: Prediction Process-E2E (Positive ASYNC test for Prediction API)
    Given New project created for predictionAPI
    And I start prediction process by uploading "ifcForEligibility.ifc"
     Then the Prediction Response Status is 202
     And the prediction response contains values
     When I fetch the prediction task status
     Then the prediction task status response is 200
     When I wait until prediction is completed and fetch the metric
    And I delete parts report for document "ifcForEligibility.ifc"
    And I delete parts report for the project
    And I delete parts report versions for the project
    And I delete document "ifcForEligibility.ifc" for the project
    And I delete prediction metric for the project
    And I delete the project data