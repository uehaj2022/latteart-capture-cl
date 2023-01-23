import mongoose from "mongoose";

const userTimeSchema = new mongoose.Schema({
  userTime: { type: Number, default: 0 },
  dateOfJoin: { type: Date, default: Date.now },
});

const UserTime = mongoose.model("UserTime", userTimeSchema);
export default UserTime;
