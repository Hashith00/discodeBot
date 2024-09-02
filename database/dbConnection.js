const mongoose = require("mongoose");

const uri =
  "mongodb+srv://hashith:hashith@cluster01.tay6sk0.mongodb.net/baber_mobile?retryWrites=true&w=majority";

const dbConnection = async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB Atlas");
  } catch (err) {
    console.error("Could not connect to MongoDB Atlas", err);
  }
};

module.exports = dbConnection;
