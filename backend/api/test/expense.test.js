import request from "supertest";
import app from "../../app";
import Expense from "../../api/models/expense.model";
import User from "../../api/models/user.model";
import Tag from "../models/tag.model";
import TotalSavings from "../models/totalSavings.model";
import Budget from "../models/budget.model";
import axios from "axios";
import "dotenv/config";
import jwt from "jsonwebtoken";
import addExpense from "../controllers/expense/addExpense";
import deleteExpense from "../controllers/expense/deleteExpense";
import totalExpenseForAdmin from "../controllers/expense/totalExpenseForAdmin";

// Mock dependencies
jest.mock("../../api/models/expense.model");
jest.mock("../models/tag.model");
jest.mock("../models/totalSavings.model");
jest.mock("../models/budget.model");
jest.mock("../../api/models/user.model");
jest.mock("axios");
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

const mockExpenses = [
  {
    _id: "expenseId1",
    email: "testuser@example.com",
    title: "Freelance Work",
    amount: 1000,
    date: "2024-03-01T00:00:00.000Z",
    category: "Salary",
    currency: "USD",
    tags: ["freelance", "salary"],
    isRecurring: false,
    nextOccurrence: null,
  },
];

const mockUser = {
  _id: "mockUserId",
  username: "testuser",
  email: "testuser@example.com",
  role: "user",
  currency: "USD",
};

const mockAdmin = {
  _id: "mockAdminId",
  username: "adminuser",
  email: "adminuser@example.com",
  role: "admin",
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

  Expense.find.mockResolvedValue(mockExpenses);
  Expense.findOne.mockResolvedValue(mockExpenses[0]);
  Expense.findByIdAndDelete.mockResolvedValue(mockExpenses[0]);

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
    return Promise.resolve({
      data: { rates: { USD: 1.0, EUR: 0.85 } },
    });
  });

  token = "mockUserToken";
  adminToken = "mockAdminToken";
});

describe("transactionController - Expenses Integration Testing", () => {
  it("should return all expenses for a valid user request", async () => {
    const response = await request(app)
      .get("/api/transaction/expenses")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.expenses).toHaveLength(1);
  });

  it("should return 403 if user tries to access expense transactions as admin", async () => {
    const response = await request(app)
      .get("/api/transaction/expense-transactions")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it("should return 500 on internal server error", async () => {
    Expense.find.mockImplementation(() => {
      throw new Error("Database error");
    });

    const response = await request(app)
      .get("/api/transaction/expenses")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Internal Server Error");
  });

  it("should return 404 if expense not found or unauthorized", async () => {
    Expense.findOne.mockResolvedValue(null);

    const response = await request(app)
      .patch("/api/transaction/expense/:id")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Updated Expense",
        amount: 1500,
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Expense not found or unauthorized");
  });
  it("should return 404 if user not found", async () => {
    User.findOne.mockResolvedValue(null); // Simulating no user found

    const response = await request(app)
      .get("/api/transaction/total-expense")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User not found");
  });

  it("should return total expense in user's preferred currency", async () => {
    const response = await request(app)
      .get("/api/transaction/total-expense")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.totalExpense).toBe("1000.00"); // Assuming the mock user expense is 1000 USD
    expect(response.body.currency).toBe("USD");
  });

  it("should return 200 with 0 expense when no expense records found", async () => {
    Expense.find.mockResolvedValue([]); // Simulating no expense records for the user

    const response = await request(app)
      .get("/api/transaction/total-expense")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.totalExpense).toBe(0);
    expect(response.body.message).toBe("No expense records found");
  });
});

describe("transactionController - Expenses - Unit Testing", () => {
  describe("addExpense Controller", () => {
    it("should fail if required fields are missing", async () => {
      const mockRequest = {
        body: {
          title: "",
          amount: 100,
          date: "2025-03-11",
          category: "Food",
          currency: "USD",
        },
        user: { email: "testuser@example.com" },
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await addExpense.addExpense(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Missing required fields",
      });
    });
    it("should return 404 if expense not found or unauthorized", async () => {
      Expense.findOne.mockResolvedValue(null);

      const response = await request(app)
        .patch("/api/transaction/expense/:id")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Updated Expense",
          amount: 1500,
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Expense not found or unauthorized");
    });
  });

  describe("deleteExpense", () => {
    let mockRequest;
    let mockResponse;
    let mockExpense;

    beforeEach(() => {
      mockRequest = {
        params: { id: "mockExpenseId" },
        user: { email: "testuser@example.com" },
      };

      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      mockExpense = {
        _id: "mockExpenseId",
        email: "testuser@example.com",
        amount: 100,
        currency: "USD",
        category: "Food",
        isRecurring: false,
        date: new Date(),
      };
    });

    it("should delete an expense successfully", async () => {
      Expense.findOne.mockResolvedValue(mockExpense);
      Budget.find.mockResolvedValue([]);
      TotalSavings.findOne.mockResolvedValue(null);
      Tag.deleteMany.mockResolvedValue(true);
      Expense.deleteOne.mockResolvedValue(true);

      await deleteExpense.deleteExpense(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Expense deleted successfully",
      });
    });

    it("should return 404 if expense not found", async () => {
      Expense.findOne.mockResolvedValue(null);

      await deleteExpense.deleteExpense(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Expense not found or unauthorized",
      });
    });

    it("should return 500 if there is an internal error", async () => {
      Expense.findOne.mockRejectedValue(new Error("Database error"));

      await deleteExpense.deleteExpense(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Internal Server Error",
      });
    });
  });

  describe("totalExpenseForAdmin", () => {
    let mockRequest;
    let mockResponse;

    beforeEach(() => {
      mockRequest = {
        user: { email: "admin@example.com" },
      };

      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it("should return total expenses converted to admin's preferred currency", async () => {
      const mockAdmin = { email: "admin@example.com", currency: "USD" };
      const mockExpenses = [
        { amount: 100, currency: "USD" },
        { amount: 85, currency: "EUR" },
      ];

      User.findOne.mockResolvedValue(mockAdmin);
      Expense.find.mockResolvedValue(mockExpenses);
      axios.get.mockResolvedValue({ data: { rates: { USD: 1.2 } } });

      await totalExpenseForAdmin.getTotalExpenseForAdmin(
        mockRequest,
        mockResponse
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        totalExpense: "202.00",
        currency: "USD",
      });
    });

    it("should return 404 if admin user not found", async () => {
      User.findOne.mockResolvedValue(null);

      await totalExpenseForAdmin.getTotalExpenseForAdmin(
        mockRequest,
        mockResponse
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Admin user not found",
      });
    });

    it("should return 500 if there is an error fetching expenses", async () => {
      User.findOne.mockResolvedValue({
        email: "admin@example.com",
        currency: "USD",
      });
      Expense.find.mockRejectedValue(new Error("Database error"));

      await totalExpenseForAdmin.getTotalExpenseForAdmin(
        mockRequest,
        mockResponse
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Internal Server Error",
      });
    });

    it("should return 400 if exchange rate is not available", async () => {
      const mockAdmin = { email: "admin@example.com", currency: "USD" };
      const mockExpenses = [{ amount: 100, currency: "EUR" }];
      User.findOne.mockResolvedValue(mockAdmin);
      Expense.find.mockResolvedValue(mockExpenses);
      axios.get.mockResolvedValue({ data: { rates: {} } });

      await totalExpenseForAdmin.getTotalExpenseForAdmin(
        mockRequest,
        mockResponse
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Exchange rate for EUR to USD not available",
      });
    });
  });
});
