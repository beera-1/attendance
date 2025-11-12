import { connectToDatabase } from "../../lib/mongodb";
import Attendance from "../../models/Attendance";

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === "GET") {
    const { month } = req.query;
    const filter = {};
    if (month) filter.date = { $regex: `^${month}` };
    const records = await Attendance.find(filter);
    res.status(200).json(records);
  }

  if (req.method === "POST") {
    const { subjectId, subjectName, date, status } = req.body;
    if (!subjectId || !subjectName || !date || !status)
      return res.status(400).json({ error: "Missing fields" });

    const existing = await Attendance.findOne({ subjectId, date });
    if (existing) {
      existing.status = status;
      await existing.save();
      return res.status(200).json(existing);
    }

    const record = await Attendance.create({ subjectId, subjectName, date, status });
    res.status(201).json(record);
  }
}
