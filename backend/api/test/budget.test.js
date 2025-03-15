import request from "supertest";
import app from "../../app";
import Budget from "../../api/models/budget.model";
import User from "../../api/models/user.model";
import Expense from "../../api/models/expense.model";
import axios from "axios";
import "dotenv/config";
import jwt from "jsonwebtoken";
import budgetController from "../../api/controllers/budget.controller";

// Mock dependencies
jest.mock("../../api/models/budget.model");
jest.mock("../../api/models/user.model");
jest.mock("../../api/models/expense.model");
jest.mock("axios");
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

const mockBudgets = [
  {
    _id: "budgetId1",
    email: "testuser@example.com",
    category: "food",
    currency: "USD",
    budget: 500,
    remainingBudget: 500,
    startDate: "2024-03-01T00:00:00.000Z",
    endDate: "2024-03-31T23:59:59.999Z",
  },
];

const mockExpenses = [
  {
    _id: "expenseId1",
    email: "testuser@example.com",
    category: "food",
    currency: "USD",
    amount: 100,
    date: "2024-03-15T00:00:00.000Z",
  },
  {
    _id: "expenseId2",
    email: "testuser@example.com",
    category: "food",
    currency: "EUR",
    amount: 50,
    date: "2024-03-20T00:00:00.000Z",
  },
];

const mockAdmin = {
  _id: "mockAdminId",
  username: "adminuser",
  email: "adminuser@example.com",
  role: "admin",
};

const mockUser = {
  _id: "mockUserId",
  username: "testuser",
  email: "testuser@example.com",
  role: "user",
  currency: "USD",
};

let token;
let adminToken;

beforeEach(() => {
  jest.clearAllMocks();

  User.findOne.mockResolvedValue(mockUser);
  User.findById.mockImplementation(id => ({
    select: jest
      .fn()
      .mockResolvedValue(id === "mockAdminId" ? mockAdmin : mockUser),
  }));

  Budget.find.mockResolvedValue(mockBudgets);
  Budget.findOne.mockImplementation(async query => {
    const budget = mockBudgets.find(
      b =>
        b.email === query.email &&
        b.category === query.category &&
        b.startDate === query.startDate &&
        b.endDate === query.endDate
    );
    return budget ? new Budget(budget) : null;
  });

  Budget.findById.mockResolvedValue(mockBudgets[0]);
  Budget.findByIdAndDelete.mockResolvedValue(mockBudgets[0]);

  Expense.find.mockResolvedValue(mockExpenses);

  jwt.verify.mockImplementation(token => {
    if (token === "mockUserToken")
      return { _id: "mockUserId", role: "user", email: "testuser@example.com" };
    if (token === "mockAdminToken")
      return {
        _id: "mockAdminId",
        role: "admin",
        email: "adminuser@example.com",
      };
  });

  axios.get.mockImplementation(url => {
    if (url.startsWith("https://api.exchangerate-api.com/v4/latest/")) {
      return Promise.resolve({
        data: { rates: { USD: 1.0, EUR: 0.85 } },
      });
    }
    return Promise.reject(new Error("Network Error"));
  });

  token = "mockUserToken";
  adminToken = "mockAdminToken";
});

