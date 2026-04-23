let url:any = "https://1drv.ms/x/c/12bddd95b86e2ab0/IQAu0HCeaznpT7qOezb1EimxAY7tYhduJgBeRof3s-dsoIU?e=yO6uSL&nav=MTVfezAwMDAwMDAwLTAwMDEtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMH0";

const encodedUrl = Buffer.from(url).toString("base64")
  .replace(/\//g, "_")
  .replace(/\+/g, "-")
  .replace(/=+$/, "");

const apiUrl = `https://api.onedrive.com/v1.0/shares/u!${encodedUrl}/root/content`;

async function testFetch() {
  console.log("Fetching:", apiUrl);
  const res = await fetch(apiUrl, { method: "GET" });
  console.log("Status:", res.status);
  console.log("Content-Type:", res.headers.get("content-type"));
  
  if (res.status === 302 || res.status === 301) {
    console.log("Redirect Location:", res.headers.get("location"));
  }
  
  const buffer = await res.arrayBuffer();
  console.log("Size:", buffer.byteLength);
  console.log("Preview:", Buffer.from(buffer).toString("utf-8", 0, 100));
}

testFetch().catch(console.error);
