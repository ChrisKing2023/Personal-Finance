import mongoose from "mongoose";

//User schema to store admin or user details

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    default: "user",
  },
  currency: {
    type: String,
    required: true,
    default: "USD",
  },
  avatar: {
    type: String,
  },
  contact: {
    type: String,
  },
  address: {
    type: String,
  },
  city: {
    type: String,
  },
  postalCode: {
    type: String,
  },
  country: {
    type: String,
  },

  last_login: {
    type: Date,
  },
});

const User = mongoose.model("User", userSchema);

export default User;
