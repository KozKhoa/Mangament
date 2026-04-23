import { ZodError } from "zod";

import { StatusCodes } from "http-status-codes";

export function ValidateData(schema) {
  return (req, res, next) => {
    try {
      console.log("Before validate = ", {
        body: req.body,
        params: req.params,
        query: req.query,
      });

      const validatedData = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      console.log("After validate = ", validatedData);

      Object.defineProperty(req, "body", {
        value: validatedData.body,
        writable: true,
        configurable: true,
        enumerable: true,
      });
      Object.defineProperty(req, "params", {
        value: validatedData.params,
        writable: true,
        configurable: true,
        enumerable: true,
      });
      Object.defineProperty(req, "query", {
        value: validatedData.query,
        writable: true,
        configurable: true,
        enumerable: true,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue) => `[${issue.path.join(".")}]: ${issue.message}`);
        res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid data", details: errorMessages });
      } else {
        console.log(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
      }
    }
  };
}
