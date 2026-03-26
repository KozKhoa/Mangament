export class MLService {
  async embedStory(title, summary, genres, authors) {
    const embed = await fetch(`${process.env.ML_SERVICE_URL}/embed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: `${title}. ${summary}. ${genres.join(", ")}. ${authors.join(", ")}.`,
      }),
    })
      .then((res) => res.json())
      .catch((err) => {
        console.log(err);
        return null;
      });

    return embed.embedding;

    // const res = await openai.embeddings.create({
    //   model: "text-embedding-3-small",
    //   input: `${title} ${summary} ${genres.join(", ")}`,
    // });

    // return res.data[0].embedding;
  }
}

export default new MLService();
