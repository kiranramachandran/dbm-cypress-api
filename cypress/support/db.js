    
//----------------------------------------------------------------------------//
                // FILE UPLOAD QUERIES
//----------------------------------------------------------------------------//
    export const deleteUploadedFile = (documentGUID) => {
       return cy.task("queryDatabase", {
        query: `DELETE FROM [dbo].[document] WHERE document_guid = '${documentGUID}'`
      })
    }  

    export const getFileByName = (documentName) => {
       return cy.task("queryDatabase", {
        query: `SELECT * FROM [dbo].[document] WHERE document_name = '${documentName}'`
      })
    }  

    export const getFileByRequestGUID = (requestGUID) => {
       return cy.task("queryDatabase", {
        query: `SELECT * FROM [dbo].[document] WHERE request_guid = '${requestGUID}'`
      })
    } 

    //----------------------------------------------------------------------------//
                //PROJECT QUERIES
//----------------------------------------------------------------------------//

    export const getDocumentbyProjectName = (projectName) => {
       return   cy.task("queryDatabase", {
        query: `SELECT * FROM [dbo].[document] 
        where project_guid IN(
        Select Project_guid
        FROM [dbo].[project] WHERE project_name = '${projectName}'
        )`
      })
    } 

    export const getDocumentbyProjectGuid = (projectId) => {
       return   cy.task("queryDatabase", {
        query: `SELECT * FROM [dbo].[document] 
        where project_guid = ${projectId}`
      })
    } 

    export const deleteProjectbyName = (projectName) => {
       return cy.task("queryDatabase", {
        query: `DELETE FROM [dbo].[project] WHERE project_name = '${projectName}'`
      })
    }  

    export const deleteProjectbyRequestID = (requestID) => {
       return cy.task("queryDatabase", {
        query: `DELETE FROM [dbo].[project] WHERE request_guid = '${requestID}'`
      })
    } 

    export const deleteProjectNotInRequest = (user, requestID) => {
       return cy.task("queryDatabase", {
        query: `DELETE FROM [dbo].[project] WHERE request_guid NOT IN(${requestID}) and  insert_user_guid = '${user}'`
      })
    } 

    export const deleteProjectByUser = (user) => {
       return cy.task("queryDatabase", {
        query: `DELETE FROM [dbo].[project] WHERE insert_user_guid = '${user}'`
      })
    } 

    export const getProjectByUser = (user) => {
       return cy.task("queryDatabase", {
        query: `SELECT * FROM [dbo].[project] WHERE insert_user_guid= '${user}'`
      })
    } 
     export const getProjectbyName = (projectName) => {
       return cy.task("queryDatabase", {
        query: `SELECT * FROM [dbo].[project] WHERE project_name = '${projectName}'`
      })
    }  

      export const getProjectbyGUID = (projectID) => {
       return cy.task("queryDatabase", {
        query: `SELECT * FROM [dbo].[project] WHERE project_guid = '${projectID}'`
      })
    } 

    export const getProjectbyRequest = (requestID) => {
       return cy.task("queryDatabase", {
        query: `SELECT * FROM [dbo].[project] WHERE request_guid = '${requestID}'`
      })
    } 

    export const deleteDocumentbyProjectGuid = (projectId) => {
       return   cy.task("queryDatabase", {
        query: `DELETE FROM [dbo].[document] 
        where project_guid = '${projectId}'`
      })
    } 

    export const deleteProjectbyGUID = (projectID) => {
       return cy.task("queryDatabase", {
        query: `DELETE FROM [dbo].[project] WHERE project_guid = '${projectID}'`
      })
    } 
    //----------------------------------------------------------------------------//
                // PROJECT CONFIG QUERIES
//----------------------------------------------------------------------------//

export const deleteProject = (updatedProjectname) => {
  return cy.task("queryDatabase", {
    query: `DELETE FROM [dbo].[project] WHERE project_name = '${updatedProjectname}'`,
  });
};

