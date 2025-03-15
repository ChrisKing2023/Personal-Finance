import request from "supertest";
import app from "../../app";
import User from "../../api/models/user.model";
import bcrypt from "bcrypt";
import "dotenv/config";
import jwt from "jsonwebtoken";

// Mock dependencies
jest.mock("../../api/models/user.model");
jest.mock("bcrypt", () => ({
  compare: jest.fn(),
}));
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

const mockUsers = [
  {
    _id: "userId1",
    username: "johndoe",
    firstname: "John",
    lastname: "Doe",
    email: "johndoe@example.com",
    password: "hashedPassword123",
    role: "user",
    currency: "USD",
    avatar: "https://example.com/avatar1.jpg",
    contact: "+1234567890",
    address: "123 Main St",
    city: "New York",
    postalCode: "10001",
    country: "USA",
    last_login: new Date("2024-03-01T12:00:00Z"),
  },
  {
    _id: "userId2",
    username: "adminuser",
    firstname: "Admin",
    lastname: "User",
    email: "admin@example.com",
    password: "hashedPassword456",
    role: "admin",
    currency: "EUR",
    avatar: "https://example.com/avatar2.jpg",
    contact: "+9876543210",
    address: "456 Admin St",
    city: "Berlin",
    postalCode: "10115",
    country: "Germany",
    last_login: new Date("2024-03-02T08:30:00Z"),
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

  // Mock User.findById to return the appropriate user with select function
  User.findById.mockImplementation(id => ({
    select: jest
      .fn()
      .mockResolvedValue(
        id === "mockAdminId"
          ? { ...mockAdmin, password: undefined }
          : id === "mockUserId"
            ? { ...mockUser, password: undefined }
            : null
      ),
    save: jest.fn().mockResolvedValue(mockUser), // Ensure save is mocked
  }));

  // Mock User.find to return the list of users
  User.find.mockImplementation(() => ({
    select: jest.fn().mockResolvedValue(mockUsers),
  }));

  // Ensure jwt.sign properly generates different tokens
  jwt.sign.mockImplementation((payload, secret, options) => {
    if (payload.role === "admin") return "mockedAdminToken";
    if (payload.role === "user") return "mockedNonAdminToken";
    return "invalidToken";
  });

  // Ensure jwt.verify properly distinguishes tokens
  jwt.verify.mockImplementation(token => {
    if (token === "mockedAdminToken") {
      return { _id: "mockAdminId", role: "admin" };
    }
    if (token === "mockedNonAdminToken") {
      return { _id: "mockUserId", role: "user" };
    }
    throw new Error("Invalid token");
  });

  console.log("JWT Secret in test:", process.env.JWT_SECRET);

  // Generate separate tokens
  token = "mockedAdminToken";
  nonAdminToken = "mockedNonAdminToken";
});

describe("UserController - Manage Users", () => {
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

  it("should return 200 and all users for valid admin request", async () => {
    if (!token) {
      return;
    }

    jwt.verify.mockReturnValue({ _id: "mockAdminId", role: "admin" });

    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(mockUsers.length);
    expect(response).not.toHaveProperty("password");
  });
  it("should return 200 and the requested user for a valid ID", async () => {
    if (!token) {
      return;
    }

    const mockUser = mockUsers[0];
    User.findById.mockImplementation(() => ({
      select: jest.fn().mockResolvedValue({
        ...mockUser,
        password: undefined,
      }),
    }));

    const response = await request(app)
      .get(`/api/users/${mockUser._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("username", mockUser.username);
    expect(response.body).toHaveProperty("email", mockUser.email);
    expect(response.body).not.toHaveProperty("password"); // Ensure password is excluded
  });

  it("should return 200 and the updated user information for valid request", async () => {
    if (!token) {
      return;
    }

    const mockUser = mockUsers[0];
    const updatedUser = { ...mockUser, username: "updatedusername" };

    // Mock User.findById and User.save
    User.findById.mockImplementation(() => ({
      select: jest.fn().mockResolvedValue({ ...mockUser, password: undefined }),
      save: jest.fn().mockResolvedValue(updatedUser), // Mock save to return updated user
    }));

    const response = await request(app)
      .patch(`/api/users/${mockUser._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "updatedusername" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User updated successfully");
    expect(response.body.user.username).toBe("updatedusername");
    expect(response.body.user).not.toHaveProperty("password"); // Ensure password is excluded
  });

  it("should return 200 and a success message for a valid delete request", async () => {
    if (!token) {
      return;
    }

    const mockUser = mockUsers[0];

    User.findById.mockImplementation(() => ({
      select: jest.fn().mockResolvedValue({ ...mockUser, password: undefined }),

      remove: jest.fn().mockResolvedValue(mockUser),
    }));

    const response = await request(app)
      .delete(`/api/users/${mockUser._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User deleted successfully");
  });

  it("should return 403 for non-admin trying to update another user", async () => {
    if (!nonAdminToken) {
      return;
    }

    const mockUser = mockUsers[0];

    const response = await request(app)
      .patch(`/api/users/${mockUser._id}`)
      .set("Authorization", `Bearer ${nonAdminToken}`)
      .send({ username: "updatedUsername" });

    console.log("Response Status:", response.status);
    console.log("Response Body:", response.body); // Check actual response

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "Forbidden: You can only update your own profile"
    );
  });

  // it("should return 403 if a non-admin user tries to update their role to admin", async () => {
  //   if (!nonAdminToken) {
  //     return;
  //   }

  //   const mockUser = mockUsers[0]; // Regular user trying to update role

  //   // Mock User.findById and User.save
  //   User.findById.mockImplementation(() => ({
  //     select: jest.fn().mockResolvedValue({ ...mockUser, password: undefined }),
  //     save: jest.fn().mockResolvedValue({ ...mockUser, role: "admin" }), // Attempt to change role
  //   }));

  //   const response = await request(app)
  //     .patch(`/api/users/${mockUser._id}`)
  //     .set("Authorization", `Bearer ${nonAdminToken}`)
  //     .send({ role: "admin" });

  //   console.log("Response Status:", response.status);
  //   console.log("Response Body:", response.body); // Check actual response

  //   expect(response.status).toBe(403);
  //   expect(response.body.message).toBe(
  //     "Forbidden: You can only update your own profile"
  //   );
  // });
});
