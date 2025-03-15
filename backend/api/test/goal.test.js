import request from "supertest";
import app from "../../app";
import Goal from "../../api/models/goal.model";
import User from "../../api/models/user.model";
import TotalSavings from "../../api/models/totalSavings.model";
import goalController from "../controllers/goal.controller";
import "dotenv/config";
import jwt from "jsonwebtoken";

// Mock dependencies
jest.mock("../../api/models/goal.model");
jest.mock("../../api/models/user.model");
jest.mock("../../api/models/totalSavings.model");
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));
jest.mock("../service/email.service");

const mockGoals = [
  {
    _id: "goalId1",
    email: "testuser@example.com",
    title: "Buy a Car",
    currency: "USD",
    targetValue: 5000,
    savedValue: 1000,
    remainingAmount: 4000,
    description: "Saving for a new car",
    isCompleted: false,
  },
  {
    _id: "goalId2",
    email: "testuser@example.com",
    title: "Vacation",
    currency: "EUR",
    targetValue: 3000,
    savedValue: 500,
    remainingAmount: 2500,
    description: "Saving for a vacation",
    isCompleted: false,
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

const mockTotalSavings = {
  email: "testuser@example.com",
  savedAmount: 2000,
};

let token;

beforeEach(() => {
  jest.clearAllMocks();

  User.findOne.mockResolvedValue(mockUser);
  User.findById.mockImplementation(id => ({
    select: jest
      .fn()
      .mockResolvedValue(id === "mockAdminId" ? mockAdmin : mockUser),
  }));
  Goal.find.mockResolvedValue(mockGoals);
  TotalSavings.findOne.mockResolvedValue(mockTotalSavings);

  jwt.verify.mockReturnValue({
    _id: "mockUserId",
    role: "user",
    email: "testuser@example.com",
  });

  token = jwt.sign(
    { _id: "mockUserId", role: "user", email: "testuser@example.com" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
});

// !Integration Testing

const mockAuthMiddleware = roles => {
  return async (req, res, next) => {
    try {
      const authorization = `Bearer ${token}`;

      if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Missing or invalid token",
        });
      }

      const extractedToken = authorization.split(" ")[1];

      let decoded;
      try {
        decoded = jwt.verify(extractedToken, process.env.JWT_SECRET);
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Invalid or expired token",
        });
      }

      if (!decoded || !decoded._id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Invalid token structure",
        });
      }

      const { _id, role } = decoded;

      if (!roles.includes(role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Access denied",
        });
      }

      req.user = { _id, role, email: "testuser@example.com" };

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };
};

