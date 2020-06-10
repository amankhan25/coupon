require('dotenv').config();
require("./Helper/Logger");
const puppeteer = require('puppeteer');
const Helper = require("./Helper/Helper");
const STORE_NAME = "Shein";

async function applyCoupon(page, couponCode) {

  let couponTextField = "input.input-sm";
  let applyButton = "a.she-btn-s.she-fr.she-btn-white";

  await page.evaluate(selector => {
    document.querySelector(selector).innerText = "";
  }, couponTextField);


  await page.type(couponTextField, couponCode);
  await Helper.delayPromise(1000);

  await page.evaluate(ap => {
    document.querySelectorAll(ap)[0].click();
  }, applyButton);

  await page.click(applyButton);
  await Helper.delayPromise(1000);

  global.AppLog.log("applyButton done", couponCode);
  let message = "";
  message = await page.evaluate(() => {
    if (document.querySelector("p.success-tip")) {
      if (document.querySelector("p.error-tip").innerText === "\n\t\t\t\t\t\tSorry, this coupon code is invalid.\n\t\t\t\t\t") {
        return "Coupon code applied successfully"
      }
      return document.querySelector("p.error-tip").innerText;
    }
    console.log(document.querySelector("p.success-tip"));
    console.log(document.querySelector("p.error-tip"));
    return "success";
  });


  global.AppLog.log("message", message);
  await page.waitFor(2000);
  await page.evaluate(reset => {
    document.querySelector(reset).value = null;
  }, couponTextField);
  global.AppLog.log("Resetted Text Field");

  await Helper.delayPromise(1000);
  return {
    store_name: STORE_NAME,
    coupon_code: couponCode,
    message: message,
  };


}

const verifyCoupons = async (coupons) => {
  let url = "";
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--disable-notifications"]
  });

  global.AppLog.log("start");
  const page = await browser.newPage();
  await page.bringToFront();

  const login = "https://www.shein.in/user/auth/login";
  await page.goto(login, {
    waitUntil: 'networkidle2'
  });
  global.AppLog.log("login page");

  await page.type('input[type="email"]', process.env.USER_NAME);
  await page.type('input[type="password"]', process.env.PASSWORD);
  await page.click('button.she-btn-black.she-btn-l.she-btn-block');
  await page.waitForNavigation();

  //list page
  const listPage = "https://www.shein.in/Plus-Size-Jeans-c-2055.html?icn=plus-size-jeans&ici=in_tab01navbar06menu12dir01&srctype=category&userpath=category%3EWOMEN%3EPLUS%20+%20CURVE%3EDenim%3EJeans&scici=navbar_2~~tab01navbar06menu12dir01~~6_12_1~~real_2055~~SPcCccWomenCategory_default~~0~~0";
  await page.goto(listPage, {
    waitUntil: 'networkidle2'
  });
  global.AppLog.log("open list page");

  //get 3 product from page list
  const productUrls = await page.evaluate((CART_ITEM_LIMIT) => {
    let urls = [];
    let productSelector = "a.c-goodsitem__goods-name.j-goodsitem__goods-name";
    Array.from(document.querySelectorAll(productSelector))
      .splice(0, 3)
      .forEach(item => {
        urls.push(item.href)
      });
    return urls;
  });

  for (let i in productUrls) {


    let url = productUrls[i];
    global.AppLog.log("opening ", url);
    await page.goto(url, {
      waitUntil: 'networkidle2'
    });

    global.AppLog.log("opened");

    ///////////////////////////////////////If Pop pup comes/////////////////////////////////////////
    // let div_selector_to_remove= "div.c-vue-coupon";
    // await page.evaluate((sel) => {
    // var elements = document.querySelectorAll(sel);
    // for(var i=0; i< elements.length; i++){
    //     elements[i].parentNode.removeChild(elements[i]);
    // }
    // }, div_selector_to_remove);
    // await page.waitFor(2000);
    ///////////////////////////////////////If Pop pup comes/////////////////////////////////////////

    global.AppLog.log("size selection");
    let sizeSelector = "div.product-intro__size-radio.j-product-intro__size-radio:nth-child(2)";
    page.click(sizeSelector);
    global.AppLog.log("size selection done");

    let addToCart = "button.she-btn-black.she-btn-xl:nth-child(1)";
    await page.click(addToCart);
    global.AppLog.log("addToCart done");

    await Helper.delayPromise(1000);
  }

  url = "https://www.shein.in/cart";
  global.AppLog.log("opening ", url);
  await page.goto(url, {
    waitUntil: 'networkidle2'
  });
  global.AppLog.log("opened");

  let checkout = "button.she-btn-black.she-btn-xl.j-cart-check";
  await page.click(checkout);
  global.AppLog.log("checkout done");


  await page.waitFor(4000);
  await page.evaluate(ap => {
    document.querySelectorAll(ap)[0].click();
  }, "a.she-btn-s.she-fr.she-btn-white");
  await page.waitFor(3000);


  let response = [];
  for (let i in coupons) {
    global.AppLog.log("applying coupon", coupons[i]);
    response.push(await applyCoupon(page, coupons[i]));
    global.AppLog.log("done coupon", coupons[i]);
  }
  return response;
}

(async () => {
  let coupons = ['WELCOME100', 'PORTICO20', 'PICK2SAVE', 'EX10', 'sh300']
  let response = await verifyCoupons(coupons);
  global.AppLog.log("response", response);
})();
