import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema({
  subjectId: { type: String, required: true },
  subjectName: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  status: {
    type: String,
    enum: ["present", "absent", "abandoned"],
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Attendance ||
  mongoose.model("Attendance", AttendanceSchema);
