import request from "supertest";
import app from "../../app";
import Expense from "../../api/models/expense.model";
import Income from "../../api/models/income.model";
import Budget from "../../api/models/budget.model";
import User from "../../api/models/user.model";
import generateReports from "../controllers/report/generateReports";
import generateUserBudget from "../controllers/report/generateUserBudget";
import generateUserReport from "../controllers/report/generateUserReport";
import getAvailableDates from "../controllers/report/getAvailableDates";
import axios from "axios";
import jwt from "jsonwebtoken";

// Mock dependencies
jest.mock("../../api/models/expense.model");
jest.mock("../../api/models/income.model");
jest.mock("../../api/models/budget.model");
jest.mock("../../api/models/user.model");
jest.mock("axios");

// Mock the jwt module
jest.mock("jsonwebtoken", () => ({
  ...jest.requireActual("jsonwebtoken"),
  verify: jest.fn(),
}));

jest.mock("../../api/middleware/authMiddleware", () =>
  jest.fn(roles => (req, res, next) => {
    req.user = { role: roles.includes("admin") ? "admin" : "user" }; // Mock user role assignment
    next();
  })
);

const mockUser = {
  _id: "mockUserId",
  email: "testuser@example.com",
  role: "user",
  currency: "USD",
};

const mockAdmin = {
  _id: "mockAdminId",
  email: "adminuser@example.com",
  role: "admin",
  currency: "USD",
};

const mockExpenses = [
  {
    _id: "expenseId1",
    email: "testuser@example.com",
    category: "food",
    currency: "USD",
    amount: 100,
    date: "2024-03-15T00:00:00.000Z",
  },
];

const mockIncomes = [
  {
    _id: "incomeId1",
    email: "testuser@example.com",
    category: "salary",
    currency: "USD",
    amount: 2000,
    date: "2024-03-15T00:00:00.000Z",
  },
];

const mockBudgets = [
  {
    _id: "budgetId1",
    email: "testuser@example.com",
    category: "food",
    currency: "USD",
    budget: 500,
    remainingBudget: 200,
    startDate: new Date("2024-03-01T00:00:00.000Z"),
    endDate: new Date("2024-03-31T23:59:59.999Z"),
  },
];

let token, adminToken;

beforeEach(() => {
  jest.clearAllMocks();

  // Mock user and admin authentication
  jwt.verify.mockImplementation(token => {
    if (token === "mockUserToken") {
      return { _id: "mockUserId", role: "user", email: "testuser@example.com" };
    }
    if (token === "mockAdminToken") {
      return {
        _id: "mockAdminId",
        role: "admin",
        email: "adminuser@example.com",
      };
    }
  });

  // Mocking model methods with proper `.select()` behavior
  Expense.find.mockResolvedValue(mockExpenses);
  Income.find.mockResolvedValue(mockIncomes);
  Budget.find.mockResolvedValue(mockBudgets);

  // Properly mock `.select()` on the User model
  User.find.mockResolvedValue({
    select: jest.fn().mockReturnValue([mockUser]),
  });

  // Mocking axios for external API calls
  axios.get.mockResolvedValue({
    data: { rates: { USD: 1, EUR: 0.85 } },
  });

  token = "mockUserToken";
  adminToken = "mockAdminToken";
});

