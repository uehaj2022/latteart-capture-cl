import express, { Request, Response } from "express";
const router = express.Router();
import userTimeSchema from "../models/UserTimeModel";

router.post("/updateusertime", async (req: Request, res: Response) => {
  const userTime: number = req.body;
  try {
    let result = await userTimeSchema.findOne({ userTime });
    if (result) {
      return res
        .status(400)
        .json({ success: false, error: "result already exists" });
    }
    result = await userTimeSchema.create({
      userTime: req.body.userTime,
    });

    console.log(result);
    res.status(200).json({ success: true, result });
  } catch (error) {
    let errorMessage = "Failed to do something exceptional";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.log(errorMessage);
    res.status(500).send("Some Internal Server Error");
  }
});

export default router;
