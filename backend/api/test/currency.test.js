import request from "supertest";
import app from "../../app";
import Currency from "../../api/models/currency.model";
import User from "../../api/models/user.model";
import bcrypt from "bcrypt";
import "dotenv/config";
import jwt from "jsonwebtoken";

// Mock dependencies
jest.mock("../../api/models/currency.model");
jest.mock("../../api/models/user.model");
jest.mock("bcrypt", () => ({
  compare: jest.fn(),
}));
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(), // Mock sign function
  verify: jest.fn(), // Mock verify function
}));

const mockCurrencies = [
  {
    _id: "currencyId1",
    value: "USD",
    label: "US Dollar",
  },
  {
    _id: "currencyId2",
    value: "EUR",
    label: "Euro",
  },
];

const mockAdmin = {
  _id: "mockAdminId",
  username: "adminuser",
  email: "adminuser@example.com",
  password: "hashedPassword",
  role: "admin",
  select: jest.fn().mockReturnValue({ ...mockAdmin, password: undefined }),
};

const mockUser = {
  _id: "mockUserId",
  username: "testuser",
  email: "testuser@example.com",
  password: "hashedPassword",
  role: "user",
  select: jest.fn().mockReturnValue({ ...mockUser, password: undefined }),
};

let token;
let nonAdminToken;

