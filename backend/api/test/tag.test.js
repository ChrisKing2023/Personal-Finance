import request from "supertest";
import app from "../../app";
import Tag from "../../api/models/tag.model";
import User from "../../api/models/user.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  getAllTags,
  addTags,
  removeTags,
} from "../../api/controllers/tag.controller";
import logger from "../../utils/logger";

// Mock dependencies
jest.mock("../../api/models/tag.model");
jest.mock("../../api/models/user.model");
jest.mock("bcrypt", () => ({
  compare: jest.fn(),
}));
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn().mockReturnValue({ _id: "mockUserId", role: "user" }),
}));
jest.mock("../../utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const mockTags = [
  {
    _id: "tagId1",
    name: "Food",
    transactionId: "transactionId1",
    transactionType: "Expense",
  },
  {
    _id: "tagId2",
    name: "Salary",
    transactionId: "transactionId2",
    transactionType: "Income",
  },
];

const mockUser = {
  _id: "mockUserId",
  username: "testuser",
  email: "testuser@example.com",
  password: "hashedPassword",
  role: "user",
  select: jest.fn().mockReturnValue({ ...mockUser, password: undefined }), // Mock select to exclude password
};

// Initialize token variable
let token;

// Clear mocks and set up the mocks before each test
beforeEach(() => {
  jest.clearAllMocks();

  // Mock User.findById to return a mock user
  User.findById.mockResolvedValue(mockUser);

  // Mocking Tag.find() to return mockTags
  Tag.find.mockResolvedValue(mockTags);
});

describe("TagController - Test Cases", () => {
  //! Integration Testing
  it("should return 200 and a token for valid login", async () => {
    const mockToken = "mockedToken.mockedPayload.mockedSignature";

    // Mock database call
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue(mockToken);

    const response = await request(app).post("/api/auth/login").send({
      username: "testuser@example.com",
      password: "password123",
    });

    // Store the token for later use
    token = response.body.token;

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBe(mockToken);
  });

  it("should return 200 and all tags for valid request", async () => {
    // Ensure that the token is set
    if (!token) {
      return;
    }

    // Mock JWT verification to return a valid decoded user
    jwt.verify.mockReturnValue({ _id: "mockUserId", role: "user" });

    // Mock user retrieval with `.select()` support
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "mockUserId",
        username: "testuser",
        email: "testuser@example.com",
        role: "user",
      }),
    });

    const response = await request(app)
      .get("/api/tags")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.tags).toHaveLength(2);
    expect(response.body.tags[0].name).toBe("Food");
    expect(response.body.tags[1].name).toBe("Salary");
  });

  it("should return 401 if no token is provided", async () => {
    const response = await request(app).get("/api/tags");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe(
      "Unauthorized: Missing or invalid token"
    );
  });

  it("should return 500 if database fails", async () => {
    Tag.find.mockRejectedValue(new Error("Database error"));

    const response = await request(app)
      .get("/api/tags")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Internal Server Error");
  });

  describe("getAllTags", () => {
    it("should return 200 and all tags when tags are found", async () => {
      const mockTags = [
        { _id: "tagId1", name: "Food" },
        { _id: "tagId2", name: "Salary" },
      ];

      // Mock the database query
      Tag.find.mockResolvedValue(mockTags);

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getAllTags({}, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        tags: mockTags,
      });
    });

    it("should return 200 and an empty list when no tags are found", async () => {
      Tag.find.mockResolvedValue([]);

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getAllTags({}, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, tags: [] });
      expect(logger.info).toHaveBeenCalledWith("No tags found in the database");
    });

    it("should return 500 if an error occurs while fetching tags", async () => {
      Tag.find.mockRejectedValue(new Error("Database error"));

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getAllTags({}, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Internal Server Error",
        error: "Database error",
      });
      expect(logger.error).toHaveBeenCalledWith(
        "Error fetching tags: Database error"
      );
    });
  });

  //! Unit Testing

  describe("addTags", () => {
    it("should add tags successfully when provided with valid tags", async () => {
      const transactionId = "transactionId1";
      const transactionType = "Income";
      const tags = ["Food", "Salary"];

      Tag.insertMany.mockResolvedValue(tags);

      await addTags(transactionId, transactionType, tags);

      expect(Tag.insertMany).toHaveBeenCalledWith([
        { name: "Food", transactionId, transactionType },
        { name: "Salary", transactionId, transactionType },
      ]);
      expect(logger.info).toHaveBeenCalledWith(
        "2 tags successfully added to the database"
      );
    });

    it("should not add tags if the tags are not in an array format", async () => {
      const transactionId = "transactionId1";
      const transactionType = "Expense";
      const tags = "Food";

      await addTags(transactionId, transactionType, tags);

      expect(Tag.insertMany).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        "Tags provided are not in array format"
      );
    });

    it("should handle errors while adding tags", async () => {
      const transactionId = "transactionId1";
      const transactionType = "Expense";
      const tags = ["Food", "Salary"];

      Tag.insertMany.mockRejectedValue(new Error("Database error"));

      await addTags(transactionId, transactionType, tags);

      expect(logger.error).toHaveBeenCalledWith(
        "Error adding tags for transaction transactionId1: Database error"
      );
    });
  });

  describe("removeTags", () => {
    it("should remove tags successfully for a transaction", async () => {
      const transactionId = "transactionId1";
      const result = { deletedCount: 2 };

      Tag.deleteMany.mockResolvedValue(result);

      await removeTags(transactionId);

      expect(Tag.deleteMany).toHaveBeenCalledWith({ transactionId });
      expect(logger.info).toHaveBeenCalledWith(
        "2 tags removed for transaction transactionId1"
      );
    });

    it("should log a message when no tags are found to remove", async () => {
      const transactionId = "transactionId2";
      const result = { deletedCount: 0 };

      Tag.deleteMany.mockResolvedValue(result);

      await removeTags(transactionId);

      expect(Tag.deleteMany).toHaveBeenCalledWith({ transactionId });
      expect(logger.info).toHaveBeenCalledWith(
        `No tags found for transaction ${transactionId}`
      );
    });

    it("should handle errors while removing tags", async () => {
      const transactionId = "transactionId1";

      Tag.deleteMany.mockRejectedValue(new Error("Database error"));

      await removeTags(transactionId);

      expect(logger.error).toHaveBeenCalledWith(
        `Error removing tags for transaction ${transactionId}: Database error`
      );
    });
  });
});
