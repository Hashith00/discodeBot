const { type } = require("express/lib/response");
const mongoose = require("mongoose");

const summarySchema = mongoose.Schema({
  userName: {
    type: String,
    required: [true, "Please enter your Name!"],
    minLength: [3, "Name must contain at least 3 Characters!"],
    maxLength: [30, "Name cannot exceed 30 Characters!"],
  },
  summary: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Summary = mongoose.model("Summary", summarySchema);

module.exports = Summary;
