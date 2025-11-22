import formidable from "formidable";
import fs from "fs";
import path from "path";

// Disable bodyParser for file uploads
export const config = { api: { bodyParser: false } };

export async function POST(req) {
  const form = new formidable.IncomingForm();
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  form.uploadDir = uploadDir;
  form.keepExtensions = true;

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error("Error parsing the files", err);
        return reject(
          new Response(JSON.stringify({ error: "Error parsing the files" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          })
        );
      }
      const file = files.image;
      if (!file) {
        return reject(
          new Response(JSON.stringify({ error: "No file uploaded" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        );
      }
      const filePath = file.path;
      
      console.log("Uploaded file saved at:", filePath);

      resolve(
        new Response(JSON.stringify({ filePath }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    });
  });
}