export const deleteProjectConfig = (updatedProjectname) => {
  return cy.task("queryDatabase", {
    query: `DELETE pc
FROM [dbo].[project_config] pc
INNER JOIN [dbo].[project] p 
    ON pc.project_guid = p.project_guid
WHERE p.project_name = '${updatedProjectname}'`,
  });
};
//----------------------------------------------------------------------------//
                // ELIGIBILITY API QUERIES
//----------------------------------------------------------------------------//

export const getGuidsFromPartsTable = (fileName) => {
  return cy.task("queryDatabase", {
    query: `
      SELECT DISTINCT pr.project_guid, pr.version_guid
      FROM [dbo].[parts_report] pr
      INNER JOIN (
          SELECT TOP 1 project_guid
          FROM [dbo].[document]
          WHERE document_name = '${fileName}'
          ORDER BY insert_timestamp DESC
      ) d ON pr.project_guid = d.project_guid;
    `,
  });
};

export const deletePartsReportByDocument = (fileName) => {    
  return cy.task("queryDatabase", {
    query: `
      DELETE FROM [dbo].[parts_report]
      WHERE project_guid = (
          SELECT TOP 1 project_guid
          FROM [dbo].[document]
          WHERE document_name = '${fileName}'
          ORDER BY insert_timestamp DESC)`,
  });
};

export const deletePartsReportByProjectId = (project_guid) => {
  return cy.task("queryDatabase", {
    query: `
      DELETE FROM [dbo].[parts_report] 
      WHERE project_guid = '${project_guid}';
    `,
  });
};

export const deletePartsReportVersions = (projectGuid) => {
  return cy.task("queryDatabase", {
    query: `
      DELETE FROM [dbo].[parts_report_version] 
      WHERE project_guid = '${projectGuid}';
    `,
  });
};


export const deleteDocumentByName = (fileName, projectGuid) => {
  return cy.task("queryDatabase", {
    query: `
     DELETE FROM [dbo].[document] 
      WHERE project_guid = '${projectGuid}'
        AND document_name = '${fileName}';
    `,
  });
};


export const deleteEligibilityMetric = (project_guid) => {
  return cy.task("queryDatabase", {
    query: `
      DELETE FROM [dbo].[eligibility_metric] 
      WHERE project_guid = '${project_guid}';
    `,
  });
};

export const deleteProjectData = (projectGuid) => {
  return cy.task("queryDatabase", {
    query: `
      DELETE FROM [dbo].[project] 
      WHERE project_guid = '${projectGuid}';
    `,
  });
};

//----------------------------------------------------------------------------//
                // PREDICTION API QUERIES
//----------------------------------------------------------------------------//

export const deletePredictionMetric = (project_guid) => {
  return cy.task("queryDatabase", {
    query: `
      DELETE FROM [dbo].[prediction_metric] 
      WHERE project_guid = '${project_guid}';
    `,
  });
};

//----------------------------------------------------------------------------//
                // CONNECTION API QUERIES
//----------------------------------------------------------------------------//

export const getConnectionOptionGuid = (project_guid) => {
  return cy.task("queryDatabase", {
    query: `
      Select distinct 
      b.connection_guid,
       b.option_guid,
       b.project_guid
          from [dbo].[eligibility_connection] e
          inner join [dbo].[prediction_option] b
           on e.[project_guid] = b.[project_guid]
          where e.[project_guid] = '${project_guid}';
    `,
  });
};

export const queryPredictionActionsTable = (project_guid) => {
  return cy.task("queryDatabase", {
    query: `
      Select connection_guid,
       option_guid,
       project_guid,
       status
        from [dbo].[prediction_actions] 
          where project_guid = '${project_guid}';
    `,
  });
};

export const deleteFromPredictionOptionTable = (project_guid) => {
  return cy.task("queryDatabase", {
    query: `
      -- Step 1: Delete dependent rows from prediction table first
      DELETE FROM [dbo].[prediction]
      WHERE suggested_option_guid IN (
        SELECT option_guid FROM [dbo].[prediction_option] WHERE project_guid = '${project_guid}'
      );

      -- Step 2: Delete from prediction_option
      DELETE FROM [dbo].[prediction_option]
      WHERE project_guid = '${project_guid}';
    `,
  });
};


