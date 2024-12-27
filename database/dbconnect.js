import mongoose from "mongoose";

const mongoConnect = async () => {
  const MongoURI = process.env.DB_URI;
  try {
    await mongoose.connect(MongoURI);
    if (mongoose.connection) {
      console.log("MongoDB is connected");
    }
  } catch (error) {
    console.log("Error while Connecting MongoDb", error);
  }
};

export default mongoConnect;
