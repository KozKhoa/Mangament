import { r2 } from "../configs/r2.js";

import { DeleteObjectCommand, DeleteObjectsCommand, PutObjectCommand } from "@aws-sdk/client-s3";

export async function uploadObject(key, fileBuffer, contentType) {
  return await r2.send(
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    }),
  );
}

export async function deleteObject(key) {
  return await r2.send(
    new DeleteObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET,
      Key: key,
    }),
  );
}

export async function deleteManyObjects(keys) {
  return await r2.send(
    new DeleteObjectsCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET,
      Delete: { Objects: keys.map((key) => ({ Key: key })) },
    }),
  );
}
