import fs from "fs";
import request from "supertest";
import app from "../../app";
import User from "../../api/models/user.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import mongoose from "mongoose";

// Mock dependencies
jest.mock("../../api/models/user.model");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

let server;
let token;

//!Integration Testing
describe("AuthController - Login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 200 and a token for valid login", async () => {
    const mockUser = {
      _id: "mockUserId",
      username: "testuser",
      email: "testuser@example.com",
      password: "hashedPassword",
      role: "user",
    };

    const mockToken = "mockedToken.mockedPayload.mockedSignature"; // Ensure it's set correctly

    // Mock database call
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue(mockToken);

    const response = await request(app).post("/api/auth/login").send({
      username: "testuser@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBe(mockToken);

    token = response.body.token;

    fs.writeFileSync("./token.txt", token);
  });

  // The remaining tests will use the token set above
  it("should use the token in another test", async () => {
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
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it("should return 400 if user does not exist", async () => {
    User.findOne.mockResolvedValue(null);

    const response = await request(app).post("/api/auth/login").send({
      username: "nonexistent@example.com",
      password: "password123",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("User not found");
  });

  it("should return 500 on server error", async () => {
    User.findOne.mockRejectedValue(new Error("Database error"));

    const response = await request(app).post("/api/auth/login").send({
      username: "adminTest4",
      password: "adminTest4",
    });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Internal server error");
  });

  afterAll(async () => {
    const activeHandles = process._getActiveHandles();

    await mongoose.connection.close();
    await mongoose.disconnect(); // Ensures full disconnection

    if (server) {
      server.close(() => {});
    }

    // Give time for handles to close
    await new Promise(resolve => setTimeout(resolve, 1000));

    jest.resetModules();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });
});
