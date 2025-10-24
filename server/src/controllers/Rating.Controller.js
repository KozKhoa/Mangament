export async function PostRating(req, res, next) {
  try {
    const userId = req.user?.id;
    const storyId = req.params?.id;
  } catch (error) {
    next(error);
  }
}