describe("ReportController", () => {
  //! Integration Testing
  it("should generate reports for admin", async () => {
    const response = await request(app)
      .get("/api/report/reports")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.report).toBeDefined();
  });

  it("should generate user budget for user", async () => {
    const response = await request(app)
      .get("/api/report/user-budget")
      .set("Authorization", `Bearer ${token}`)
      .query({ email: "testuser@example.com" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.budgetData).toBeDefined();
  });

  it("should return 400 when email is missing in user budget", async () => {
    const response = await request(app)
      .get("/api/report/user-budget")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Email is required.");
  });
  it("should generate user report for a valid user", async () => {
    const response = await request(app)
      .get("/api/report/user-reports")
      .set("Authorization", `Bearer ${token}`)
      .query({ email: "testuser@example.com" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.report).toBeDefined();
  });
});

describe("generateReports", () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      query: {
        currency: "USD", // Admin's preferred currency
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should generate reports when there are expenses and incomes", async () => {
    // Setup mock data
    const mockExpenses = [
      {
        amount: 100,
        currency: "USD",
        email: "testuser@example.com",
        category: "food",
        date: "2024-03-15T00:00:00.000Z",
      },
    ];

    const mockIncomes = [
      {
        amount: 2000,
        currency: "USD",
        email: "testuser@example.com",
        category: "salary",
        date: "2024-03-15T00:00:00.000Z",
      },
    ];

    // Mock the model find methods
    Expense.find.mockResolvedValue(mockExpenses);
    Income.find.mockResolvedValue(mockIncomes);
    axios.get.mockResolvedValue({ data: { rates: { USD: 1, EUR: 0.85 } } });

    // Call the controller
    await generateReports.generateReports(mockReq, mockRes);

    // Assertions
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        report: expect.any(Array),
        totalIncome: expect.any(String),
        totalExpense: expect.any(String),
        grandTotal: expect.any(String),
      })
    );
  });

  it("should return empty report if no expenses or incomes exist", async () => {
    // Setup mock data
    Expense.find.mockResolvedValue([]);
    Income.find.mockResolvedValue([]);
    axios.get.mockResolvedValue({ data: { rates: { USD: 1, EUR: 0.85 } } });

    // Call the controller
    await generateReports.generateReports(mockReq, mockRes);

    // Assertions
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      report: [],
    });
  });

  it("should handle the case when income/expense conversion is unsuccessful", async () => {
    // Setup mock data
    const mockExpenses = [
      {
        amount: 100,
        currency: "USD",
        email: "testuser@example.com",
        category: "food",
        date: "2024-03-15T00:00:00.000Z",
      },
    ];

    const mockIncomes = [
      {
        amount: 2000,
        currency: "USD",
        email: "testuser@example.com",
        category: "salary",
        date: "2024-03-15T00:00:00.000Z",
      },
    ];

    // Mock the model find methods
    Expense.find.mockResolvedValue(mockExpenses);
    Income.find.mockResolvedValue(mockIncomes);
    axios.get.mockResolvedValue({ data: { rates: { USD: 1, EUR: 0.85 } } });

    // Mock a failed conversion rate for a different currency
    axios.get.mockResolvedValueOnce({ data: { rates: { EUR: 0.85 } } });

    // Call the controller
    await generateReports.generateReports(mockReq, mockRes);

    // Assertions
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        report: expect.any(Array),
      })
    );
  });

  it("should handle missing data in the request", async () => {
    // Setup request with missing query parameter
    mockReq.query.currency = undefined;

    // Setup mock data
    const mockExpenses = [];
    const mockIncomes = [];

    // Mock the model find methods
    Expense.find.mockResolvedValue(mockExpenses);
    Income.find.mockResolvedValue(mockIncomes);
    axios.get.mockResolvedValue({ data: { rates: { USD: 1, EUR: 0.85 } } });

    // Call the controller
    await generateReports.generateReports(mockReq, mockRes);

    // Assertions
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      report: [],
    });
  });

  //! Unit Testing

  describe("generateUserBudgetController", () => {
    let mockReq, mockRes;

    beforeEach(() => {
      mockReq = {
        query: {
          email: "testuser@example.com",
          category: "food",
          month: "3",
          year: "2024",
          currency: "USD",
        },
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should generate user budget successfully", async () => {
      // Setup mock data
      const mockBudgets = [
        {
          category: "food",
          currency: "USD",
          budget: 500,
          remainingBudget: 200,
          startDate: new Date("2024-03-01"),
          endDate: new Date("2024-03-31"),
        },
      ];

      // Mock the model find method
      Budget.find.mockResolvedValue(mockBudgets);
      axios.get.mockResolvedValue({ data: { rates: { USD: 1 } } });

      // Call the controller
      await generateUserBudget.generateUserBudget(mockReq, mockRes);

      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        budgetData: [
          {
            category: "food",
            currency: "USD",
            budget: "500.00",
            remainingBudget: "200.00",
            totalSpent: "300.00",
            dateRange: "2024-03-01 - 2024-03-31",
          },
        ],
      });
    });

    it("should return 400 if email is missing", async () => {
      // Setup mock request with missing email
      mockReq.query.email = undefined;

      // Call the controller
      await generateUserBudget.generateUserBudget(mockReq, mockRes);

      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Email is required.",
      });
    });

    it("should return 200 with a message when no budgets found", async () => {
      // Setup mock data (empty budgets)
      Budget.find.mockResolvedValue([]);

      // Call the controller
      await generateUserBudget.generateUserBudget(mockReq, mockRes);

      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "No budgets found.",
      });
    });

    it("should handle missing month and year filter", async () => {
      // Setup mock data with missing month and year filter
      mockReq.query.month = undefined;
      mockReq.query.year = undefined;

      const mockBudgets = [
        {
          category: "food",
          currency: "USD",
          budget: 500,
          remainingBudget: 200,
          startDate: new Date("2024-03-01"),
          endDate: new Date("2024-03-31"),
        },
      ];

      // Mock the model find method
      Budget.find.mockResolvedValue(mockBudgets);
      axios.get.mockResolvedValue({ data: { rates: { USD: 1 } } });

      // Call the controller
      await generateUserBudget.generateUserBudget(mockReq, mockRes);

      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        budgetData: [
          {
            category: "food",
            currency: "USD",
            budget: "500.00",
            remainingBudget: "200.00",
            totalSpent: "300.00",
            dateRange: "2024-03-01 - 2024-03-31",
          },
        ],
      });
    });
  });

  describe("generateUserReportController", () => {
    let mockReq, mockRes;

    beforeEach(() => {
      mockReq = {
        query: {
          email: "testuser@example.com",
          type: "income",
          month: "3",
          year: "2024",
          currency: "USD",
        },
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should generate user report successfully", async () => {
      // Setup mock data
      const mockIncomes = [
        {
          amount: 1000,
          currency: "USD",
          category: "salary",
          date: new Date("2024-03-10"),
          isRecurring: true,
        },
      ];
      const mockExpenses = [
        {
          amount: 200,
          currency: "USD",
          category: "food",
          date: new Date("2024-03-05"),
          isRecurring: false,
        },
      ];

      // Mock the models
      Income.find.mockResolvedValue(mockIncomes);
      Expense.find.mockResolvedValue(mockExpenses);

      axios.get.mockResolvedValue({ data: { rates: { USD: 1 } } });

      // Call the controller
      await generateUserReport.generateUserReport(mockReq, mockRes);

      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        report: {
          totalIncome: "1000.00",
          totalExpense: "200.00",
          grandTotal: "800.00",
          incomeEntries: 1,
          expenseEntries: 1,
          highestIncome: {
            amount: 1000,
            category: "salary",
          },
          lowestIncome: {
            amount: 1000,
            category: "salary",
          },
          highestExpense: {
            amount: 200,
            category: "food",
          },
          lowestExpense: {
            amount: 200,
            category: "food",
          },
          recurringEntries: 1,
          transactions: [
            {
              type: "income",
              currency: "USD",
              amount: 1000,
              category: "salary",
              date: new Date("2024-03-10"),
            },
            {
              type: "expense",
              currency: "USD",
              amount: 200,
              category: "food",
              date: new Date("2024-03-05"),
            },
          ],
        },
      });
    });

    it("should return 400 if email is missing", async () => {
      // Setup mock request with missing email
      mockReq.query.email = undefined;

      // Call the controller
      await generateUserReport.generateUserReport(mockReq, mockRes);

      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Email is required.",
      });
    });

    it("should return 200 with zero totals when no transactions are found", async () => {
      // Setup mock data (empty arrays)
      Income.find.mockResolvedValue([]);
      Expense.find.mockResolvedValue([]);

      // Call the controller
      await generateUserReport.generateUserReport(mockReq, mockRes);

      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        report: {
          totalIncome: "0.00",
          totalExpense: "0.00",
          grandTotal: "0.00",
          incomeEntries: 0,
          expenseEntries: 0,
          highestIncome: null,
          lowestIncome: null,
          highestExpense: null,
          lowestExpense: null,
          recurringEntries: 0,
          transactions: [],
        },
      });
    });

    it("should return 200 with zero totals when filtering by month/year with no matching transactions", async () => {
      // Setup mock request with filters for month/year
      mockReq.query.month = "3";
      mockReq.query.year = "2024";

      // Setup mock data (no transactions for the given month)
      Income.find.mockResolvedValue([]);
      Expense.find.mockResolvedValue([]);

      // Call the controller
      await generateUserReport.generateUserReport(mockReq, mockRes);

      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        report: {
          totalIncome: "0.00",
          totalExpense: "0.00",
          grandTotal: "0.00",
          incomeEntries: 0,
          expenseEntries: 0,
          highestIncome: null,
          lowestIncome: null,
          highestExpense: null,
          lowestExpense: null,
          recurringEntries: 0,
          transactions: [],
        },
      });
    });

    it("should handle missing month/year filter gracefully", async () => {
      // Setup mock data
      const mockIncomes = [
        {
          amount: 1000,
          currency: "USD",
          category: "salary",
          date: new Date("2024-03-10"),
          isRecurring: true,
        },
      ];
      const mockExpenses = [
        {
          amount: 200,
          currency: "USD",
          category: "food",
          date: new Date("2024-03-05"),
          isRecurring: false,
        },
      ];

      // Mock the models
      Income.find.mockResolvedValue(mockIncomes);
      Expense.find.mockResolvedValue(mockExpenses);
      axios.get.mockResolvedValue({ data: { rates: { USD: 1 } } });

      // Call the controller with missing month/year filter
      mockReq.query.month = undefined;
      mockReq.query.year = undefined;

      // Call the controller
      await generateUserReport.generateUserReport(mockReq, mockRes);

      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        report: {
          totalIncome: "1000.00",
          totalExpense: "200.00",
          grandTotal: "800.00",
          incomeEntries: 1,
          expenseEntries: 1,
          highestIncome: {
            amount: 1000,
            category: "salary",
          },
          lowestIncome: {
            amount: 1000,
            category: "salary",
          },
          highestExpense: {
            amount: 200,
            category: "food",
          },
          lowestExpense: {
            amount: 200,
            category: "food",
          },
          recurringEntries: 1,
          transactions: [
            {
              type: "income",
              currency: "USD",
              amount: 1000,
              category: "salary",
              date: new Date("2024-03-10"),
            },
            {
              type: "expense",
              currency: "USD",
              amount: 200,
              category: "food",
              date: new Date("2024-03-05"),
            },
          ],
        },
      });
    });
  });

  describe("getAvailableDates Unit Tests", () => {
    beforeEach(() => {
      jest.clearAllMocks(); // Clear mocks before each test
    });

    // Test for success with no filters
    it("should return available dates without any filters", async () => {
      // Mocking database calls
      const mockExpenseDates = [
        "2024-03-15T00:00:00.000Z",
        "2024-03-20T00:00:00.000Z",
      ];
      const mockIncomeDates = [
        "2024-03-15T00:00:00.000Z",
        "2024-03-25T00:00:00.000Z",
      ];

      Expense.distinct.mockResolvedValue(mockExpenseDates);
      Income.distinct.mockResolvedValue(mockIncomeDates);

      const req = { query: {} }; // No filters
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await getAvailableDates.getAvailableDates(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        months: [3],
        years: [2024],
        days: [15, 20, 25],
      });
    });

    // Test for filtering by selected day
    it("should filter dates by selected day", async () => {
      const mockExpenseDates = [
        "2024-03-15T00:00:00.000Z",
        "2024-03-20T00:00:00.000Z",
      ];
      const mockIncomeDates = [
        "2024-03-15T00:00:00.000Z",
        "2024-03-25T00:00:00.000Z",
      ];

      Expense.distinct.mockResolvedValue(mockExpenseDates);
      Income.distinct.mockResolvedValue(mockIncomeDates);

      const req = { query: { selectedDay: "15" } }; // Filter by selected day
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await getAvailableDates.getAvailableDates(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        months: [3],
        years: [2024],
        days: [15],
      });
    });

    // Test for filtering by selected month
    it("should filter dates by selected month", async () => {
      const mockExpenseDates = [
        "2024-03-15T00:00:00.000Z",
        "2024-04-20T00:00:00.000Z",
      ];
      const mockIncomeDates = [
        "2024-03-15T00:00:00.000Z",
        "2024-03-25T00:00:00.000Z",
      ];

      Expense.distinct.mockResolvedValue(mockExpenseDates);
      Income.distinct.mockResolvedValue(mockIncomeDates);

      const req = { query: { selectedMonth: "3" } }; // Filter by selected month
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await getAvailableDates.getAvailableDates(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        months: [3],
        years: [2024],
        days: [15, 25],
      });
    });

    // Test for filtering by selected year
    it("should filter dates by selected year", async () => {
      const mockExpenseDates = [
        "2024-03-15T00:00:00.000Z",
        "2024-03-20T00:00:00.000Z",
      ];
      const mockIncomeDates = [
        "2024-03-15T00:00:00.000Z",
        "2024-03-25T00:00:00.000Z",
      ];

      Expense.distinct.mockResolvedValue(mockExpenseDates);
      Income.distinct.mockResolvedValue(mockIncomeDates);

      const req = { query: { selectedYear: "2024" } }; // Filter by selected year
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await getAvailableDates.getAvailableDates(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        months: [3],
        years: [2024],
        days: [15, 20, 25],
      });
    });

    // Test for error handling (mock error in database call)
    it("should handle errors gracefully", async () => {
      Expense.distinct.mockRejectedValue(new Error("Database error"));
      Income.distinct.mockRejectedValue(new Error("Database error"));

      const req = { query: {} }; // No filters
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await getAvailableDates.getAvailableDates(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal Server Error",
      });
    });
  });
});
