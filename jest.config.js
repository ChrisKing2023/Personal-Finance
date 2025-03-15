module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  verbose: true, // Enable verbose logging of tests
  maxWorkers: 1, // Run tests serially to avoid parallelism issues with streams
  reporters: ["default"], // Default reporters
  testTimeout: 20000, // Increase timeout for cleanup if necessary
  globalTeardown: "./test/globalTeardown.js", // Optional: Custom global teardown logic
};
