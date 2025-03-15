import request from "supertest";
import app from "../../app";
import Category from "../../api/models/category.model";
import User from "../../api/models/user.model";
import "dotenv/config";
import jwt from "jsonwebtoken";
import xss from "xss";
import categoryController from "../controllers/category.controller.js";

// Mock dependencies
jest.mock("../../api/models/category.model");
jest.mock("../../api/models/user.model");
jest.mock("bcrypt", () => ({
  compare: jest.fn(),
}));
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));
jest.mock("xss", () => jest.fn(val => val));

const mockCategories = [
  { _id: "categoryId1", value: "salary", label: "Salary", type: "income" },
  { _id: "categoryId2", value: "food", label: "Food", type: "expense" },
];

const mockAdmin = {
  _id: "mockAdminId",
  username: "adminuser",
  email: "adminuser@example.com",
  password: "hashedPassword",
  role: "admin",
};

const mockUser = {
  _id: "mockUserId",
  username: "testuser",
  email: "testuser@example.com",
  password: "hashedPassword",
  role: "user",
};

let token;
let nonAdminToken;

beforeEach(() => {
  jest.clearAllMocks();

  User.findById.mockImplementation(id => {
    return {
      select: jest
        .fn()
        .mockResolvedValue(id === "mockAdminId" ? mockAdmin : mockUser),
    };
  });

  Category.find.mockResolvedValue(mockCategories);
  jwt.verify.mockReturnValue({ _id: "mockAdminId", role: "admin" });

  token = jwt.sign(
    { _id: "mockAdminId", role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
  nonAdminToken = jwt.sign(
    { _id: "mockUserId", role: "user" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
});

describe("CategoryController - Manage Categories (Integration Testing)", () => {
  it("should return all categories for a valid request", async () => {
    const response = await request(app)
      .get("/api/category")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].value).toBe("salary");
  });

  it("should return 201 when an admin adds a new category", async () => {
    const newCategory = { value: "rent", label: "Rent", type: "expense" };
    Category.findOne.mockResolvedValue(null);
    Category.mockImplementation(data => ({
      ...data,
      _id: "newCategoryId",
      save: jest.fn().mockResolvedValue(data),
    }));

    const response = await request(app)
      .post("/api/category/add")
      .set("Authorization", `Bearer ${token}`)
      .send(newCategory);

    expect(response.status).toBe(201);
    expect(response.body.value).toBe("rent");
  });

  it("should return 403 when a non-admin tries to add a category", async () => {
    const newCategory = {
      value: "transport",
      label: "Transport",
      type: "expense",
    };
    jwt.verify.mockReturnValue({ _id: "mockUserId", role: "user" });

    const response = await request(app)
      .post("/api/category/add")
      .set("Authorization", `Bearer ${nonAdminToken}`)
      .send(newCategory);

    expect(response.status).toBe(403);
  });

  it("should return 200 when an admin updates a category", async () => {
    const updatedCategory = {
      value: "groceries",
      label: "Groceries",
      type: "expense",
    };
    Category.findByIdAndUpdate.mockResolvedValue({
      ...mockCategories[1],
      ...updatedCategory,
    });

    const response = await request(app)
      .put("/api/category/edit/categoryId2")
      .set("Authorization", `Bearer ${token}`)
      .send(updatedCategory);

    expect(response.status).toBe(200);
    expect(response.body.updatedCategory.value).toBe("groceries");
  });

  it("should return 200 when an admin deletes a category", async () => {
    Category.findByIdAndDelete.mockResolvedValue(mockCategories[0]);

    const response = await request(app)
      .delete("/api/category/delete/categoryId1")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it("should return 403 when a non-admin tries to delete a category", async () => {
    jwt.verify.mockReturnValue({ _id: "mockUserId", role: "user" });

    const response = await request(app)
      .delete("/api/category/delete/categoryId1")
      .set("Authorization", `Bearer ${nonAdminToken}`);

    expect(response.status).toBe(403);
  });

  it("should return income categories", async () => {
    const response = await request(app)
      .get("/api/category/income")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body[0].type).toBe("income");
  });

  it("should return expense categories", async () => {
    const response = await request(app)
      .get("/api/category/expense")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body[1].type).toBe("expense");
  });

  it("should return 400 if required fields are missing when creating a category", async () => {
    const invalidCategory = { label: "Utilities", type: "expense" }; // Missing value
    const response = await request(app)
      .post("/api/category/add")
      .set("Authorization", `Bearer ${token}`)
      .send(invalidCategory);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("All fields are required");
  });

  it("should return 400 if required fields are missing when updating a category", async () => {
    const updatedCategory = { label: "Updated Label" }; // Missing value and type
    const response = await request(app)
      .put("/api/category/edit/categoryId2")
      .set("Authorization", `Bearer ${token}`)
      .send(updatedCategory);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("All fields are required");
  });
});

describe("Category Controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getCategories", () => {
    it("should return all categories", async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockCategories = [
        { value: "salary", label: "Salary", type: "income" },
      ];
      Category.find.mockResolvedValue(mockCategories);

      await categoryController.getCategories(req, res);

      expect(Category.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockCategories);
    });

    it("should return 500 on database error", async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      Category.find.mockRejectedValue(new Error("Database error"));

      await categoryController.getCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error retrieving categories",
        error: expect.any(Error),
      });
    });
  });

  describe("getIncomes", () => {
    it("should return all income categories", async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockIncomeCategories = [
        { value: "salary", label: "Salary", type: "income" },
      ];
      Category.find.mockResolvedValue(mockIncomeCategories);

      await categoryController.getIncomes(req, res);

      expect(Category.find).toHaveBeenCalledWith({ type: "income" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockIncomeCategories);
    });
  });

  describe("getExpenses", () => {
    it("should return all expense categories", async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockExpenseCategories = [
        { value: "food", label: "Food", type: "expense" },
      ];
      Category.find.mockResolvedValue(mockExpenseCategories);

      await categoryController.getExpenses(req, res);

      expect(Category.find).toHaveBeenCalledWith({ type: "expense" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockExpenseCategories);
    });
  });
  describe("Category - Unit Test", () => {
    describe("createCategory", () => {
      it("should return 400 if fields are missing", async () => {
        const req = { body: { value: "rent", label: "Rent" } }; // Missing type
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        await categoryController.createCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: "All fields are required",
        });
      });

      it("should return 500 on database error", async () => {
        const req = { body: { value: "rent", label: "Rent", type: "expense" } };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        Category.mockImplementation(() => ({
          save: jest.fn().mockRejectedValue(new Error("Database error")),
        }));

        await categoryController.createCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          message: "Error creating category",
          error: expect.any(Error),
        });
      });
    });

    describe("updateCategory", () => {
      it("should update and return the updated category", async () => {
        const req = {
          params: { id: "123" },
          body: { value: "rent", label: "Rent", type: "expense" },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        const updatedCategory = { _id: "123", ...req.body };
        Category.findByIdAndUpdate.mockResolvedValue(updatedCategory);

        await categoryController.updateCategory(req, res);

        expect(Category.findByIdAndUpdate).toHaveBeenCalledWith(
          "123",
          req.body,
          {
            new: true,
          }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          message: "Category updated successfully",
          updatedCategory,
        });
      });

      it("should return 404 if category is not found", async () => {
        const req = {
          params: { id: "123" },
          body: { value: "rent", label: "Rent", type: "expense" },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        Category.findByIdAndUpdate.mockResolvedValue(null);

        await categoryController.updateCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          message: "Category not found",
        });
      });
    });

    describe("deleteCategory", () => {
      it("should delete a category and return success message", async () => {
        const req = { params: { id: "123" } };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        Category.findByIdAndDelete.mockResolvedValue({
          _id: "123",
          value: "rent",
        });

        await categoryController.deleteCategory(req, res);

        expect(Category.findByIdAndDelete).toHaveBeenCalledWith("123");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          message: "Category deleted successfully",
        });
      });

      it("should return 404 if category is not found", async () => {
        const req = { params: { id: "123" } };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        Category.findByIdAndDelete.mockResolvedValue(null);

        await categoryController.deleteCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          message: "Category not found",
        });
      });
    });
  });
});