export const deleteFromPredictionActionsTable = (project_guid) => {
  return cy.task("queryDatabase", {
    query: `
      DELETE
        from [dbo].[prediction_actions] 
          where project_guid = '${project_guid}';
    `,
  });
};

// ---- CONNECTION - ELIGIBILITY QUERIES----------


export const deleteEligibilityMetrics = (project_guid, version_guid) => {
  return cy.task("queryDatabase", {
    query: `
      DELETE FROM [dbo].[eligibility_metric]
      WHERE project_guid = '${project_guid}'
      AND version_guid = '${version_guid}';
    `,
  });
};

export const deleteEligibilityConnection = (project_guid, version_guid) => {
  return cy.task("queryDatabase", {
    query: `
      DELETE FROM [dbo].[eligibility_connection]
      WHERE project_guid = '${project_guid}'
      AND version_guid = '${version_guid}';
    `,
  });
};

export const deleteEligibilityMember = (project_guid, version_guid) => {
  return cy.task("queryDatabase", {
    query: `
      DELETE FROM [dbo].[eligibility_member]
      WHERE project_guid = '${project_guid}'
      AND version_guid = '${version_guid}';
    `,
  });
};

// ---- CONNECTION - PREDICTION QUERIES----------

export const deleteDropReasonsByProjectAndVersion = (project_guid, version_guid) => {
  return cy.task("queryDatabase", {
    query: `
      DELETE FROM [dbo].[drop_reasons]
      WHERE prediction_action_id IN (
        SELECT pa.prediction_action_id
        FROM [dbo].[prediction_actions] pa
        INNER JOIN [dbo].[prediction_option] po 
          ON pa.option_guid = po.option_guid
        WHERE po.project_guid = '${project_guid}'
          AND po.version_guid = '${version_guid}'
      );
    `,
  });
};

export const deletePredictionSelectedConnection = (project_guid, version_guid) => {
  return cy.task("queryDatabase", {
    query: `
      DELETE FROM [dbo].[prediction_selected_connection]
      WHERE project_guid = '${project_guid}'
      AND version_guid = '${version_guid}';
    `,
  });
};

export const deletePrediction = (project_guid) => {
  return cy.task("queryDatabase", {
    query: `
      DELETE FROM [dbo].[prediction]
      WHERE suggested_option_guid IN (
        SELECT option_guid FROM [dbo].[prediction_option] WHERE project_guid = '${project_guid}'
      );
    `,
  });
};

export const deletePredictionActions = (project_guid) => {
  return cy.task("queryDatabase", {
    query: `
      DELETE FROM [dbo].[prediction_actions]
      WHERE project_guid = '${project_guid}';
    `,
  });
};

export const deletePredictionOption = (project_guid) => {
  return cy.task("queryDatabase", {
    query: `
      DELETE FROM [dbo].[prediction_option]
      WHERE project_guid = '${project_guid}';
    `,
  });
};

export const deleteFromPredictionAttribute = (project_guid, version_guid) => {
  return cy.task("queryDatabase", {
    query: `
      DELETE FROM [dbo].[prediction_attribute]
      WHERE project_guid = '${project_guid}'
        AND version_guid = '${version_guid}';
    `,
  });
};

export const deleteFromPredictionMetric = (project_guid, version_guid) => {
  return cy.task("queryDatabase", {
    query: `
      DELETE FROM [dbo].[prediction_metric]
      WHERE project_guid = '${project_guid}'
        AND version_guid = '${version_guid}';
    `,
  });
};

export const deleteFromPredictionBatchSetting = (project_guid, version_guid) => {
  return cy.task("queryDatabase", {
    query: `
      DELETE FROM [dbo].[prediction_batch_setting]
      WHERE project_guid = '${project_guid}'
        AND version_guid = '${version_guid}';
    `,
  });
};

