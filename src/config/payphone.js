module.exports = {
  token: process.env.PAYPHONE_TOKEN || 'ciiC2HtDb0IxJAQzz1lY40Hmj_J7RFPCTqKvaV1gkFD6MpQdFdSPC770fjL0O-YrTQMj19bKG7kixCMLVBjmWeX-DTJ4SPoLn9PLmxXQY5SKnJeD8yaqp4bkRqaL0hh4gYzEf2YKtl-FZz82jLTJ3GSTTEfk2oPUpP3-PiUQV_c643kOdTy3ko3nMFKethHU490TS6oxsmCkOOVZVj1r5SZrw_mKBFIg2g4weeeFMwXfOhTTLWp1wRl1VZ9ds-AOkOL9n3sUD6IZd1br77ZQSE_ngl0qvWw8Oybq_x22baXQQaOonxCxIMVCgrrCjMnsYtNzSNDvEXRdEO48J9_0vAsHIsk',
  storeId: process.env.PAYPHONE_STORE_ID || '1cf571d8-6af8-446c-a9ec-ad8886b9d32f',
  confirmUrl: 'https://pay.payphonetodoesposible.com/api/button/V2/Confirm',
  responseUrl: process.env.PAYPHONE_RESPONSE_URL || 'http://localhost:3000/order-confirmation',
  domain: process.env.PAYPHONE_DOMAIN || 'http://localhost:3000'
};
