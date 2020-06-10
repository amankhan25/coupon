require('dotenv').config();
require("./Helper/Logger");
const puppeteer = require('puppeteer');
const Helper = require("./Helper/Helper");
const STORE_NAME = "Shein";

async function applyCoupon(page, couponCode) {

    let couponTextField = "p.success-tip";
    await page.waitForSelector(couponTextField);
    let applyButton = "div.check-coupon a.she-btn-s .la-ball-pulse";

    await page.evaluate(selector => {
        document.querySelector(selector).innerText = "";
    }, couponTextField);

    await page.type(couponTextField, couponCode);
    await Helper.delayPromise(1000);
    await page.click(applyButton);
    await Helper.delayPromise(1000);

    global.AppLog.log("applyButton done", couponCode);

    let message = await page.evaluate(() => {
        if (document.querySelector("p.success-tip ")) {
            return document.querySelector("p.error-tip").innerText;
        }
        return "success";
    });

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

    global.AppLog.log("start");
    const page = await browser.newPage();
    await page.bringToFront();

    const login = "https://www.shein.in/user/auth/login";
    await page.goto(login, { waitUntil: 'networkidle2' });
    global.AppLog.log("login page");

    await page.type('input[type="email"]', process.env.USER_NAME);
    await page.type('input[type="password"]',process.env.PASSWORD);
    await page.click('button.she-btn-black.she-btn-l.she-btn-block');
    await page.waitForNavigation();

    // list page
    //const listPage = "https://www.shein.in/Plus-Size-Jeans-c-2055.html?icn=plus-size-jeans&ici=in_tab01navbar06menu12dir01&srctype=category&userpath=category%3EWOMEN%3EPLUS%20+%20CURVE%3EDenim%3EJeans&scici=navbar_2~~tab01navbar06menu12dir01~~6_12_1~~real_2055~~SPcCccWomenCategory_default~~0~~0";
    const listPage = "https://www.shein.in/Plus-Size-Jeans-c-2055.html?icn=plus-size-jeans&ici=in_tab01navbar06menu12dir01&srctype=category&userpath=category%3EWOMEN%3EPLUS%20+%20CURVE%3EDenim%3EJeans&scici=navbar_2~~tab01navbar06menu12dir01~~6_12_1~~real_2055~~SPcCccWomenCategory_default~~0~~0&ul=en-us&de=UTF-8&dt=Shop&0Women%27s%20Plus%20Size%20Jeans%20%7C%20Skinny%7C%20Wide%20Leg%7C%20Boyfriend%20%26%20More%20%7C%20SHEIN%20India&sd=24-bit&sr=1280x720&vp=1263x610&je=0&ec=MyCoupons&ea=ClosePopUps-NotSignedInCoupons";
    await page.goto(listPage, { waitUntil: 'networkidle2' });
    global.AppLog.log("open list page");

    // get 3 product from page list
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
        await page.goto(url, { waitUntil: 'networkidle2' });

        global.AppLog.log("opened");
        let div_selector_to_remove= "div.c-vue-coupon";
        await page.evaluate((sel) => {
        var elements = document.querySelectorAll(sel);
        for(var i=0; i< elements.length; i++){
            elements[i].parentNode.removeChild(elements[i]);
        }
        }, div_selector_to_remove);
        await page.waitFor(2000);

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
    await page.goto(url, { waitUntil: 'networkidle2' });
    global.AppLog.log("opened");

    let checkout = "button.she-btn-black.she-btn-xl.j-cart-check";
    await page.click(checkout);
    global.AppLog.log("checkout done");

    let applyCouponButton = "div.check-coupon a.she-btn-s .la-ball-pulse";
    await page.waitForSelector(applyCouponButton);
    await page.waitFor(300);
    await page.click(applyCouponButton);
    await page.waitFor(2500);
    await page.click(applyCouponButton);
  //  await page.evaluate(() => { document.querySelectorAll("div.check-coupon a.she-btn-s.she-fr.she-btn-white")[1].click(); });
    global.AppLog.log("applyCoupon done");

    let response = [];
    for (let i in coupons) {
        global.AppLog.log("applying coupon", coupons[i]);
        response.push(await applyCoupon(page, coupons[i]));
        global.AppLog.log("done coupon", coupons[i]);
    }
    return response;
}

(async () => {
    let coupons = ['sh300']
    let response = await verifyCoupons(coupons);
    global.AppLog.log("response", response);
})();
