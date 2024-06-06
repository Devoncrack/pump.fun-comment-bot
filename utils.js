import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";

const textEncoder = new TextEncoder();

export function signTransaction(privateKeyBase58) {
    const keypair = Keypair.fromSecretKey(bs58.decode(privateKeyBase58));
    const message = textEncoder.encode(`Sign in to pump.fun: ${Date.now()}`);
    const signature = nacl.sign.detached(message, keypair.secretKey);
    return bs58.encode(signature);
}

function createWallet() {
    const keypair = Keypair.generate();
    return {
        publicKey: keypair.publicKey.toBase58(),
        secretKeyBase58: bs58.encode(keypair.secretKey),
    };
}

export async function createWallets(amount) {
    return Promise.all(Array.from({ length: amount }, createWallet));
}
