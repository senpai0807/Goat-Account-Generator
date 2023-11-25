const fs = require('fs');
const path = require('path');
const got = require('got');
const crypto = require('crypto');
const inquirer = require('inquirer');
const { v4: uuidv4 } = require('uuid');
const { CookieJar } = require('tough-cookie');
var random_name = require('node-random-name');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { Webhook, MessageBuilder } = require('discord-webhook-node');

const cookieJar = new CookieJar();
const taskid = uuidv4();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let tokenId;
let authToken;
let addressId;

const stateAbbreviations = {
    'Alabama': 'AL',
    'Alaska': 'AK',
    'Arizona': 'AZ',
    'Arkansas': 'AR',
    'California': 'CA',
    'Colorado': 'CO',
    'Connecticut': 'CT',
    'Delaware': 'DE',
    'District of Columbia': 'DC',
    'Florida': 'FL',
    'Georgia': 'GA',
    'Hawaii': 'HI',
    'Idaho': 'ID',
    'Illinois': 'IL',
    'Indiana': 'IN',
    'Iowa': 'IA',
    'Kansas': 'KS',
    'Kentucky': 'KY',
    'Louisiana': 'LA',
    'Maine': 'ME',
    'Maryland': 'MD',
    'Massachusetts': 'MA',
    'Michigan': 'MI',
    'Minnesota': 'MN',
    'Mississippi': 'MS',
    'Missouri': 'MO',
    'Montana': 'MT',
    'Nebraska': 'NE',
    'Nevada': 'NV',
    'New Hampshire': 'NH',
    'New Jersey': 'NJ',
    'New Mexico': 'NM',
    'New York': 'NY',
    'North Carolina': 'NC',
    'North Dakota': 'ND',
    'Ohio': 'OH',
    'Oklahoma': 'OK',
    'Oregon': 'OR',
    'Pennsylvania': 'PA',
    'Rhode Island': 'RI',
    'South Carolina': 'SC',
    'South Dakota': 'SD',
    'Tennessee': 'TN',
    'Texas': 'TX',
    'Utah': 'UT',
    'Vermont': 'VT',
    'Virginia': 'VA',
    'Washington': 'WA',
    'West Virginia': 'WV',
    'Wisconsin': 'WI',
    'Wyoming': 'WY'
};

async function getUserInput() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'zipcode',
            message: 'Enter your zip code:',
            validate: input => /^\d{5}$/.test(input) ? true : 'Zip code must be exactly 5 digits.'
        },
        {
            type: 'input',
            name: 'city',
            message: 'Enter your city:',
            validate: input => input.trim() !== '' ? true : 'City is required.'
        },
        {
            type: 'input',
            name: 'address1',
            message: 'Enter your address (line 1):',
            validate: input => input.trim() !== '' ? true : 'Address line 1 is required.'
        },
        {
            type: 'input',
            name: 'phone',
            message: 'Enter your phone number:',
            validate: input => /^\d{10}$/.test(input.replace(/-/g, '')) ? true : 'Phone number must be 10 digits (dashes will be removed).'
        },
        {
            type: 'input',
            name: 'state',
            message: 'Enter your state:',
            validate: input => input.trim() !== '' ? true : 'State is required.'
        },
        {
            type: 'input',
            name: 'address2',
            message: 'Enter your address (line 2) [Optional]:',
            default: null
        }
    ]);

    const { zipcode, city, address1, phone, state, address2 } = answers;

    return answers;
}

async function getCardDetails() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'cardNumber',
            message: 'Enter your card number:',
            validate: input => /^\d{16}$/.test(input) ? true : 'Card number must be exactly 16 digits.'
        },
        {
            type: 'input',
            name: 'expirationDate',
            message: 'Enter the expiration date (Format: M/YYYY):',
            validate: input => /^(1[0-2]|[1-9])\/20[2-9]\d$/.test(input) ? true : 'Invalid format. Use M/YYYY with full year and no leading 0 for the month.'
        },
        {
            type: 'input',
            name: 'cvv',
            message: 'Enter your CVV:',
            validate: input => /^\d{3,4}$/.test(input) ? true : 'CVV must be 3 or 4 digits.'
        }
    ]);

    const { cardNumber, expirationDate, cvv } = answers;

    return answers;
}

function generateRandomHexString(length) {
    if (length % 2 !== 0) {
        throw new Error("Length must be an even number to generate a valid hexadecimal string.");
    }
    return crypto.randomBytes(length / 2).toString('hex').toUpperCase();
}

function generatePassword(length) {
    const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const symbolChars = '!@#$%^&';
    const allChars = upperChars + lowerChars + numberChars + symbolChars;
    
    let password = 
      upperChars[Math.floor(Math.random()*upperChars.length)] +
      lowerChars[Math.floor(Math.random()*lowerChars.length)] +
      numberChars[Math.floor(Math.random()*numberChars.length)] +
      symbolChars[Math.floor(Math.random()*symbolChars.length)];
    
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random()*allChars.length)];
    }
  
    password = password.split('').sort(() => Math.random() - 0.5).join('');
  
    return password;
  }


