const CDP = require('chrome-remote-interface');
const fs = require('fs');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runQA() {
  let client;
  try {
    const response = await fetch('http://127.0.0.1:9222/json/list');
    const targets = await response.json();
    const target = targets.find(t => t.type === 'page');
    client = await CDP({ target });
    const { Page, Emulation } = client;

    await Page.enable();

    // Test Desktop
    await Emulation.setDeviceMetricsOverride({
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
      fitWindow: false
    });
    
    console.log("Navigating to Home (Desktop)...");
    await Page.navigate({ url: 'http://127.0.0.1:4174/' });
    await wait(3000);
    
    const { data: desktopData } = await Page.captureScreenshot({ format: 'png' });
    fs.writeFileSync('/home/marvelpokemaster/.gemini/antigravity/brain/0b9e93e4-936e-4d84-9467-247a9c3b4c8b/qa_home_desktop.png', Buffer.from(desktopData, 'base64'));

    // Test Mobile
    await Emulation.setDeviceMetricsOverride({
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      fitWindow: false
    });
    
    console.log("Navigating to Home (Mobile)...");
    await wait(2000);
    const { data: mobileData } = await Page.captureScreenshot({ format: 'png' });
    fs.writeFileSync('/home/marvelpokemaster/.gemini/antigravity/brain/0b9e93e4-936e-4d84-9467-247a9c3b4c8b/qa_home_mobile.png', Buffer.from(mobileData, 'base64'));

    console.log("Visual QA screenshots saved!");
  } catch (err) {
    console.error(err);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

runQA();
