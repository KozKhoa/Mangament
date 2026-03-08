import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/drive"];

const auth = new google.auth.GoogleAuth({
  keyFile: "./api-key/google-drive-api-key.json",
  scopes: SCOPES,
});

const drive = google.drive({ version: "v3", auth });

export default drive;
