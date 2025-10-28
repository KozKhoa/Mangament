const ErrorMiddleware = (err, req, res, next) => {
  try {
    console.log(err);
    const result = res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  } catch (error) {
    console.error("❌ [Error.Middlesware.js] Handle error fail:", error);
  }
};

export default ErrorMiddleware;
