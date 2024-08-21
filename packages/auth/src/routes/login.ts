import express from "express";
import { z } from "zod";

const loginRouter = express.Router();

loginRouter.use(express.json());

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

loginRouter.post(
  "/",
  (req, res, next) => {
    try {
      loginSchema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map((issue) => ({
          message: `${issue.path.join(".")} is ${issue.message}`,
        }));
        res.status(400).json({ error: "Invalid data", details: errorMessages });
      } else {
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  },
  (req, res) => {
    res.status(415).send("Not implemented");
  }
);

export default loginRouter;
