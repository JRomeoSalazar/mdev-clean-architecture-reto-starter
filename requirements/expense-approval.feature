Feature: Expense approval

  Scenario: An inexpensive meal is automatically approved
    Given an employee submits a meals expense of 4500 cents
    When the expense is submitted
    Then it is approved by the system
    And the employee is notified

  Scenario: Training requires a manager
    Given an employee submits a training expense of 60000 cents
    When the expense is submitted
    Then it remains pending
    And its required role is manager

  Scenario: Personal expenses are forbidden
    Given an employee submits a personal expense of 2000 cents
    When the expense is submitted
    Then it is rejected by the system
    And the employee is notified

  Scenario: An employee cannot approve their own expense
    Given an employee has a pending expense
    When the same employee tries to approve it
    Then the approval is rejected
    And the expense remains pending
