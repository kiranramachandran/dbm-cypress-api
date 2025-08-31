import { endpoints } from './endpoints';

Cypress.Commands.add("getAuthToken", () => {
    return cy.request({
        method: "POST",
        url: "https://auth-dev.ciamlogin.com/auth-dev.connectionai.com.au/oauth2/v2.0/token",
        body: {
            client_id: '9e41f34f-6422-407d-bcd5-f1399fa09391',
            client_secret: 'kCY8Q~0LAVzcHHphrqlkwQOaTV~PLrQwtH.vucNr',
            grant_type: "client_credentials",
            scope: "api://9a9967e0-0c92-43b4-b883-966cfb175b85/.default"
        },
        failOnStatusCode: false,
        form: true
    }).then((response) => {
        const token = response.body.access_token;
       // const token = response.body.token; // 🔹 Adjust based on your API response
        Cypress.env('authToken', token);   // Store globally in Cypress env
        expect(response.status).to.eq(200);
        return token;
        
     });
});