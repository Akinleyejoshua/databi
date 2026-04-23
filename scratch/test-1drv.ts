const url = "https://1drv.ms/x/c/12bddd95b86e2ab0/IQAu0HCeaznpT7qOezb1EimxAY7tYhduJgBeRof3s-dsoIU?e=yO6uSL&nav=MTVfezAwMDAwMDAwLTAwMDEtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMH0&download=1";

async function testFetch() {
  const res = await fetch(url, { method: "GET" });
  console.log("Status:", res.status);
  console.log("Content-Type:", res.headers.get("content-type"));
  console.log("Content-Disposition:", res.headers.get("content-disposition"));
  
  const buffer = await res.arrayBuffer();
  console.log("Size:", buffer.byteLength);
}

testFetch().catch(console.error);