// Clear mocks and set up the mocks before each test
beforeEach(() => {
  jest.clearAllMocks();

  // Mock User.findById to return the mock admin user
  User.findById.mockImplementation(() => ({
    select: jest.fn().mockResolvedValue(mockAdmin),
  }));

  // Mock Currency.find() to return mockCurrencies
  Currency.find.mockResolvedValue(mockCurrencies);

  jwt.verify.mockReturnValue({ _id: "mockAdminId", role: "admin" });

  console.log("JWT Secret in test:", process.env.JWT_SECRET);

  // Create mock tokens
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

describe("CurrencyController - Manage Currencies", () => {
  it("should return 200 and a token for valid admin login", async () => {
    const mockToken = "mockedToken.mockedPayload.mockedSignature"; // Ensure it's set correctly

    // Mock User.findOne to return the mock admin user
    User.findOne.mockResolvedValue(mockAdmin);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue(mockToken);

    const response = await request(app).post("/api/auth/login").send({
      username: "adminuser@example.com",
      password: "password123",
    });

    // Store the token for later use
    token = response.body.token;

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBe(mockToken);
  });

  it("should return 200 and all currencies for valid admin request", async () => {
    if (!token) {
      return;
    }

    // Mock JWT verification to return a valid decoded admin user
    jwt.verify.mockReturnValue({ _id: "mockAdminId", role: "admin" });

    const response = await request(app)
      .get("/api/currency")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].value).toBe("USD");
    expect(response.body[1].label).toBe("Euro");
  });

  it("should return 403 if non-admin user tries to access currencies", async () => {
    console.log("Using non-admin token:", nonAdminToken); // Log token used in the test

    jwt.verify.mockReturnValue({ _id: "mockUserId", role: "user" });

    const response = await request(app)
      .post("/api/currency/add")
      .set("Authorization", `Bearer ${nonAdminToken}`);

    expect(response.status).toBe(403); // Forbidden for non-admin
    expect(response.body.message).toBe("Forbidden: Access denied");
  });

  it("should return 401 if no token is provided", async () => {
    const response = await request(app).post("/api/currency/add");

    expect(response.status).toBe(401); // No token provided
    expect(response.body.message).toBe(
      "Unauthorized: Missing or invalid token"
    );
  });

  it("should return 201 and successfully add a currency for admin", async () => {
    const newCurrency = {
      value: "GBP",
      label: "British Pound",
    };

    // Ensure findOne returns null (currency doesn't exist)
    Currency.findOne.mockResolvedValue(null);
    console.log("Mocked Currency.findOne called");

    const mockSave = jest.fn().mockResolvedValue({
      _id: "newCurrencyId",
      value: "GBP",
      label: "British Pound",
    });

    // Mock save function
    Currency.mockImplementation(data => ({
      ...data, // Preserve the value and label
      _id: "newCurrencyId",
      save: mockSave, // Assign the mocked save function
    }));
    console.log("Mocked Currency.save called");

    // Log the token before making the request
    console.log("Using token:", token);

    const response = await request(app)
      .post("/api/currency/add")
      .set("Authorization", `Bearer ${token}`)
      .send(newCurrency);

    // Log the response body
    console.log("Response Status:", response.status);
    console.log("Response Body:", response.body);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Currency added successfully.");
    expect(response.body.currency.value).toBe("GBP");
    expect(response.body.currency.label).toBe("British Pound");

    // Ensure save method was called
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it("should return 200 and successfully edit a currency for admin", async () => {
    const updatedCurrency = {
      value: "USD",
      label: "United States Dollar",
    };

    const currencyId = "currencyId1";

    // Mock Currency.findByIdAndUpdate to simulate successful update
    Currency.findByIdAndUpdate.mockResolvedValue({
      ...mockCurrencies[0],
      ...updatedCurrency, // Simulate the updated currency object
    });

    const response = await request(app)
      .put(`/api/currency/edit/${currencyId}`)
      .set("Authorization", `Bearer ${token}`)
      .send(updatedCurrency);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Currency updated successfully.");
    expect(response.body.updatedCurrency.value).toBe("USD");
    expect(response.body.updatedCurrency.label).toBe("United States Dollar");
  });
  it("should return 403 if non-admin user tries to edit a currency", async () => {
    const updatedCurrency = {
      value: "GBP",
      label: "British Pound",
    };

    const currencyId = "currencyId1";

    // Mock JWT verification for non-admin user
    jwt.verify.mockReturnValue({ _id: "mockUserId", role: "user" });

    const response = await request(app)
      .put(`/api/currency/edit/${currencyId}`)
      .set("Authorization", `Bearer ${nonAdminToken}`)
      .send(updatedCurrency);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Forbidden: Access denied");
  });
  it("should return 200 and successfully delete a currency for admin", async () => {
    const currencyId = "currencyId1";

    // Mock Currency.findByIdAndDelete to simulate successful deletion
    Currency.findByIdAndDelete.mockResolvedValue(mockCurrencies[0]);

    const response = await request(app)
      .delete(`/api/currency/delete/${currencyId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Currency deleted successfully.");
  });
  it("should return 403 if non-admin user tries to delete a currency", async () => {
    const currencyId = "currencyId1";

    // Mock JWT verification for non-admin user
    jwt.verify.mockReturnValue({ _id: "mockUserId", role: "user" });

    const response = await request(app)
      .delete(`/api/currency/delete/${currencyId}`)
      .set("Authorization", `Bearer ${nonAdminToken}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Forbidden: Access denied");
  });
  it("should return 400 if required fields are missing while adding a currency", async () => {
    const incompleteCurrency = {
      value: "", // Missing value
      label: "Invalid Currency",
    };

    const response = await request(app)
      .post("/api/currency/add")
      .set("Authorization", `Bearer ${token}`)
      .send(incompleteCurrency);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Both value and label are required.");
  });
  it("should return 400 if the currency already exists", async () => {
    const newCurrency = {
      value: "USD", // Currency already exists
      label: "US Dollar",
    };

    // Mock Currency.findOne to simulate currency already existing
    Currency.findOne.mockResolvedValue(mockCurrencies[0]);

    const response = await request(app)
      .post("/api/currency/add")
      .set("Authorization", `Bearer ${token}`)
      .send(newCurrency);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Currency already exists.");
  });
  it("should return 401 if an invalid token is provided while adding a currency", async () => {
    const newCurrency = {
      value: "JPY",
      label: "Japanese Yen",
    };

    // Mock JWT verification to throw an error (invalid token)
    jwt.verify.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    const response = await request(app)
      .post("/api/currency/add")
      .set("Authorization", `Bearer invalidToken`)
      .send(newCurrency);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe(
      "Unauthorized: Invalid or expired token"
    );
  });
});
