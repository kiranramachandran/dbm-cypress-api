
Cypress.Commands.add("getAuthToken", () => {
    return cy.request({
        method: "POST",
        url: Cypress.env('TOKEN_URL'),
        body: {
            client_id: Cypress.env('AUTH_CLIENT_ID'),
            client_secret: Cypress.env('AUTH_CLIENT_SECRET'),
            grant_type: "client_credentials",
            scope: Cypress.env('TOKEN_SCOPE')
        },
        failOnStatusCode: false,
        form: true
     });
});