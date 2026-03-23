import { generateSignatureForAddNewStoryNode } from "./src/services/cloudinary.service.js";

import { initRedis } from "./src/configs/redis.js";

initRedis();

await generateSignatureForAddNewStoryNode("ffa4e526-6c2c-4456-9594-9b7b65aa53e5", null, 20);
