import puppeteer from "puppeteer-core";

const base = "http://127.0.0.1:38471";
const dir = new URL("../ui_concepts/", import.meta.url);

async function shot(page, name) {
  await page.screenshot({ path: new URL(name, dir).pathname });
}

async function submitForm(page, anchor) {
  await page.evaluate((selector) => {
    const field = document.querySelector(selector);
    const form = field?.closest("form");
    if (!(form instanceof HTMLFormElement) || form.getClientRects().length === 0) {
      throw new Error(`visible form for ${selector} missing`);
    }
    form.requestSubmit();
  }, anchor);
}

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome-stable",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  page.on("console", (message) => {
    if (message.text().includes("submit") || message.text().includes("ORDERS")) {
      console.log("BROWSER", message.text());
    }
  });
  page.on("response", (response) => {
    if (response.url().includes("/api/orders") || response.url().includes("/api/auth")) {
      console.log("NET", response.status(), response.url());
    }
  });
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(base, { waitUntil: "networkidle0" });
  await page.waitForFunction(() => document.body.innerText.includes("Дневной набор от"));
  await shot(page, "app-home-mobile.png");
  await page.setViewport({ width: 1280, height: 900 });
  await shot(page, "app-home-desktop.png");

  await page.click("a[href='/onboarding'], a[href='/rations']");
  if (page.url().includes("/onboarding")) {
    await page.waitForSelector("text/Дальше");
    await page.locator("button::-p-text(Дальше)").click();
    await page.locator("button::-p-text(Дальше)").click();
    await page.locator("button::-p-text(К уведомлениям)").click();
    await page.locator("button::-p-text(Не сейчас)").click();
  }
  await page.waitForFunction(() => document.body.innerText.includes("Тип питания"));
  await page.setViewport({ width: 390, height: 844 });
  await page.locator("[data-testid='diet-balanced']").click();
  await shot(page, "app-rations-mobile.png");
  await page.setViewport({ width: 1280, height: 900 });
  await shot(page, "app-rations-desktop.png");

  const links = await page.$$("a[href^='/rations/']");
  await links[1].click();
  await page.waitForFunction(() => document.body.innerText.includes("К оплате"));
  await shot(page, "app-menu-desktop.png");
  await page.setViewport({ width: 390, height: 900 });
  await shot(page, "app-menu-mobile.png");
  await page.locator("a::-p-text(Оформить доставку)").click();
  await page.waitForSelector("#street");
  await page.locator("#street").fill("Тверская");
  await page.locator("#house").fill("9");
  await page.locator("#phone").fill("+79031112233");
  await page.evaluate(() => {
    document.querySelector("#phone")?.scrollIntoView({ block: "center" });
  });
  await shot(page, "app-checkout-mobile.png");
  await submitForm(page, "#street");
  await page.waitForFunction(() => location.pathname === "/login");
  await page.locator("#email").fill("demo@norma.test");
  await page.locator("#password").fill("Demo12345");
  await submitForm(page, "#email");
  await page.waitForFunction(() => location.pathname === "/checkout");
  await page.waitForFunction(() => {
    const street = document.querySelector("#street");
    return (
      street instanceof HTMLInputElement &&
      street.value.length > 1 &&
      street.getClientRects().length > 0
    );
  });
  await submitForm(page, "#street");
  await page.waitForFunction(() => location.pathname.startsWith("/pay/"));
  await page.waitForSelector("#number");
  await shot(page, "app-pay-mobile.png");
  await page.locator("#number").fill("4242424242424242");
  await page.locator("#expMonth").fill("12");
  await page.locator("#expYear").fill("2030");
  await page.locator("#cvv").fill("123");
  await submitForm(page, "#number");
  await page.waitForFunction(() => document.body.innerText.includes("Оплачен"));
  await shot(page, "app-order-paid-mobile.png");
  await page.locator("button::-p-text(Я получил набор)").click();
  await page.waitForFunction(() => document.body.innerText.includes("Доставлен"));
  await shot(page, "app-order-delivered-mobile.png");

  for (const [path, file, width] of [
    ["/concepts/minimal", "minimal.png", 390],
    ["/concepts/vivid", "vivid.png", 390],
    ["/concepts/corporate", "corporate.png", 390],
  ]) {
    await page.setViewport({ width, height: 900 });
    await page.goto(`${base}${path}`, { waitUntil: "networkidle0" });
    await shot(page, file);
  }
  console.log("e2e ok");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
