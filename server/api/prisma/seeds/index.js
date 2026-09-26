// server/api/prisma/seeds/index.js

// Lấy tham số truyền vào sau dấu --
const target = process.argv[2];

if (target) {
  // Nếu có đuôi .js thì import trực tiếp, nếu chỉ truyền "prod" thì import "prod/index.js"
  const targetFile = target.endsWith(".js") ? target : `${target}/index.js`;
  console.log(`🌱 Đang chạy seed từ: ${targetFile}`);
  await import(`./${targetFile}`);
} else {
  // Mặc định chạy theo NODE_ENV nếu không truyền tham số
  const env = process.env.NODE_ENV === "production" ? "prod" : "dev";
  console.log(`🌱 Mặc định chạy seed theo môi trường: ${env}`);
  await import(`./${env}/index.js`);
}
