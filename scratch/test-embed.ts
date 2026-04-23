const urlx = "https://1drv.ms/x/c/12bddd95b86e2ab0/IQQu0HCeaznpT7qOezb1EimxAZFhcgbrPln5MI-9XL3TWvU?wdAllowInteractivity=False&wdHideGridlines=True&wdHideHeaders=True&wdDownloadButton=True&wdInConfigurator=True&wdInConfigurator=True&edaebf=rslc0";

async function test() {
  const res = await fetch(urlx, { redirect: "follow" });
  console.log("Status:", res.status);
  const text = await res.text();
  
  // Try to find download URLs in the text
  const matches = text.match(/https:\/\/[^"']+/g) || [];
  const downloadLinks = matches.filter(m => m.toLowerCase().includes("download") || m.toLowerCase().includes("export"));
  
  console.log("Found links:", downloadLinks.length);
  if (downloadLinks.length > 0) {
    console.log("Sample:", downloadLinks.slice(0, 5));
  }
}

test().catch(console.error);
