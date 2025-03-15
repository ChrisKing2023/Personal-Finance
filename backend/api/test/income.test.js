import request from "supertest";
import app from "../../app";
import Income from "../../api/models/income.model";
import Tag from "../models/tag.model";
import User from "../../api/models/user.model";
import axios from "axios";
import "dotenv/config";
import jwt from "jsonwebtoken";
import addIncome from "../controllers/income/addIncome";
import adminAllIncome from "../controllers/income/adminAllIncome";
import getAllIncome from "../controllers/income/allIncome";
import deleteIncome from "../controllers/income/deleteIncome";
import incomeController from "../controllers/income/totalIncomeForAdminCurrency";
import getTotalIncomeInPreferredCurrency from "../controllers/income/totalIncomeInPreferredCurrency";
import xss from "xss";
import logger from "../../utils/logger";

// Mock dependencies
jest.mock("../../api/models/income.model");
jest.mock("../models/tag.model.js");
jest.mock("xss", () => jest.fn(input => input));
jest.mock("../../utils/logger.js");
jest.mock("../../api/models/user.model");
jest.mock("axios");
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

const mockIncomes = [
  {
    _id: "incomeId1",
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

  Income.find.mockResolvedValue(mockIncomes);
  Income.findOne.mockResolvedValue(mockIncomes[0]);
  Income.findByIdAndDelete.mockResolvedValue(mockIncomes[0]);

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

describe("transactionController - Integration Testing", () => {
  it("should return all incomes for a valid user request", async () => {
    const response = await request(app)
      .get("/api/transaction/incomes")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.incomes).toHaveLength(1);
  });

  it("should return 403 if user tries to access income transactions as admin", async () => {
    const response = await request(app)
      .get("/api/transaction/income-transactions")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it("should return 400 if income amount is not positive", async () => {
    const response = await request(app)
      .post("/api/transaction/add-income")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Freelance Work",
        amount: -500,
        date: "2024-03-01",
        category: "Salary",
        currency: "USD",
        tags: ["freelance", "salary"],
        isRecurring: false,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Amount must be a Positive Number");
  });

  it("should return 400 if required fields are missing", async () => {
    const response = await request(app)
      .post("/api/transaction/add-income")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Freelance Work",
        amount: 1000,
        category: "Salary",
        currency: "USD",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Missing required fields");
  });

  it("should return 500 on internal server error", async () => {
    Income.find.mockImplementation(() => {
      throw new Error("Database error");
    });

    const response = await request(app)
      .get("/api/transaction/incomes")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Internal Server Error");
  });
});
describe("transactionController - Unit Testing", () => {
  describe("updateIncome - Integration Testing", () => {
    it("should return 404 if income not found or unauthorized", async () => {
      Income.findOne.mockResolvedValue(null); // Simulating not finding income

      const response = await request(app)
        .patch("/api/transaction/income/:id")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Updated Income",
          amount: 1500,
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Income not found or unauthorized");
    });

    it("should return 400 if invalid recurrence type is provided", async () => {
      const response = await request(app)
        .patch("/api/transaction/income/:id")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Updated Income",
          amount: 1500,
          isRecurring: true,
          recurrenceType: "invalid-recurrence",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid recurrence type");
    });

    it("should return 400 if amount is not a positive number", async () => {
      const response = await request(app)
        .patch("/api/transaction/income/:id")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Updated Income",
          amount: -1500,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Amount must be a valid positive number"
      );
    });
  });

  describe("getTotalIncomeInPreferredCurrency - Integration Testing", () => {
    it("should return 404 if user not found", async () => {
      User.findOne.mockResolvedValue(null); // Simulating no user found

      const response = await request(app)
        .get("/api/transaction/total-income")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User not found");
    });

    it("should return total income in user's preferred currency", async () => {
      const response = await request(app)
        .get("/api/transaction/total-income")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.totalIncome).toBe("1000.00"); // Assuming the mock user income is 1000 USD
      expect(response.body.currency).toBe("USD");
    });

    it("should return 200 with 0 income when no income records found", async () => {
      Income.find.mockResolvedValue([]); // Simulating no income records for the user

      const response = await request(app)
        .get("/api/transaction/total-income")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.totalIncome).toBe(0);
      expect(response.body.message).toBe("No income records found");
    });
  });

  describe("addIncome Controller", () => {
    let req, res;

    beforeEach(() => {
      jest.clearAllMocks();

      req = {
        user: { email: "testuser@example.com" },
        body: {
          title: "Freelance Work",
          amount: 1000,
          date: "2024-03-01",
          category: "Salary",
          description: "Freelance payment",
          currency: "USD",
          tags: ["freelance", "salary"],
          isRecurring: false,
        },
      };

      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Income.prototype.save = jest.fn().mockResolvedValue({
        ...req.body,
        _id: "mockIncomeId",
      });
    });

    it("should return 400 if required fields are missing", async () => {
      req.body = { title: "Freelance Work" }; // Missing required fields

      await addIncome.addIncome(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Missing required fields",
      });
    });

    it("should return 400 if amount is not a positive number", async () => {
      req.body.amount = -100;

      await addIncome.addIncome(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Amount must be a Positive Number",
      });
    });

    it("should return 400 for invalid recurrence type", async () => {
      req.body.isRecurring = true;
      req.body.recurrenceType = "invalid-type";

      await addIncome.addIncome(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid recurrence type",
      });
    });

    it("should return 500 on internal server error", async () => {
      Income.prototype.save.mockRejectedValue(new Error("DB Error"));

      await addIncome.addIncome(req, res);

      expect(logger.error).toHaveBeenCalledWith("DB Error");
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal Server Error",
      });
    });
  });

  describe("adminAllIncome Controller", () => {
    let req, res;

    beforeEach(() => {
      jest.clearAllMocks();

      req = { query: { currency: "USD" } };
      res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      Income.find.mockResolvedValue([
        {
          _id: "incomeId1",
          amount: 1000,
          currency: "USD",
          toObject: () => ({ _id: "incomeId1", amount: 1000, currency: "USD" }),
        },
      ]);

      axios.get.mockResolvedValue({ data: { rates: { USD: 1.0, EUR: 0.85 } } });
    });

    it("should return all incomes in admin's preferred currency", async () => {
      await adminAllIncome.getAllIncomeTransactions(req, res);

      expect(Income.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          transactions: expect.any(Array),
        })
      );
    });

    it("should return an empty array if no transactions are found", async () => {
      Income.find.mockResolvedValue([]);

      await adminAllIncome.getAllIncomeTransactions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        transactions: [],
      });
    });

    it("should return 500 on internal server error", async () => {
      Income.find.mockRejectedValue(new Error("DB Error"));

      await adminAllIncome.getAllIncomeTransactions(req, res);

      expect(logger.error).toHaveBeenCalledWith("DB Error");
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal Server Error",
      });
    });
  });

  describe("getAllIncome Controller", () => {
    let req, res;

    beforeEach(() => {
      jest.clearAllMocks();

      req = { user: { email: "testuser@example.com" } };
      res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      Income.find.mockResolvedValue([
        {
          _id: "incomeId1",
          title: "Freelance Work",
          amount: 1000,
          email: "testuser@example.com",
        },
      ]);
    });

    it("should return all incomes for the logged-in user", async () => {
      await getAllIncome.getAllIncomes(req, res);

      expect(Income.find).toHaveBeenCalledWith({
        email: "testuser@example.com",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, incomes: expect.any(Array) })
      );
    });

    it("should return 400 if user email is missing", async () => {
      req.user = null;

      await getAllIncome.getAllIncomes(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "User email is required",
      });
    });

    it("should return 500 on internal server error", async () => {
      Income.find.mockRejectedValue(new Error("DB Error"));

      await getAllIncome.getAllIncomes(req, res);

      expect(logger.error).toHaveBeenCalledWith("DB Error");
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Internal Server Error",
      });
    });
  });

  describe("deleteIncome Controller", () => {
    let mockReq, mockRes;

    beforeEach(() => {
      mockReq = {
        params: { id: "123" },
        user: { email: "test@example.com" },
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it("should return 400 if email is not provided", async () => {
      mockReq.user = {}; // Simulate no email
      await deleteIncome.deleteIncome(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "User email is required",
      });
    });

    it("should return 404 if income is not found", async () => {
      Income.findOne.mockResolvedValue(null);
      await deleteIncome.deleteIncome(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Income not found or unauthorized",
      });
    });

    it("should return 400 if income is recurring", async () => {
      const income = { isRecurring: true };
      Income.findOne.mockResolvedValue(income);
      await deleteIncome.deleteIncome(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message:
          "Cannot delete a recurring income. Please disable recurrence first.",
      });
    });

    it("should delete income and associated tags", async () => {
      const income = { isRecurring: false, _id: "123" };
      Income.findOne.mockResolvedValue(income);
      Tag.deleteMany.mockResolvedValue(true);
      Income.deleteOne.mockResolvedValue(true);

      await deleteIncome.deleteIncome(mockReq, mockRes);
      expect(Income.deleteOne).toHaveBeenCalledWith({
        _id: "123",
        email: "test@example.com",
      });
      expect(Tag.deleteMany).toHaveBeenCalledWith({ transactionId: "123" });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Income deleted successfully",
      });
    });

    it("should return 500 if an error occurs", async () => {
      const error = new Error("Database error");
      Income.findOne.mockRejectedValue(error);

      await deleteIncome.deleteIncome(mockReq, mockRes);
      expect(logger.error).toHaveBeenCalledWith(error.message);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Internal Server Error",
      });
    });
  });

  describe("getTotalIncomeForAdmin Controller", () => {
    let mockReq, mockRes;

    beforeEach(() => {
      mockReq = {
        user: { email: "admin@example.com" },
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it("should return 404 if admin is not found", async () => {
      User.findOne.mockResolvedValue(null);
      await incomeController.getTotalIncomeForAdmin(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Admin user not found",
      });
    });

    it("should return 200 with total income when incomes exist", async () => {
      const admin = { currency: "USD" };
      User.findOne.mockResolvedValue(admin);

      const incomes = [{ amount: 100, currency: "USD" }];
      Income.find.mockResolvedValue(incomes);

      await incomeController.getTotalIncomeForAdmin(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        totalIncome: "100.00",
        currency: "USD",
      });
    });

    it("should fetch exchange rates and convert income", async () => {
      const admin = { currency: "USD" };
      User.findOne.mockResolvedValue(admin);

      const incomes = [{ amount: 100, currency: "EUR" }];
      Income.find.mockResolvedValue(incomes);

      axios.get.mockResolvedValue({ data: { rates: { USD: 1.2 } } });

      await incomeController.getTotalIncomeForAdmin(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        totalIncome: "120.00",
        currency: "USD",
      });
    });

    it("should return 500 if fetching exchange rate fails", async () => {
      const admin = { currency: "USD" };
      User.findOne.mockResolvedValue(admin);

      const incomes = [{ amount: 100, currency: "EUR" }];
      Income.find.mockResolvedValue(incomes);

      axios.get.mockRejectedValue(new Error("API error"));

      await incomeController.getTotalIncomeForAdmin(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Error fetching exchange rate for EUR",
      });
    });
  });
  describe("getTotalIncomeInPreferredCurrency Controller", () => {
    let mockReq, mockRes;

    beforeEach(() => {
      mockReq = {
        user: { email: "test@example.com" },
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it("should return 400 if email is not provided", async () => {
      mockReq.user = {}; // Simulate no email
      await getTotalIncomeInPreferredCurrency.getTotalIncomeInPreferredCurrency(
        mockReq,
        mockRes
      );
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "User email is required",
      });
    });

    it("should return 404 if user is not found", async () => {
      User.findOne.mockResolvedValue(null);
      await getTotalIncomeInPreferredCurrency.getTotalIncomeInPreferredCurrency(
        mockReq,
        mockRes
      );
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("should return 200 with total income when incomes exist", async () => {
      const user = { currency: "USD" };
      User.findOne.mockResolvedValue(user);

      const incomes = [{ amount: 100, currency: "USD" }];
      Income.find.mockResolvedValue(incomes);

      await getTotalIncomeInPreferredCurrency.getTotalIncomeInPreferredCurrency(
        mockReq,
        mockRes
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        totalIncome: "100.00",
        currency: "USD",
      });
    });

    it("should fetch exchange rates and convert income", async () => {
      const user = { currency: "USD" };
      User.findOne.mockResolvedValue(user);

      const incomes = [{ amount: 100, currency: "EUR" }];
      Income.find.mockResolvedValue(incomes);

      axios.get.mockResolvedValue({ data: { rates: { USD: 1.2 } } });

      await getTotalIncomeInPreferredCurrency.getTotalIncomeInPreferredCurrency(
        mockReq,
        mockRes
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        totalIncome: "120.00",
        currency: "USD",
      });
    });

    it("should return 500 if fetching exchange rate fails", async () => {
      const user = { currency: "USD" };
      User.findOne.mockResolvedValue(user);

      const incomes = [{ amount: 100, currency: "EUR" }];
      Income.find.mockResolvedValue(incomes);

      axios.get.mockRejectedValue(new Error("API error"));

      await getTotalIncomeInPreferredCurrency.getTotalIncomeInPreferredCurrency(
        mockReq,
        mockRes
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Error fetching exchange rate for EUR",
      });
    });
  });
});
