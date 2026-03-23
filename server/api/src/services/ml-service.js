export class MLService {
  async embedStory(title, summary, genres) {
    const embed = await fetch(`${process.env.ML_SERVICE_URL}:${process.env.ML_SERVICE_PORT}/embed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: `${title}. ${summary}. ${genres.join(", ")}.`,
      }),
    })
      .then((res) => res.json())
      .catch((err) => {
        console.log(err);
        return null;
      });

    return embed.embedding;
  }
}

export default new MLService();
