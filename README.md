# 🚀 Personal Finance Tracker REST API

_Personal Finance Tracking application to monitoring the User's spending patterns, while motivating the user to monitor thier Finance through Budgets and Goals. Further includes Reports Generation, Recurring Transactions, Tags and Categories for better filterization, Multi-Currency Support, Mail Notifications and More._ 💰📊

## 📌 Prerequisites

Ensure you have the following installed before proceeding:

- [Visual Code or Any Supported IDE]()
- [Node.js](https://nodejs.org/) (Recommended: latest LTS version)
- [npm](https://www.npmjs.com/) (Included with Node.js)
- [Postman] (For Backend Code Testing)
- [Zap] (for Security Testing)

---

## ⚙️ Setup

### 🔹 Local Environment

Follow these steps to set up and run the project locally:

1. Git Clone the repository into your Local Machine

2. Open cloned location with Visual Code

3. Open a Terminal (Terminal -> New Terminal)

4. Go to the Backend of the Project in the Terminal (eg. cd .\project-IT22051448\backend)

5. Install Project dependencies (using npm install or npm i )

6. Create a .env file in the backend folder of the project.

   env file should include,

   PORT=5000
   MONGODB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>?retryWrites=true&w=majority
   JWT_SECRET=<YOUR_JWT_SECRET_HERE>
   USER=<YOUR_EMAIL_HERE>
   APP_PASSWORD=<YOUR_APP_PASSWORD_HERE>

   Port 5000 is recommended only if you wish to run the frontend (since the frontend ports are hardcorded), otherwise any port of your choosing would work
   JWT SECRET is for the token setup , USER and APP Password is for the Email Notification setup

7. Backend is then run using <npm start>

8. Optional - If frontend is required (not fully completed), open another terminal, move into frontend folder (eg. cd .\project-IT22051448\frontend), install dependencies with <npm install> then run frontend by <<npm run dev>>

You are all set to test the backend codes through the frontend application or Postman.

---

### 🔑 Authentication

This API uses **JWT (JSON Web Tokens)** for authentication and authorization.

#### Obtaining a Token

To access protected endpoints, you need to obtain a JWT by logging in with valid credentials or obtained during registration of the user for the first time.

**Endpoint:**

POST /api/auth/register
POST /api/auth/login

### 🧪 Running Tests

Run the test suite using: <<npm test>>

Security Testing manually done using <<xss>> or can be automaticall done using <<ZAP 2.16.0>>

    Note: After installing Zap, run the project of the backend using npm start, then copy the url with the port to Zap automated testing. Then click attack to initiate an Attack.

---

### 🎯 Additional Commands

All backend endpoints tested in <<Postman>> can be found in the attached pdf document "Postman Test Scripts.pdf" for further reference

### Notifications

Notifications are set up for budget exhausting or exceeding 0, and Goal Completion

## Recurring Transactions

Recurring Transactions are set to run at midnight everyday found in recurringTransaction.js file in the utils folder, however the recurring transacitons could be manually set to run using the backend Postman GET method api/transaction/test-recurring-transactions

### 📞 Contact

For any inquiries, feel free to reach out via:

Email: christy.tck@gmail.com\
Contributors: @IT22051448\
