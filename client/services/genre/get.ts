export default async function get() {
  // let res;
  // try {
  //   res = await api.get("/genres", {});
  //   return res.data;
  // } catch (error) {
  //   if (axios.isAxiosError(error)) {
  //     return error?.response?.data;
  //   }
  //   return error;
  // }

  return {
    success: true,
    message: "Successfull",
    data: [
      "action",
      "adventure",
      "comedy",
      "crime",
      "cyberpunk",
      "dark_fantasy",
      "detective",
      "drama",
      "dystopian_fiction",
      "ecchi",
      "fairy_tale",
      "fantasy",
      "fiction",
      "gekiga",
      "gothic_fiction",
      "harem",
      "high_fantasy",
      "historical",
      "historical_fiction",
      "horror",
      "isekai",
      "josei",
      "kodomo",
      "literary_fiction",
      "low_fantasy",
      "magical_realism",
      "martial_arts",
      "mecha",
      "mystery",
      "parody",
      "post_apocalyptic",
      "psychology",
      "romance",
      "science_fiction",
      "seinen",
      "shojo",
      "shonen",
      "shoujo_ai",
      "shounen_ai",
      "slice_of_life",
      "space_opera",
      "sport",
      "steampunk",
      "supernatural",
      "survival",
      "thriller",
      "tragedy",
      "yaoi",
      "yuri",
    ],
  };
}
