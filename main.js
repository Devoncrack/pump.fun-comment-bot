import chalk from "chalk";
import comments from "./comments.json" assert { type: "json" };
import axios from "axios";
import { createWallets, signTransaction } from "./utils.js";

const API_BASE_URL = "https://client-api-2-74b1891ee9f9.herokuapp.com"; // Centralize API base URL

async function login(wallet, maxRetries = 3, retryDelay = 2000) { // Add retry parameters
    let retries = 0;
    while (retries < maxRetries) {
        try {
            const signedMessage = signTransaction(wallet.secretKeyBase58);
            const payload = {
                // ... payload
            };

            const response = await axios.post(`${API_BASE_URL}/auth/login`, payload);
            return response.data.access_token;
        } catch (error) {
            if (error.response && error.response.status === 503) { // Check for 503 error
                retries++;
                console.warn(`Login attempt failed (attempt ${retries}/${maxRetries}), retrying in ${retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            } else {
                console.error("Login failed:", error.message); // Log other errors
                throw new Error("Login failed");
            }
        }
    }
    throw new Error("Login failed after maximum retries."); // Error after retries
}

async function comment(target, commentToLeave, jwt) {
    if (!jwt) throw new Error("No JWT found, please run setup");

    try {
        const response = await axios.post(`${API_BASE_URL}/replies`, {
            mint: target,
            text: commentToLeave,
        }, {
            headers: { Authorization: `Bearer ${jwt}` },
        });
        console.log(chalk.cyan(`Commented "${commentToLeave}" on ${target} 🚀`));
        return response.data;
    } catch (error) {
        console.error("Comment failed:", error.message);
    }
}

async function leaveComments(target, amount, batchSize = 5, delayMs = 5000) {
    console.log(chalk.green(`Creating ${amount} wallets...`));
    const wallets = await createWallets(amount);
    console.log(chalk.green.bold(`Successfully created ${amount} wallets.`));

    console.log(chalk.cyan.bold("Faking pump.fun logins..."));
    const jwts = await Promise.all(wallets.map(login));
    console.log(chalk.cyan.bold("Successfully faked logins."));

    console.log(chalk.green.bold("Leaving comments..."));
    for (let i = 0; i < wallets.length; i += batchSize) {
        const batchWallets = wallets.slice(i, i + batchSize);
        const batchPromises = batchWallets.map((wallet, index) => {
            const commentIndex = i + index;
            const commentToLeave = comments[commentIndex % comments.length];
            return comment(target, commentToLeave, jwts[commentIndex]);
        });

        await Promise.all(batchPromises);

        if (i + batchSize < wallets.length) {
            console.log(chalk.cyan(`Waiting ${delayMs} milliseconds before next batch...`));
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
}


// Usage
const target = "EcdLN8PnBUWFDg9G1S8Q2HzYWHML9CL1HodaqJjApump";
const amount = 5;
const batchSize = 5;
const delayMs = 5000;

leaveComments(target, amount, batchSize, delayMs);
