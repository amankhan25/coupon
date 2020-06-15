require('dotenv').config();
require("./Helper/Logger");
const puppeteer = require('puppeteer');
const Helper = require("./Helper/Helper");
const STORE_NAME = "TataCliq";

async function applyCoupon(page, couponCode) {

  let couponTextField = 'input[class="_2wBdAJ6BFwpXejbzsJBPO0"]';
  let applyButton = "div._39OpcZxiNcXTrQ9ZDw_HBu div.e_2AYHMqVOvbq3aqV8Klx span";
  await page.waitFor(2000);
  page.focus("._2RHuVS6tB7UBdCNnBUwLnR");

  await page.evaluate(selector => {
    document.querySelector(selector).innerText = "";
  }, couponTextField);

  await page.type(couponTextField, couponCode);
  await Helper.delayPromise(1000);
  await page.click(applyButton);
  await Helper.delayPromise(1000);
  global.AppLog.log("applyButton done", couponCode);

  ///////////////////////////////ApplyingButton/////////////////////////////////
  let message = "";
  message = await page.evaluate(() => {
    //to check coupon text response
    if (document.querySelector("div._3x__BZbv_OebbQSOeFcga-").innerText === "Check for Coupon") {
      //if unsuccessful then again click apply button
      setTimeout(
        function() {
          document.querySelector("div._1Joz53T3FBvYTzzKkqkpUB > div._2FILfKLfSj6HZ4fvhMgnA8 > div._3ss2FN-Ew-EsT9zKljuYNl > div > div._3dIcWk_XAQ6eSFc_syrVZ1 > div > div > div > div").click();
        }, 2000);
      return "Coupon code is not applicable";

    } else {
      return document.querySelector("div._3x__BZbv_OebbQSOeFcga-").innerText + "--Coupon Applied";
      //click change button
      document.querySelector("div._1Joz53T3FBvYTzzKkqkpUB div._3ss2FN-Ew-EsT9zKljuYNl div._3dIcWk_XAQ6eSFc_syrVZ1  div._2kalUY-7TvOFlLnwpIV1PE").click();
      // click remove button
      document.querySelector("div._39OpcZxiNcXTrQ9ZDw_HBu > div._2RHuVS6tB7UBdCNnBUwLnR > div > div._2SdcqLNra5m1wHRK-T2u3O._1AtBAG--RkEyQpG0PUVsUQ > div > div > div.e_2AYHMqVOvbq3aqV8Klx > div > div").click();
      // apply button
      setTimeout(
        function() {
          document.querySelector("div._1Joz53T3FBvYTzzKkqkpUB > div._2FILfKLfSj6HZ4fvhMgnA8 > div._3ss2FN-Ew-EsT9zKljuYNl > div > div._3dIcWk_XAQ6eSFc_syrVZ1 > div > div > div > div").click();
        }, 2000);
      global.AppLog.log("Resetted Text Field");
    }

    return "success";
  });

  ///////////////////////////////ResetButton/////////////////////////////////
  global.AppLog.log("message", message);


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
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
  await page.bringToFront();
  await page.setViewport({
    width: 400,
    height: 442
  });
  global.AppLog.log("login page");

  //list page
  const listPage = "https://www.tatacliq.com/asics-hypergel-sai-2-sheet-rock-grey-running-shoes/p-mp000000007134054";
  await page.goto(listPage, {
    waitUntil: 'networkidle2'
  });
  global.AppLog.log("open list page");

  global.AppLog.log("size selection");
  await page.waitFor(3000);
  let sizeSelector = "div._3Zwp_xfvys_Gl6iCn51uE6 > div > div._3hVFKItFozDhfABDlm29A2 > div._1aUdjHZYKnkxjO2n7hIzJh > div:nth-child(3) div._3KO5bwoK9FVaKBs1KNCrAH div:nth-child(2) > div:nth-child(2) > div > div";
  await page.waitForSelector(sizeSelector);
  await page.click(sizeSelector);
  global.AppLog.log("size selection done");
  await page.waitFor(3000);

  let addToCart = "div._3_YucrMmCxihPmln7ztMSO span";
  await page.evaluate(add => {
    document.querySelectorAll(add)[1].click();
  }, addToCart);
  global.AppLog.log("addToCart done");
  await page.waitFor(3000);

  url = "https://www.tatacliq.com/apple-iphone-7-32-gb-gold/p-mp000000000572023";
  global.AppLog.log("opening ", "mobile url");
  await page.goto(url, {
    waitUntil: 'networkidle2'
  });
  global.AppLog.log("opened");

  await page.waitForSelector(addToCart);
  await page.evaluate(add => {
    document.querySelectorAll(add)[1].click();
  }, addToCart);
  await page.waitFor(3000);
  global.AppLog.log("addToCart done");
  await page.waitFor(3000);

  url = "https://www.tatacliq.com/cart";
  global.AppLog.log("opening ", url);
  await page.goto(url, {
    waitUntil: 'networkidle2'
  });
  await page.setViewport({
    width: 400,
    height: 442
  });
  global.AppLog.log("opened");
  await page.waitFor(4000);

  let applyButton = "._334CJHb5qzNgnA_p0FkQYm";
  await page.evaluate(ap => {
    document.querySelectorAll(ap)[1].click();
  }, applyButton);
  await page.waitFor(3000);
  global.AppLog.log("apply button done");
  await page.waitFor(5000);

  let response = [];
  const tweets = await page.$$('._1aH8pQNIQ6PqcWZIVVNswC');
  const couponNames = await page.$$('div.GC6Q3hP7d0EOBaARl0CQp span');

  /////////////////////Selection of already present coupon////////////////////////
  for (let i = 0; i < tweets.length; i++) {
    const tweet = await (await tweets[i].getProperty('innerText')).jsonValue();
    const couponName = await (await couponNames[i].getProperty('innerText')).jsonValue();
    console.log(tweet);
    global.AppLog.log(tweet);
    response.push({
      store_name: STORE_NAME,
      AlreadyPresentCoupon: couponName,
      Details: tweet
    });
  }

  for (let i in coupons) {
    global.AppLog.log("applying coupon", coupons[i]);
    response.push(await applyCoupon(page, coupons[i]));
    global.AppLog.log("done coupon", coupons[i]);
  }
  
  await browser.close();
  return response;

} //end of function

(async () => {
  let coupons = ['sh300', 'NEW18', 'PORTICO20', 'PICK2SAVE', 'ASICS10', 'EX10']
  let response = await verifyCoupons(coupons);
  global.AppLog.log("response", response);
})();
