describe("Blog app", function () {
  beforeEach(function () {
    cy.request("POST", "http://localhost:3003/api/testing/reset") 
    const user = {
      name: "Jayshree",
      username: "password111",
      password: "password111",
    } 
    cy.request("POST", "http://localhost:3003/api/users/", user) 
    cy.visit("http://localhost:3000") 
  }) 

  it("Login form is shown", function () {
    cy.contains("Log in to application") 
  }) 

  describe("Login", function () {
    it("succeeds with correct credentials", function () {
      cy.get("#username").type("password111") 
      cy.get("#password").type("password111") 
      cy.get("#login-btn").click() 
      cy.contains("Jayshree logged in") 
    }) 

    t('fails with wrong credentials', function() {
      cy.get('#username').type('root')
      cy.get('#password').type('secret00')
      cy.get('#login-button').click()
      cy.contains('Wrong credentials')
    })
  })

  describe("When logged in", function () {
    beforeEach(function() {
      // log in user here
      cy.visit('http://localhost:3000')
      cy.get('#username').type('password111')
      cy.get('#password').type('password111')
      cy.get('#login-button').click()
    })


    it("a blog can be created", function () {
      cy.createBlog({
        title: "A blog created by cypress",
        author: "Cypress",
        url: "www.github.com",
      }) 

      cy.contains("A blog created by cypress") 
    }) 

    describe("and several blogs exist", function () {
      beforeEach(function () {
        cy.createBlog({
          title: "fresh life",
          author: "cypress",
          url: "www.github.com",
        }) 
        cy.createBlog({
          title: " sentimental life",
          author: "cypress",
          url: "www.github.com",
        }) 
        cy.createBlog({
          title: "tiring life",
          author: "cypress",
          url: "www.github.com",
        }) 
      }) 

      it("'A blog can be Liked", function () {
        cy.contains("tiring life").parent().find("button").click() 
        cy.get("#like-btn").click() 
      }) 

      it("A blog can be Deleted", function () {
        cy.contains(" sentimental life").parent().find("button").click() 
        cy.get("#delete-btn").click() 
        cy.get("html").should("not.contain", " sentimental life") 
      }) 

      it("Blogs are well ordered",  function () {
        cy.contains("tiring life").parent().find("button").click() 
        cy.get("#like-btn").click().wait(500).click().wait(500) 
        cy.contains("tiring life").parent().find("button").click() 

        cy.contains(" sentimental life").parent().find("button").click() 
        cy.get("#like-btn")
          .click()
          .wait(500)
          .click()
          .wait(500)
          .click()
          .wait(500) 

        cy.get(".blog").eq(0).should("contain", " sentimental life") 
        cy.get(".blog").eq(1).should("contain", "tiring life") 
        cy.get(".blog").eq(2).should("contain", "fresh life") 
      }) 
    }) 
  }) 
}) 