describe("GoalController - Manage Goals", () => {
  it("should return all goals and total savings for a valid user request", async () => {
    app.use(mockAuthMiddleware(["user"]));

    const response = await request(app)
      .get("/api/goal")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.goals).toHaveLength(2);
    expect(response.body.totalSavings).toBe(2000);
  });

  it("should return 404 when no goals are found for a user", async () => {
    Goal.find.mockResolvedValue([]);

    const response = await request(app)
      .get("/api/goal")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);

    expect(response.body.message).toBe("No goals found");
  });

  it("should return 400 if required fields are missing when creating a goal", async () => {
    const response = await request(app)
      .post("/api/goal")
      .set("Authorization", `Bearer ${token}`)
      .send({
        description: "A description of the goal",
      });

    expect(response.status).toBe(400);

    expect(response.body.message).toBe("Missing required fields");
  });

  it("should return 404 when trying to get a goal by ID that doesn't exist", async () => {
    Goal.findOne.mockResolvedValue(null);

    const response = await request(app)
      .get("/api/goal/invalidGoalId")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);

    expect(response.body.message).toBe("Goal not found");
  });

  it("should return 400 when updating a completed goal", async () => {
    const completedGoal = {
      ...mockGoals[0],
      isCompleted: true,
    };

    Goal.findOne.mockResolvedValue(completedGoal);

    const response = await request(app)
      .put(`/api/goal/${completedGoal._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Updated Goal Title",
        targetValue: 6000,
      });

    expect(response.status).toBe(400);

    expect(response.body.message).toBe("Cannot update a completed goal");
  });
});

//! Unit Test Cases

describe("createGoal", () => {
  it("should return 400 if required fields are missing", async () => {
    const req = {
      body: {
        title: "",
        image: "image.jpg",
        description: "Test goal",
      },
      user: { email: "testuser@example.com" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await goalController.createGoal(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Missing required fields",
    });
  });
});

describe("getAllGoals", () => {
  it("should return 404 if no goals are found", async () => {
    const req = { user: { email: "testuser@example.com" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    Goal.find = jest.fn().mockResolvedValue([]);

    await goalController.getAllGoals(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "No goals found" });
  });
});

describe("markGoalCompleted", () => {
  it("should return 404 if goal not found", async () => {
    const req = {
      params: { goalId: "goalId1" },
      user: { email: "testuser@example.com" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    Goal.findOne = jest.fn().mockResolvedValue(null);

    await goalController.markGoalCompleted(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Goal not found" });
  });
});

describe("deleteGoal", () => {
  it("should return 404 if goal not found", async () => {
    const req = {
      params: { goalId: "goalId1" },
      user: { email: "testuser@example.com" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    Goal.findOne = jest.fn().mockResolvedValue(null);

    await goalController.deleteGoal(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Goal not found" });
  });
});

describe("getAllGoals", () => {
  it("should return all goals successfully", async () => {
    const req = { user: { email: "testuser@example.com" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock Goal.find to return a list of goals
    Goal.find = jest.fn().mockResolvedValue([
      {
        _id: "goalId1",
        email: "testuser@example.com",
        title: "Buy a Car",
        currency: "USD",
        targetValue: 5000,
        savedValue: 1000,
        remainingAmount: 4000,
        description: "Saving for a new car",
        isCompleted: false,
      },
      {
        _id: "goalId2",
        email: "testuser@example.com",
        title: "Vacation",
        currency: "EUR",
        targetValue: 3000,
        savedValue: 500,
        remainingAmount: 2500,
        description: "Saving for a vacation",
        isCompleted: false,
      },
    ]);

    // Mock TotalSavings.findOne to return total savings
    TotalSavings.findOne = jest.fn().mockResolvedValue({ savedAmount: 2000 });

    await goalController.getAllGoals(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      goals: expect.arrayContaining([
        expect.objectContaining({
          title: "Buy a Car",
          targetValue: 5000,
        }),
      ]),
      totalSavings: 2000,
    });
  });

  describe("createGoal", () => {
    it("should return an error if required fields are missing", async () => {
      const req = {
        body: {
          title: "",
          targetValue: 1500,
        },
        user: { email: "testuser@example.com" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await goalController.createGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Missing required fields",
      });
    });
  });

  describe("getAllGoals", () => {
    it("should return all goals and total savings for the user", async () => {
      const req = { user: { email: "testuser@example.com" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const goals = [{ title: "Save for laptop", targetValue: 1500 }];
      Goal.find.mockResolvedValue(goals);
      TotalSavings.findOne.mockResolvedValue({ savedAmount: 500 });

      await goalController.getAllGoals(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        goals,
        totalSavings: 500,
      });
    });

    it("should return an error if no goals are found", async () => {
      const req = { user: { email: "testuser@example.com" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Goal.find.mockResolvedValue([]);

      await goalController.getAllGoals(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "No goals found",
      });
    });
  });

  describe("updateGoalSavedValue", () => {
    it("should return an error if not enough savings", async () => {
      const req = {
        params: { goalId: "123" },
        body: { amount: 2000 },
        user: { email: "testuser@example.com" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const goal = { savedValue: 0, targetValue: 1500 };
      Goal.findOne.mockResolvedValue(goal);
      TotalSavings.findOne.mockResolvedValue({ savedAmount: 1000 });

      await goalController.updateGoalSavedValue(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Not enough savings",
      });
    });
  });

  describe("reverseGoalSavedValue", () => {
    it("should return an error if insufficient saved value to reverse", async () => {
      const req = {
        params: { goalId: "123" },
        body: { amount: 300 },
        user: { email: "testuser@example.com" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const goal = { savedValue: 200, targetValue: 1500 };
      Goal.findOne.mockResolvedValue(goal);
      TotalSavings.findOne.mockResolvedValue({ savedAmount: 800 });

      await goalController.reverseGoalSavedValue(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Insufficient saved value",
      });
    });
  });
});