// ---- CONNECTION - OVERALL CONNECTION METRICS QUERIES----------

export const getPredictionActionStatus = (project_guid) => {
  return cy.task("queryDatabase", {
    query: `
      SELECT 
        SUM(CASE WHEN status = 'kept' THEN 1 ELSE 0 END) AS kept,
        SUM(CASE WHEN status = 'dropped' THEN 1 ELSE 0 END) AS dropped
      FROM [dbo].[vw_latest_prediction_actions_status]
      WHERE project_guid = '${project_guid}';
    `,
  });
};

export const getEligibilityProfileCount = (project_guid) => {
  return cy.task("queryDatabase", {
    query: `
      SELECT COUNT(*) AS total
      FROM [dbo].[vw_eligibility_profile_count]
      WHERE project_guid = '${project_guid}';
    `,
  });
};

export const deleteOverallConnectionMetrics = (project_guid) => {
  return cy.task("queryDatabase", {
    query: `
      DELETE
      FROM [dbo].[vw_latest_prediction_actions_status]
      WHERE project_guid = '${project_guid}';
    `,
  });
};

export const getEligibilityProfileSummary = (project_guid, version_guid) => {
  return cy.task("queryDatabase", {
    query: `
      SELECT 
      COUNT(*) AS connection_count,
      COUNT(DISTINCT primary_part_guid) AS profile_count
      FROM [dbo].[vw_eligibility_profile_count]
      WHERE framing_condition = 'bcf'
      AND version_guid = '${version_guid}'
      AND project_guid = '${project_guid}';
    `,
  });
};

export const getPrimaryProfileCount = (project_guid, version_guid) => {
  return cy.task("queryDatabase", {
    query: `
      SELECT * FROM [dbo].[vw_primary_profile_count]
      WHERE framing_condition = 'bbw'
      AND version_guid = '${version_guid}'
      AND project_guid = '${project_guid}';
    `,
  });
};

export const getSecondaryProfileCount = (project_guid, version_guid) => {
  return cy.task("queryDatabase", {
    query: `
      SELECT * FROM [dbo].[vw_secondary_profile_count]
      WHERE framing_condition = 'bcw'
      AND version_guid = '${version_guid}'
      AND project_guid = '${project_guid}';
    `,
  });
};

export const getConnectionList = (project_guid, version_guid) => {
  return cy.task("queryDatabase", {
    query: `
      SELECT * FROM [dbo].[vw_eligibility_connection_summary]
      WHERE framing_condition = 'bcw'
      AND version_guid = '${version_guid}'
      AND project_guid = '${project_guid}';
    `,
  });
};

export const view_eligibility_connection_summary = (project_guid, version_guid) => {
  return cy.task("queryDatabase", {
    query: `
      SELECT 
      project_guid, 
      connection_guid, 
      primary_part_guid, 
      secondary_part_guid 
      FROM [dbo].[vw_eligibility_connection_summary] 
      WHERE framing_condition = 'bcw'
      AND version_guid = '${version_guid}'
      AND project_guid = '${project_guid}';
    `,
  });
};

// -------- CONSOLIDATED QUERY FOR TEARDOWN ----------------//