const accountGenerator = async (userInput, cardinput, numberOfAccounts, answerEmail, proxies) => {
    let accountEmail = '';
    let randomYear = Math.floor(Math.random() * (2006 - 1970 + 1)) + 1970;
    const { zipcode, city, address1, phone, state, address2 } = userInput;
    const { cardNumber, expirationDate, cvv } = cardinput;
    const [month, year] = expirationDate.split('/');
    const stateAbbreviation = stateAbbreviations[state];

for (let i = 0; i < numberOfAccounts.count; i++) {
    let accountPassword = generatePassword(12);
    const firstName = random_name({ first: true });
    const lastName = random_name({ last: true });
    let fullName = firstName + ' ' + lastName;
    let catchall = ''; // ------------- Set Catchall
    if (answerEmail.useCatchall) {
        accountEmail = `${firstName}${lastName}${randomYear.toString()}@${catchall}`;
    } else {
        return;
    }
    const embId = generateRandomHexString(32);
    const proxy = proxies[i % proxies.length];
    const [ip, port, username, passwordProxy] = proxy.split(':');
    const proxyAgent = new HttpsProxyAgent(`http://${username}:${passwordProxy}@${ip}:${port}`);
    let proxyUsed = `${ip}:${port}:${username}:${passwordProxy}`;
    await delay(15000);
    console.log(`Using proxy: ${proxyUsed}`);
    console.log(`Task ${taskid}: Generating Account [${i + 1}]...`);
        try {
            await got(`https://www.goat.com/api/v1/users`, {
                method: 'POST',
                followRedirect: true,
                maxRedirects: 100,
                agent: {
                    http: proxyAgent,
                    https: proxyAgent
                },
                headers: {
                    'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
                    'x-px-authorization': '3',
                    'accept': 'application/json',
                    'authorization': 'Token token=""',
                    'accept-language': 'en-US,en;q=0.9',
                    'accept-encoding': 'gzip, deflate, br',
                    'x-emb-st': '1700550369418',
                    'user-agent': 'GOAT/2.66.4 (iPhone; iOS 17.0.3; Scale/3.00) Locale/en',
                    'x-emb-id': embId,
                    'x-px-original-token': '3:a23c9bbc95c5936ff89629747f7076b06626ef8c34904ef1ad2bec13fdffa457:LkoQ0lIgtxwK9sFLOCVSyfuVaXHvJICfSdWTUy7igEFJwmQ5M0Q74pM7PpTKdMwg+jOnCTzwiXXx2DOQKH7U+g==:1000:uZtx28ZpKuPT4clx83i6YUcDxyLLCkmE93OZFE7Ky7LWhs8pQx+KM+KIT0ohdagX6YHWE0FAIvsm2AUUVQ79bSXOsXYr09T67WWG16RApcLhXUTsMFe07LEaGlYsh1OlHkinTW2wETpHa1UacFKYyN/UNfzakepxOglZT1wcA+HlUulK/i+JczJVpd1C6kDfWT1XJ1Qeh/yb66D7bJhs+sYzHaxoGchUzkSfP1tAPAypkeiE3YLfuXpnSW1GSic4'
                },
                form: {
                    'emailRegistration': '1',
                    'user[password]': accountPassword.toString(),
                    'user[name]': fullName.toString(),
                    'user[email]': accountEmail.toString(),
                    'user[region]': 'US'
                },
                cookieJar
            }).then(accountGeneration => {
                const generationResponse = JSON.parse(accountGeneration.body);
                authToken = generationResponse.authToken;
    
                if (accountGeneration.statusCode === 200) {
                    try {
                        console.log(`Task ${taskid}: Successfully Generated Account [${accountGeneration.statusCode}]...`);
                        console.log(`Task ${taskid}: Setting Default Shipping Address [${accountGeneration.statusCode}]...`)
                        return got('https://www.goat.com/api/v1/addresses', {
                            method: 'POST',
                            followRedirect: true,
                            maxRedirects: 100,
                            agent: {
                                http: proxyAgent,
                                https: proxyAgent
                            },
                            headers: {
                                'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
                                'x-px-authorization': '3',
                                'accept': 'application/json',
                                'authorization': `Token token="${authToken}"`,
                                'accept-language': 'en-US,en;q=0.9',
                                'accept-encoding': 'gzip, deflate, br',
                                'x-emb-st': '1700546521139',
                                'user-agent': 'GOAT/2.66.4 (iPhone; iOS 17.0.3; Scale/3.00) Locale/en',
                                'x-emb-id': embId,
                                'x-px-original-token': '3:a23c9bbc95c5936ff89629747f7076b06626ef8c34904ef1ad2bec13fdffa457:LkoQ0lIgtxwK9sFLOCVSyfuVaXHvJICfSdWTUy7igEFJwmQ5M0Q74pM7PpTKdMwg+jOnCTzwiXXx2DOQKH7U+g==:1000:uZtx28ZpKuPT4clx83i6YUcDxyLLCkmE93OZFE7Ky7LWhs8pQx+KM+KIT0ohdagX6YHWE0FAIvsm2AUUVQ79bSXOsXYr09T67WWG16RApcLhXUTsMFe07LEaGlYsh1OlHkinTW2wETpHa1UacFKYyN/UNfzakepxOglZT1wcA+HlUulK/i+JczJVpd1C6kDfWT1XJ1Qeh/yb66D7bJhs+sYzHaxoGchUzkSfP1tAPAypkeiE3YLfuXpnSW1GSic4',
                            },
                            form: {
                                'address[countryCode]': 'US',
                                'address[postalCode]': zipcode.toString(),
                                'address[city]': city.toString(),
                                'address[addressType]': 'shipping',
                                'address[id]': '-1',
                                'address[address1]': address1.toString(),
                                'address[phone]': phone.toString(),
                                'address[name]': fullName.toString(),
                                'address[state]': state.toString(),
                                'address[address2]': address2.toString()
                            },
                            cookieJar
                        }).then(shippingAddressSubmission => {
                            if (shippingAddressSubmission.statusCode) {
                                console.log(`Task ${taskid}: Successfully Saved Shipping Address [${shippingAddressSubmission.statusCode}]...`);
                                console.log(`Task ${taskid}: Setting Default Billing Address [${shippingAddressSubmission.statusCode}]`)
                                return got('https://www.goat.com/api/v1/addresses', {
                                    method: 'POST',
                                    followRedirect: true,
                                    maxRedirects: 100,
                                    agent: {
                                        http: proxyAgent,
                                        https: proxyAgent
                                    },
                                    headers: {
                                        'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
                                        'x-px-authorization': '3',
                                        'accept': 'application/json',
                                        'authorization': `Token token="${authToken}"`,
                                        'accept-language': 'en-US,en;q=0.9',
                                        'accept-encoding': 'gzip, deflate, br',
                                        'x-emb-st': '1700546521139',
                                        'user-agent': 'GOAT/2.66.4 (iPhone; iOS 17.0.3; Scale/3.00) Locale/en',
                                        'x-emb-id': embId,
                                        'x-px-original-token': '3:a23c9bbc95c5936ff89629747f7076b06626ef8c34904ef1ad2bec13fdffa457:LkoQ0lIgtxwK9sFLOCVSyfuVaXHvJICfSdWTUy7igEFJwmQ5M0Q74pM7PpTKdMwg+jOnCTzwiXXx2DOQKH7U+g==:1000:uZtx28ZpKuPT4clx83i6YUcDxyLLCkmE93OZFE7Ky7LWhs8pQx+KM+KIT0ohdagX6YHWE0FAIvsm2AUUVQ79bSXOsXYr09T67WWG16RApcLhXUTsMFe07LEaGlYsh1OlHkinTW2wETpHa1UacFKYyN/UNfzakepxOglZT1wcA+HlUulK/i+JczJVpd1C6kDfWT1XJ1Qeh/yb66D7bJhs+sYzHaxoGchUzkSfP1tAPAypkeiE3YLfuXpnSW1GSic4',
                                    },
                                    form: {
                                        'address[countryCode]': 'US',
                                        'address[postalCode]': zipcode.toString(),
                                        'address[city]': city.toString(),
                                        'address[addressType]': 'billing',
                                        'address[id]': '-1',
                                        'address[address1]': address1.toString(),
                                        'address[phone]': phone.toString(),
                                        'address[name]': fullName.toString(),
                                        'address[state]': state.toString(),
                                        'address[address2]': address2.toString()
                                    },
                                    cookieJar
                                }).then(billingAddressSubmission => {
                                    try {
                                        if (billingAddressSubmission.statusCode === 200) {
                                            console.log(`Task ${taskid}: Successfully Saved Billing Address [${billingAddressSubmission.statusCode}]...`);
                                            console.log(`Task ${taskid}: Setting Default Payment [${billingAddressSubmission.statusCode}]...`);
                                            return got('https://api.stripe.com/v1/tokens', {
                                                method: 'POST',
                                                followRedirect: true,
                                                maxRedirects: 100,
                                                agent: {
                                                    http: proxyAgent,
                                                    https: proxyAgent
                                                },
                                                headers: {
                                                    'content-type': 'application/x-www-form-urlencoded',
                                                    'accept': '*/*',
                                                    'authorization': 'Bearer pk_live_eVTnJ0YFSiOvBUVnyhbC0Jfg',
                                                    'accept-encoding': 'gzip, deflate, br',
                                                    'accept-language': 'en-US,en;q=0.9',
                                                    'x-emb-st': '1700568779975',
                                                    'stripe-version': '2020-08-27',
                                                    'user-agent': 'GOAT/3 CFNetwork/1474 Darwin/23.0.0',
                                                    'x-stripe-user-agent': '{"os_version":"17.0.3","bindings_version":"22.8.1","vendor_identifier":"050EB6DB-4491-4474-AE34-7D8897AECE45","type":"iPhone13,4","lang":"objective-c","model":"iPhone"}',
                                                    'x-emb-id': embId
                                                },
                                                form: {
                                                    'card[address_city]': city,
                                                    'card[address_country]': 'US',
                                                    'card[address_line1]': address1,
                                                    'card[address_line2]': address2,
                                                    'card[address_zip]': zipcode,
                                                    'card[cvc]': cvv,
                                                    'card[exp_month]': month,
                                                    'card[exp_year]': year,
                                                    'card[name]': fullName,
                                                    'card[number]': cardNumber,
                                                    'payment_user_agent': 'stripe-ios/22.8.1; variant.legacy'
                                                },
                                                cookieJar
                                            }).then(fetchPaymentToken => {
                                                try {
                                                    if (fetchPaymentToken.statusCode === 200) {
                                                        const responseBody = JSON.parse(fetchPaymentToken.body);
                                                        tokenId = responseBody.id;

                                                        console.log(`Task ${taskid}: Fetching Address ID [${fetchPaymentToken.statusCode}]...`);
                                                        return got('https://www.goat.com/api/v1/addresses', {
                                                            method: 'GET',
                                                            headers: {
                                                                'x-px-authorization': '3',
                                                                'accept': 'application/json',
                                                                'authorization': `Token token="${authToken}"`,
                                                                'accept-encoding': 'gzip, deflate, br',
                                                                'x-emb-st': '1700595063299',
                                                                'accept-language': 'en-US,en;q=0.9',
                                                                'user-agent': 'GOAT/2.66.4 (iPhone; iOS 17.0.3; Scale/3.00) Locale/en',
                                                                'x-emb-id': embId,
                                                                'x-px-original-token': '3:a23c9bbc95c5936ff89629747f7076b06626ef8c34904ef1ad2bec13fdffa457:LkoQ0lIgtxwK9sFLOCVSyfuVaXHvJICfSdWTUy7igEFJwmQ5M0Q74pM7PpTKdMwg+jOnCTzwiXXx2DOQKH7U+g==:1000:uZtx28ZpKuPT4clx83i6YUcDxyLLCkmE93OZFE7Ky7LWhs8pQx+KM+KIT0ohdagX6YHWE0FAIvsm2AUUVQ79bSXOsXYr09T67WWG16RApcLhXUTsMFe07LEaGlYsh1OlHkinTW2wETpHa1UacFKYyN/UNfzakepxOglZT1wcA+HlUulK/i+JczJVpd1C6kDfWT1XJ1Qeh/yb66D7bJhs+sYzHaxoGchUzkSfP1tAPAypkeiE3YLfuXpnSW1GSic4'
                                                            },
                                                            cookieJar
                                                        }).then(fetchAddressId => {
                                                            try {
                                                                if (fetchAddressId.statusCode === 200) {
                                                                    const responseBody = JSON.parse(fetchAddressId.body);
                                                                    if (responseBody.addresses && responseBody.addresses.length > 0) {
                                                                        addressId = responseBody.addresses[0].id;
                            
                                                                    } else {
                                                                        console.log('No addresses found in response');
                                                                    };
                                                                    console.log(`Task ${taskid}: Saving Default Payment [${fetchAddressId.statusCode}]...`);
                                                                    return got('https://www.goat.com/api/v1/billing_infos', {
                                                                        method: 'POST',
                                                                        followRedirect: true,
                                                                        maxRedirects: 100,
                                                                        agent: {
                                                                            http: proxyAgent,
                                                                            https: proxyAgent
                                                                        },
                                                                        headers: {
                                                                            'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
                                                                            'x-px-authorization': '3',
                                                                            'accept': 'application/json',
                                                                            'authorization': `Token token="${authToken}"`,
                                                                            'accept-language': 'en-US,en;q=0.9',
                                                                            'accept-encoding': 'gzip, deflate, br',
                                                                            'x-emb-st': '1700568780666',
                                                                            'user-agent': 'GOAT/2.66.4 (iPhone; iOS 17.0.3; Scale/3.00) Locale/en',
                                                                            'x-emb-id': embId,
                                                                            'x-px-original-token': '3:a23c9bbc95c5936ff89629747f7076b06626ef8c34904ef1ad2bec13fdffa457:LkoQ0lIgtxwK9sFLOCVSyfuVaXHvJICfSdWTUy7igEFJwmQ5M0Q74pM7PpTKdMwg+jOnCTzwiXXx2DOQKH7U+g==:1000:uZtx28ZpKuPT4clx83i6YUcDxyLLCkmE93OZFE7Ky7LWhs8pQx+KM+KIT0ohdagX6YHWE0FAIvsm2AUUVQ79bSXOsXYr09T67WWG16RApcLhXUTsMFe07LEaGlYsh1OlHkinTW2wETpHa1UacFKYyN/UNfzakepxOglZT1wcA+HlUulK/i+JczJVpd1C6kDfWT1XJ1Qeh/yb66D7bJhs+sYzHaxoGchUzkSfP1tAPAypkeiE3YLfuXpnSW1GSic4'
                                                                        },
                                                                        form: {
                                                                            'billingInfo[processorName]': 'stripe',
                                                                            'billingInfo[paymentType]': 'card',
                                                                            'billingInfo[name]': fullName,
                                                                            'billingInfo[billingAddressId]': addressId,
                                                                            'billingInfo[stripeToken]': tokenId
                                                                        },
                                                                        cookieJar
                                                                    }).then(paymentSaved => {
                                                                        try {
                                                                            if (paymentSaved.statusCode === 200) {
                                                                                console.log(`Task ${taskid}: Accepting Goat TOS [${paymentSaved.statusCode}]...`);
                                                                                try {
                                                                                    return got('https://www.goat.com/api/v1/community_users/accept-terms', {
                                                                                        method: "POST",
                                                                                        agent: {
                                                                                            http: proxyAgent,
                                                                                            https: proxyAgent
                                                                                        },
                                                                                        headers: {
                                                                                            'content-type': 'application/x-www-form-urlencoded',
                                                                                            'x-px-authorization': '3',
                                                                                            'accept': 'application/json',
                                                                                            'authorization': `Token token="${authToken}"`,
                                                                                            'accept-language': 'en-US,en;q=0.9',
                                                                                            'accept-encoding': 'gzip, deflate, br',
                                                                                            'x-emb-st': '1700617247893',
                                                                                            'user-agent': 'GOAT/2.66.4 (iPhone; iOS 17.0.3; Scale/3.00) Locale/en',
                                                                                            'x-emb-id': embId,
                                                                                            'x-px-original-token': '3:a23c9bbc95c5936ff89629747f7076b06626ef8c34904ef1ad2bec13fdffa457:LkoQ0lIgtxwK9sFLOCVSyfuVaXHvJICfSdWTUy7igEFJwmQ5M0Q74pM7PpTKdMwg+jOnCTzwiXXx2DOQKH7U+g==:1000:uZtx28ZpKuPT4clx83i6YUcDxyLLCkmE93OZFE7Ky7LWhs8pQx+KM+KIT0ohdagX6YHWE0FAIvsm2AUUVQ79bSXOsXYr09T67WWG16RApcLhXUTsMFe07LEaGlYsh1OlHkinTW2wETpHa1UacFKYyN/UNfzakepxOglZT1wcA+HlUulK/i+JczJVpd1C6kDfWT1XJ1Qeh/yb66D7bJhs+sYzHaxoGchUzkSfP1tAPAypkeiE3YLfuXpnSW1GSic4'
                                                                                        },
                                                                                        body: '{"campaign":2}',
                                                                                        cookieJar
                                                                                    }).then(acceptTOS => {
                                                                                        try {
                                                                                            if (acceptTOS.statusCode === 200) {
                                                                                                console.log(`Task ${taskid}: Successfully Accepted TOS [${acceptTOS.statusCode}]...`);
                                                                                                console.log(`Task ${taskid}: Updating User Profile [${acceptTOS.statusCode}]...`);
                                                                                                return got('https://www.goat.com/api/v1/community_users/update-user-profile', {
                                                                                                    method: "POST",
                                                                                                    agent: {
                                                                                                        http: proxyAgent,
                                                                                                        https: proxyAgent
                                                                                                    },
                                                                                                    headers: {
                                                                                                        'content-type': 'application/x-www-form-urlencoded',
                                                                                                        'x-px-authorization': '3',
                                                                                                        'accept': 'application/json',
                                                                                                        'authorization': `Token token="${authToken}"`,
                                                                                                        'accept-language': 'en-US,en;q=0.9',
                                                                                                        'accept-encoding': 'gzip, deflate, br',
                                                                                                        'x-emb-st': '1700617561273',
                                                                                                        'user-agent': 'GOAT/2.66.4 (iPhone; iOS 17.0.3; Scale/3.00) Locale/en',
                                                                                                        'x-emb-id': 'F76770AF58CB4E749EB0685FDD33037E',
                                                                                                        'x-px-original-token': '3:a23c9bbc95c5936ff89629747f7076b06626ef8c34904ef1ad2bec13fdffa457:LkoQ0lIgtxwK9sFLOCVSyfuVaXHvJICfSdWTUy7igEFJwmQ5M0Q74pM7PpTKdMwg+jOnCTzwiXXx2DOQKH7U+g==:1000:uZtx28ZpKuPT4clx83i6YUcDxyLLCkmE93OZFE7Ky7LWhs8pQx+KM+KIT0ohdagX6YHWE0FAIvsm2AUUVQ79bSXOsXYr09T67WWG16RApcLhXUTsMFe07LEaGlYsh1OlHkinTW2wETpHa1UacFKYyN/UNfzakepxOglZT1wcA+HlUulK/i+JczJVpd1C6kDfWT1XJ1Qeh/yb66D7bJhs+sYzHaxoGchUzkSfP1tAPAypkeiE3YLfuXpnSW1GSic4'
                                                                                                    },
                                                                                                    body: `{"city":"${city}","country":"US","state":"${stateAbbreviation}"}`,
                                                                                                    cookieJar
                                                                                                }).then(updateUserProfile => {
                                                                                                    try {
                                                                                                        if (updateUserProfile.statusCode === 200) {
                                                                                                            console.log(`Task ${taskid}: Successfully Updated User Profile [${updateUserProfile.statusCode}]...`);
                                                                                                            console.log(`Task ${taskid}: Completing Account Onboarding [${updateUserProfile.statusCode}]...`);
                                                                                                            return got('https://www.goat.com/api/v1/community_users/complete-onboarding', {
                                                                                                                method: "POST",
                                                                                                                agent: {
                                                                                                                    http: proxyAgent,
                                                                                                                    https: proxyAgent
                                                                                                                },
                                                                                                                headers: {
                                                                                                                    'content-type': 'application/x-www-form-urlencoded',
                                                                                                                    'x-px-authorization': '3',
                                                                                                                    'accept': 'application/json',
                                                                                                                    'authorization': `Token token="${authToken}"`,
                                                                                                                    'accept-language': 'en-US,en;q=0.9',
                                                                                                                    'accept-encoding': 'gzip, deflate, br',
                                                                                                                    'x-emb-st': '1700617769767',
                                                                                                                    'user-agent': 'GOAT/2.66.4 (iPhone; iOS 17.0.3; Scale/3.00) Locale/en',
                                                                                                                    'x-emb-id': embId,
                                                                                                                    'x-px-original-token': '3:a23c9bbc95c5936ff89629747f7076b06626ef8c34904ef1ad2bec13fdffa457:LkoQ0lIgtxwK9sFLOCVSyfuVaXHvJICfSdWTUy7igEFJwmQ5M0Q74pM7PpTKdMwg+jOnCTzwiXXx2DOQKH7U+g==:1000:uZtx28ZpKuPT4clx83i6YUcDxyLLCkmE93OZFE7Ky7LWhs8pQx+KM+KIT0ohdagX6YHWE0FAIvsm2AUUVQ79bSXOsXYr09T67WWG16RApcLhXUTsMFe07LEaGlYsh1OlHkinTW2wETpHa1UacFKYyN/UNfzakepxOglZT1wcA+HlUulK/i+JczJVpd1C6kDfWT1XJ1Qeh/yb66D7bJhs+sYzHaxoGchUzkSfP1tAPAypkeiE3YLfuXpnSW1GSic4'
                                                                                                                },
                                                                                                                body: '{"campaign":2}',
                                                                                                                cookieJar
                                                                                                            }).then(completeOnboarding => {
                                                                                                                try {
                                                                                                                    if (completeOnboarding.statusCode === 200) {
                                                                                                                        return got('https://www.goat.com/api/v1/achievement_tickets/list-tickets', {
                                                                                                                            method: "POST",
                                                                                                                            agent: {
                                                                                                                                http: proxyAgent,
                                                                                                                                https: proxyAgent
                                                                                                                            },
                                                                                                                            headers: {
                                                                                                                                'content-type': 'application/x-www-form-urlencoded',
                                                                                                                                'x-px-authorization': '3',
                                                                                                                                'accept': 'application/json',
                                                                                                                                'authorization': `Token token="${authToken}"`,
                                                                                                                                'accept-language': 'en-US,en;q=0.9',
                                                                                                                                'accept-encoding': 'gzip, deflate, br',
                                                                                                                                'x-emb-st': '1700617769790',
                                                                                                                                'user-agent': 'GOAT/2.66.4 (iPhone; iOS 17.0.3; Scale/3.00) Locale/en',
                                                                                                                                'x-emb-id': embId,
                                                                                                                                'x-px-original-token': '3:a23c9bbc95c5936ff89629747f7076b06626ef8c34904ef1ad2bec13fdffa457:LkoQ0lIgtxwK9sFLOCVSyfuVaXHvJICfSdWTUy7igEFJwmQ5M0Q74pM7PpTKdMwg+jOnCTzwiXXx2DOQKH7U+g==:1000:uZtx28ZpKuPT4clx83i6YUcDxyLLCkmE93OZFE7Ky7LWhs8pQx+KM+KIT0ohdagX6YHWE0FAIvsm2AUUVQ79bSXOsXYr09T67WWG16RApcLhXUTsMFe07LEaGlYsh1OlHkinTW2wETpHa1UacFKYyN/UNfzakepxOglZT1wcA+HlUulK/i+JczJVpd1C6kDfWT1XJ1Qeh/yb66D7bJhs+sYzHaxoGchUzkSfP1tAPAypkeiE3YLfuXpnSW1GSic4'
                                                                                                                            },
                                                                                                                            body: '{"isOnboarding":true}',
                                                                                                                            cookieJar
                                                                                                                        }).then(tosCompleted => {
                                                                                                                            try {
                                                                                                                                if (tosCompleted.statusCode === 200) {
                                                                                                                                    console.log(`Task ${taskid}: Successfully Completed Account Onboarding [${tosCompleted.statusCode}]...`);
                                                                                                                                    console.log(`Task ${taskid}: Fetching Current Account Tickets [${tosCompleted.statusCode}]...`);
                                                                                                                                    return got('https://www.goat.com/api/v1/achievement_tickets/get-count', {
                                                                                                                                        method: "POST",
                                                                                                                                        agent: {
                                                                                                                                            http: proxyAgent,
                                                                                                                                            https: proxyAgent
                                                                                                                                        },
                                                                                                                                        headers: {
                                                                                                                                            'content-type': 'application/x-www-form-urlencoded',
                                                                                                                                            'x-px-authorization': '3',
                                                                                                                                            'accept': 'application/json',
                                                                                                                                            'authorization': `Token token="${authToken}"`,
                                                                                                                                            'accept-language': 'en-US,en;q=0.9',
                                                                                                                                            'accept-encoding': 'gzip, deflate, br',
                                                                                                                                            'x-emb-st': '1700618197660',
                                                                                                                                            'user-agent': 'GOAT/2.66.4 (iPhone; iOS 17.0.3; Scale/3.00) Locale/en',
                                                                                                                                            'x-emb-id': embId,
                                                                                                                                            'x-px-original-token': '3:a23c9bbc95c5936ff89629747f7076b06626ef8c34904ef1ad2bec13fdffa457:LkoQ0lIgtxwK9sFLOCVSyfuVaXHvJICfSdWTUy7igEFJwmQ5M0Q74pM7PpTKdMwg+jOnCTzwiXXx2DOQKH7U+g==:1000:uZtx28ZpKuPT4clx83i6YUcDxyLLCkmE93OZFE7Ky7LWhs8pQx+KM+KIT0ohdagX6YHWE0FAIvsm2AUUVQ79bSXOsXYr09T67WWG16RApcLhXUTsMFe07LEaGlYsh1OlHkinTW2wETpHa1UacFKYyN/UNfzakepxOglZT1wcA+HlUulK/i+JczJVpd1C6kDfWT1XJ1Qeh/yb66D7bJhs+sYzHaxoGchUzkSfP1tAPAypkeiE3YLfuXpnSW1GSic4'
                                                                                                                                        },
                                                                                                                                        body: '{"status":2}',
                                                                                                                                        cookieJar
                                                                                                                                    }).then(fetchTicketCount => {
                                                                                                                                        try {
                                                                                                                                            if (fetchTicketCount.statusCode === 200) {
                                                                                                                                                const response = JSON.parse(fetchTicketCount.body);
                                                                                                                                                const ticketCount = response.count;

                                                                                                                                                console.log(`Task ${taskid}: Success 🌙 - Sending Webhook [${fetchTicketCount.statusCode}]...`);
                                                                                                                                                let hook = new Webhook(``); // --------------- Set Webhook
                                                                                                                                                hook.setUsername('Goat Account Generator');
                                                                                                                                                hook.setAvatar('https://i.imgur.com/g3AA1G0.png');
                                                                                                                                                const success = new MessageBuilder()
                                                                                                                                                    .setTitle("Success 🌙")
                                                                                                                                                    .setColor("#5665DA")
                                                                                                                                                    .addField('**Module**', `Goat Account Generator [Local]`, false)
                                                                                                                                                    .addField('**Email**', `||${accountEmail}||`, false)
                                                                                                                                                    .addField('**Password**', `||${accountPassword}||`, false)
                                                                                                                                                    .addField('**First Name**', firstName, false)
                                                                                                                                                    .addField('**Last Name**', lastName, false)
                                                                                                                                                    .addField('**TOS Accepted**', '✅', true)
                                                                                                                                                    .addField('**Default Profile Set**', '✅', true)
                                                                                                                                                    .addField('**Ticket Count**', ticketCount, true)
                                                                                                                                                    .addField('**Proxy**', `||${proxyUsed}||`, false)
                                                                                                                                                    .setThumbnail('https://i.imgur.com/g3AA1G0.png')
                                                                                                                                                    .setFooter(`Goat Account Generator`, "https://i.imgur.com/g3AA1G0.png")
                                                                                                                                                    .setTimestamp();
                                                                                                                            
                                                                                                                                                hook.send(success);
                                                                                                                                                const fileName = path.join('accounts.txt'); // -------------- Set File Path
                                                                                                                                                fs.appendFileSync(fileName, `${accountEmail}:${accountPassword}\n`);
                                                                                                                                                                                
                                                                                                                                            
                                                                                                                                                return got('https://www.goat.com/api/v1/users/sign_out', {
                                                                                                                                                    method: "DELETE",
                                                                                                                                                    headers: {
                                                                                                                                                        'x-px-authorization': '3',
                                                                                                                                                        'accept': 'application/json',
                                                                                                                                                        'authorization': `Token token="${authToken}"`,
                                                                                                                                                        'accept-encoding': 'gzip, deflate, br',
                                                                                                                                                        'if-none-match': 'W/"c955e57777ec0d73639dca6748560d00"',
                                                                                                                                                        'x-emb-st': '1700641194642',
                                                                                                                                                        'accept-language': 'en-US,en;q=0.9',
                                                                                                                                                        'content-length': '0',
                                                                                                                                                        'user-agent': 'GOAT/2.66.4 (iPhone; iOS 17.0.3; Scale/3.00) Locale/en',
                                                                                                                                                        'x-emb-id': embId,
                                                                                                                                                        'x-px-original-token': '3:a23c9bbc95c5936ff89629747f7076b06626ef8c34904ef1ad2bec13fdffa457:LkoQ0lIgtxwK9sFLOCVSyfuVaXHvJICfSdWTUy7igEFJwmQ5M0Q74pM7PpTKdMwg+jOnCTzwiXXx2DOQKH7U+g==:1000:uZtx28ZpKuPT4clx83i6YUcDxyLLCkmE93OZFE7Ky7LWhs8pQx+KM+KIT0ohdagX6YHWE0FAIvsm2AUUVQ79bSXOsXYr09T67WWG16RApcLhXUTsMFe07LEaGlYsh1OlHkinTW2wETpHa1UacFKYyN/UNfzakepxOglZT1wcA+HlUulK/i+JczJVpd1C6kDfWT1XJ1Qeh/yb66D7bJhs+sYzHaxoGchUzkSfP1tAPAypkeiE3YLfuXpnSW1GSic4'
                                                                                                                                                      },
                                                                                                                                                      cookieJar
                                                                                                                                                })
                                                                                                                                            } else {
                                                                                                                                                console.error(`Task ${taskid}: Error Fetching Account Tickets [${fetchTicketCount.statusCode}]...`);
                                                                                                                                            }
                                                                                                                                        } catch (error) {
                                                                                                                                            if (error.response) {
                                                                                                                                                console.error('Error:', error.message);
                                                                                                                                                console.error('Response Body:', error.response.body);
                                                                                                                                            } else {
                                                                                                                                               console.error('Error:', error);
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    })
                                                                                                                                } else {
                                                                                                                                    console.error(`Task ${taskid}: Error Completing Account Setup [${tosCompleted}]...`);
                                                                                                                                }
                                                                                                                            } catch (error) {
                                                                                                                                if (error.response) {
                                                                                                                                    console.error('Error:', error.message);
                                                                                                                                    console.error('Response Body:', error.response.body);
                                                                                                                                } else {
                                                                                                                                   console.error('Error:', error);
                                                                                                                                }
                                                                                                                            }
                                                                                                                        })
                                                                                                                    } else {
                                                                                                                        console.error(`Task ${taskid}: Error Completing Account Onboarding [${completeOnboarding.statusCode}]...`);
                                                                                                                    }
                                                                                                                } catch (error) {
                                                                                                                    if (error.response) {
                                                                                                                        console.error('Error:', error.message);
                                                                                                                        console.error('Response Body:', error.response.body);
                                                                                                                    } else {
                                                                                                                       console.error('Error:', error);
                                                                                                                    }
                                                                                                                }
                                                                                                            })
                                                                                                        } else {
                                                                                                            console.error(`Task ${taskid}: Error Updating User Profile [${updateUserProfile.statusCode}]...`);
                                                                                                        }
                                                                                                    } catch (error) {
                                                                                                        if (error.response) {
                                                                                                            console.error('Error:', error.message);
                                                                                                            console.error('Response Body:', error.response.body);
                                                                                                        } else {
                                                                                                           console.error('Error:', error);
                                                                                                        }
                                                                                                    }
                                                                                                })
                                                                                            } else {
                                                                                                console.error(`Task ${taskid}: Error Accepting Terms Of Services [${acceptTOS.statusCode}]...`);
                                                                                            }
                                                                                        } catch (error) {
                                                                                            if (error.response) {
                                                                                                console.error('Error:', error.message);
                                                                                                console.error('Response Body:', error.response.body);
                                                                                            } else {
                                                                                               console.error('Error:', error);
                                                                                            }
                                                                                        }
                                                                                    })
                                                                                } catch (error) {
                                                                                    if (error.response) {
                                                                                        console.error('Error:', error.message);
                                                                                        console.error('Response Body:', error.response.body);
                                                                                    } else {
                                                                                       console.error('Error:', error);
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                console.error(`Task ${taskid}: Error Saving Default Payment [${paymentSaved.statusCode}]...`);
                                                                            }
                                                                        } catch (error) {
                                                                            if (error.response) {
                                                                                console.error('Error Saving Default Payment:', error.message);
                                                                                console.error('Response Body:', error.response.body);
                                                                            } else {
                                                                               console.error('Error:', error);
                                                                            }
                                                                        }
                                                                    }) 
                                                                } else {
                                                                    console.error(`Task ${taskid}: Failed To Fetch Address ID [${fetchAddressId.statusCode}]...`);
                                                                }
                                                            } catch (error) {
                                                                if (error.response) {
                                                                    console.error('Error Fetching Address ID:', error.message);
                                                                    console.error('Response Body:', error.response.body);
                                                                } else {
                                                                   console.error('Error:', error);
                                                                }
                                                            }
                                                        })
                                                    } else {
                                                        console.error(`Task ${taskid}: Failed To Fetch Payment Token [${fetchPaymentToken.statusCode}]...`);
                                                    }
                                                } catch (error) {
                                                    if (error.response) {
                                                        console.error('Error Fetching Payment Token:', error.message);
                                                        console.error('Response Body:', error.response.body);
                                                    } else {
                                                       console.error('Error:', error);
                                                    }
                                                }
                                            })
                                        } else {
                                            console.error(`Task ${taskid}: Failed To Set Default Billing Address [${billingAddressSubmission.statusCode}]...`);
                                        }
                                    } catch (error) {
                                        if (error.response) {
                                            console.error('Error Saving Billing Address:', error.message);
                                            console.error('Response Body:', error.response.body);
                                        } else {
                                           console.error('Error:', error);
                                        }
                                    }
                                })
                            } else {
                                console.error(`Task ${taskid}: Failed To Set Default Shipping Address [${shippingAddressSubmission.statusCode}]...`);
                            }
                        })
                    } catch (error) {
                        if (error.response) {
                             console.error('Error Saving Shipping Address:', error.message);
                            console.error('Response Body:', error.response.body);
                        } else {
                            console.error('Error:', error);
                        }
                    }
                } else {
                    console.error(`Task ${taskid}: Failed To Generate Account [${accountGeneration.statusCode}]...`);
                }
            });
        } catch (error) {
            if (error.response) {
                console.error('Error in next step:', error.message);
                console.error('Response Body:', error.response.body);
            } else {
                console.error('Error:', error);
            }
        }
    };
    console.log(`Task ${taskid}: Looping In 15s...`);
    await delay(15000);
}


const run = async () => {
    let proxiesData = fs.readFileSync(path.join('proxies.txt'), 'utf8').split('\n');
    let proxies = proxiesData.filter(line => line.trim() && !line.startsWith('#'));

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    shuffleArray(proxies);
  
    const numberOfAccounts = await inquirer.prompt({
        type: 'number',
        name: 'count',
        message: 'How many accounts do you want to generate?',
        default: 1,
        validate: input => input > 0 ? true : 'Please enter a valid number greater than 0.'
    });
    const answerEmail = await inquirer.prompt({
        type: 'confirm',
        name: 'useCatchall',
        message: 'Do you want to use catchall for emails?',
    });

    const userInput = await getUserInput();
    const cardinput = await getCardDetails();


    await accountGenerator(userInput, cardinput, numberOfAccounts, answerEmail, proxies).catch(error => {
        console.error(`An error occurred:`, error);
    });

};

module.exports.run = run;