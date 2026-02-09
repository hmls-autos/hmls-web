import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

let _r2: S3Client | null = null;

function getR2(): S3Client {
  if (!_r2) {
    const accountId = Deno.env.get("R2_ACCOUNT_ID");
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are required",
      );
    }

    _r2 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return _r2;
}

function getBucketName(): string {
  return Deno.env.get("R2_BUCKET_NAME") || "diagnostic-media";
}

function getAccountId(): string {
  const accountId = Deno.env.get("R2_ACCOUNT_ID");
  if (!accountId) {
    throw new Error("R2_ACCOUNT_ID is required");
  }
  return accountId;
}

export interface UploadResult {
  key: string;
  url: string;
}

export async function uploadMedia(
  file: Uint8Array,
  filename: string,
  contentType: string,
  sessionId: string,
): Promise<UploadResult> {
  const bucketName = getBucketName();
  const key = `sessions/${sessionId}/${Date.now()}-${filename}`;

  await getR2().send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
    }),
  );

  return {
    key,
    url:
      `https://${bucketName}.${getAccountId()}.r2.cloudflarestorage.com/${key}`,
  };
}

export async function getMedia(key: string): Promise<Uint8Array> {
  const response = await getR2().send(
    new GetObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    }),
  );

  return new Uint8Array(await response.Body!.transformToByteArray());
}

export async function deleteMedia(key: string): Promise<void> {
  await getR2().send(
    new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    }),
  );
}