export const deleteEligibilityAndPredictionData = (project_guid, version_guid) => {
  cy.log(`Starting teardown for project: ${project_guid}, version: ${version_guid}`);

  // ---- CONNECTION - ELIGIBILITY TABLES (delete in FK-safe order)
  cy.task("queryDatabase", {
    query: `
      DELETE FROM [dbo].[eligibility_metric]
      WHERE project_guid = '${project_guid}'
      AND version_guid = '${version_guid}';
    `,
  })
  .then(() => {
    cy.task("queryDatabase", {
      query: `
        DELETE FROM [dbo].[eligibility_member]
        WHERE project_guid = '${project_guid}'
        AND version_guid = '${version_guid}';
      `,
    });
  })

  // ---- CONNECTION - PREDICTION TABLES (delete in FK-safe order)
  .then(() => {
    cy.task("queryDatabase", {
      query: `
        DELETE FROM [dbo].[drop_reasons]
        WHERE prediction_action_id IN (
          SELECT pa.prediction_action_id
          FROM [dbo].[prediction_actions] pa
          INNER JOIN [dbo].[prediction_option] po 
            ON pa.option_guid = po.option_guid
          WHERE po.project_guid = '${project_guid}'
            AND po.version_guid = '${version_guid}'
        );
      `,
    });
  })
  .then(() => {
    cy.task("queryDatabase", {
      query: `
        DELETE FROM [dbo].[prediction_selected_connection]
        WHERE project_guid = '${project_guid}'
        AND version_guid = '${version_guid}';
      `,
    });
  })
  .then(() => {
    cy.task("queryDatabase", {
      query: `
        DELETE FROM [dbo].[prediction_attribute]
        WHERE project_guid = '${project_guid}'
        AND version_guid = '${version_guid}';
      `,
    });
  })
  .then(() => {
    cy.task("queryDatabase", {
      query: `
        DELETE FROM [dbo].[prediction_metric]
        WHERE project_guid = '${project_guid}'
        AND version_guid = '${version_guid}';
      `,
    });
  })
  .then(() => {
    cy.task("queryDatabase", {
      query: `
        DELETE FROM [dbo].[prediction_batch_setting]
        WHERE project_guid = '${project_guid}'
        AND version_guid = '${version_guid}';
      `,
    });
  })
  .then(() => {
    cy.task("queryDatabase", {
      query: `
        DELETE FROM [dbo].[prediction]
        WHERE suggested_option_guid IN (
          SELECT option_guid FROM [dbo].[prediction_option] WHERE project_guid = '${project_guid}'
        );
      `,
    });
  })
  .then(() => {
    cy.task("queryDatabase", {
      query: `
        DELETE FROM [dbo].[prediction_actions]
        WHERE project_guid = '${project_guid}';
      `,
    });
  })
  .then(() => {
    cy.task("queryDatabase", {
      query: `
        DELETE FROM [dbo].[prediction_option]
        WHERE project_guid = '${project_guid}';
      `,
    });
  })
    .then(() => {
    cy.task("queryDatabase", {
      query: `
        DELETE FROM [dbo].[eligibility_connection]
        WHERE project_guid = '${project_guid}'
        AND version_guid = '${version_guid}';
      `,
    });
  })
  .then(() => {
    cy.log(`Teardown completed for project: ${project_guid}, version: ${version_guid}`);
  });
};

export const deleteEligibilityData = (project_guid) => {
  cy.log(`Starting teardown for project: ${project_guid}`);

  // Return the Cypress chain so .then() can be used
  return cy
    .task("queryDatabase", {
      query: `
        DELETE FROM [dbo].[eligibility_metric]
        WHERE project_guid = '${project_guid}';
      `,
    })
    .then(() => {
      return cy.task("queryDatabase", {
        query: `
          DELETE FROM [dbo].[eligibility_member]
          WHERE project_guid = '${project_guid}';
        `,
      });
    })
    .then(() => {
      return cy.task("queryDatabase", {
        query: `
          DELETE FROM [dbo].[parts_report_version]
          WHERE project_guid = '${project_guid}';
        `,
      });
    })
    .then(() => {
      return cy.task("queryDatabase", {
        query: `
          DELETE FROM [dbo].[document]
          WHERE project_guid = '${project_guid}';
        `,
      });
    })
    .then(() => {
      return cy.task("queryDatabase", {
        query: `
          DELETE FROM [dbo].[project_config]
          WHERE project_guid = '${project_guid}';
        `,
      });
    })
    .then(() => {
      return cy.task("queryDatabase", {
        query: `
          DELETE FROM [dbo].[project]
          WHERE project_guid = '${project_guid}';
        `,
      });
    })
    .then(() => {
      cy.log(`Teardown completed for project: ${project_guid}`);
    });
};