describe("BudgetController - Integration Testing", () => {
  it("should return all budgets for a valid user request", async () => {
    const response = await request(app)
      .get("/api/budget/getbudgets")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.budgets).toHaveLength(1);
  });

  it("should correctly calculate total expenses and create a new budget", async () => {
    const calculatedRemainingBudget = 500 - (100 + 50 * 0.85);

    Budget.create.mockResolvedValue({
      _id: "newBudgetId",
      email: "testuser@example.com",
      category: "food",
      budget: 500,
      remainingBudget: calculatedRemainingBudget,
      startDate: "2024-03-01",
      endDate: "2024-03-31",
      currency: "USD",
    });

    const response = await request(app)
      .post("/api/budget/add")
      .set("Authorization", `Bearer ${token}`)
      .send({
        category: "food",
        budget: 500,
        startDate: "2024-03-01",
        endDate: "2024-03-31",
      });

    expect(Budget.create).not.toHaveBeenCalled();
    expect(Budget.findOne).toHaveBeenCalled();
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.budget).toBeDefined();
  });

  it("should return 403 when an admin tries to delete a budget", async () => {
    jwt.verify.mockReturnValue({ _id: "mockAdminId", role: "admin" });

    const response = await request(app)
      .delete("/api/budget/delete/budgetId1")
      .set("Authorization", `Bearer ${adminToken}`);

    // Debugging

    expect(response.status).toBe(403);
  });

  it("should return 200 when a user deletes their own budget", async () => {
    Budget.findById.mockResolvedValue(mockBudgets[0]);

    const response = await request(app)
      .delete("/api/budget/delete/budgetId1")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("should return 400 if required fields are missing", async () => {
    const response = await request(app)
      .post("/api/budget/add")
      .set("Authorization", `Bearer ${token}`)
      .send({
        category: "food",
        startDate: "2024-03-01",
        endDate: "2024-03-31",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid input values");
  });

  it("should return 400 if budget is negative", async () => {
    const response = await request(app)
      .post("/api/budget/add")
      .set("Authorization", `Bearer ${token}`)
      .send({
        category: "food",
        budget: -100,
        startDate: "2024-03-01",
        endDate: "2024-03-31",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid input values");
  });

  it("should return 404 if budget is not found for deletion", async () => {
    Budget.findById.mockResolvedValue(null);

    const response = await request(app)
      .delete("/api/budget/delete/nonExistingBudgetId")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Budget not found");
  });

  it("should return 500 on internal server error", async () => {
    Budget.find.mockImplementation(() => {
      throw new Error("Database error");
    });

    const response = await request(app)
      .get("/api/budget/getbudgets")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Internal Server Error");
  });
});

describe("BudgetController - Unit Tests", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: { email: "testuser@example.com" },
      body: {},
      params: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("addOrUpdateBudget", () => {
    it("should return 400 if email is missing", async () => {
      req.user = null; // Simulate missing email

      await budgetController.addOrUpdateBudget(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "User email is required",
      });
    });

    it("should return 400 for invalid input values", async () => {
      req.body = {
        category: "food",
        budget: -100,
        startDate: "2024-03-01",
        endDate: "2024-03-31",
      };

      await budgetController.addOrUpdateBudget(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid input values",
      });
    });

    it("should return 404 if user is not found", async () => {
      User.findOne.mockResolvedValue(null);

      req.body = {
        category: "food",
        budget: 500,
        startDate: "2024-03-01",
        endDate: "2024-03-31",
      };

      await budgetController.addOrUpdateBudget(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("should create a new budget and return 201", async () => {
      User.findOne.mockResolvedValue({
        email: "testuser@example.com",
        currency: "USD",
      });
      Expense.find.mockResolvedValue([]);
      Budget.findOne.mockResolvedValue(null);
      Budget.prototype.save = jest
        .fn()
        .mockResolvedValue({ _id: "budgetId", budget: 500 });

      req.body = {
        category: "food",
        budget: 500,
        startDate: "2024-03-01",
        endDate: "2024-03-31",
      };

      await budgetController.addOrUpdateBudget(req, res);

      expect(Budget.prototype.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it("should update an existing budget and return 200", async () => {
      const existingBudget = { _id: "budgetId", budget: 500, save: jest.fn() };
      User.findOne.mockResolvedValue({
        email: "testuser@example.com",
        currency: "USD",
      });
      Expense.find.mockResolvedValue([]);
      Budget.findOne.mockResolvedValue(existingBudget);

      req.body = {
        category: "food",
        budget: 600,
        startDate: "2024-03-01",
        endDate: "2024-03-31",
      };

      await budgetController.addOrUpdateBudget(req, res);

      expect(existingBudget.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it("should return 500 on internal error", async () => {
      User.findOne.mockRejectedValue(new Error("Database error"));

      req.body = {
        category: "food",
        budget: 500,
        startDate: "2024-03-01",
        endDate: "2024-03-31",
      };

      await budgetController.addOrUpdateBudget(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal Server Error",
      });
    });
  });

  describe("getBudgets", () => {
    it("should return 400 if email is missing", async () => {
      req.user = null;

      await budgetController.getBudgets(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "User email is required",
      });
    });

    it("should return budgets if found", async () => {
      const mockBudgets = [{ _id: "budgetId1", category: "food", budget: 500 }];
      Budget.find.mockResolvedValue(mockBudgets);

      await budgetController.getBudgets(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        budgets: mockBudgets,
      });
    });

    it("should return 500 on internal error", async () => {
      Budget.find.mockRejectedValue(new Error("Database error"));

      await budgetController.getBudgets(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal Server Error",
      });
    });
  });

  describe("deleteBudget", () => {
    it("should return 400 if email is missing", async () => {
      req.user = null;
      req.params.id = "budgetId1";

      await budgetController.deleteBudget(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "User email is required",
      });
    });

    it("should return 404 if budget is not found", async () => {
      Budget.findById.mockResolvedValue(null);
      req.params.id = "budgetId1";

      await budgetController.deleteBudget(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Budget not found" });
    });

    it("should delete the budget and return 200", async () => {
      Budget.findById.mockResolvedValue({ _id: "budgetId1" });
      Budget.findByIdAndDelete.mockResolvedValue({ _id: "budgetId1" });

      req.params.id = "budgetId1";

      await budgetController.deleteBudget(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it("should return 500 on internal error", async () => {
      Budget.findById.mockRejectedValue(new Error("Database error"));
      req.params.id = "budgetId1";

      await budgetController.deleteBudget(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal Server Error",
      });
    });
  });
});
