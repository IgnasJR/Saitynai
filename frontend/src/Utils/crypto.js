import CryptoJS from "crypto-js";
import forge from "node-forge";

const hashPassword = (username, password) => {
  var algo = CryptoJS.algo.SHA256.create();
  algo.update(password, "utf-8");
  algo.update(CryptoJS.SHA256(username), "utf-8");
  return algo.finalize().toString(CryptoJS.enc.Base64);
};

const encryptKey = (message, publicKey) => {
  try {
    const publicKeyObj = forge.pki.publicKeyFromPem(publicKey);
    const encrypted = forge.util.encode64(
      publicKeyObj.encrypt(message, "RSA-OAEP", {
        md: forge.md.sha256.create(),
      })
    );
    return encrypted;
  } catch (error) {
    console.log(error);
  }
};

const decryptKey = (message, privateKey) => {
  const privateKeyObj = forge.pki.privateKeyFromPem(privateKey);
  const decrypted = privateKeyObj.decrypt(
    forge.util.decode64(message),
    "RSA-OAEP",
    {
      md: forge.md.sha256.create(),
    }
  );
  return decrypted;
};

const decryptPrivateKey = (privateKey, password) => {
  try {
    const decryptedPrivateKey = CryptoJS.AES.decrypt(
      privateKey,
      password
    ).toString(CryptoJS.enc.Utf8);
    return decryptedPrivateKey;
  } catch (error) {
    return Error("Unable to decrypt password");
  }
};

const generateAESkey = () => {
  const randomKey = CryptoJS.lib.WordArray.random(32);
  const hexKey = randomKey.toString(CryptoJS.enc.Hex);
  return hexKey;
};

const encryptMessage = (message, aesKey) => {
  if (!aesKey) {
    throw new Error("AES key is required for encryption");
  }
  const encrypted = CryptoJS.AES.encrypt(message, aesKey).toString();
  return encrypted;
};

const decryptMessage = (encrypted, aesKey) => {
  if (!aesKey) {
    throw new Error("AES key is required for decryption");
  }
  const bytes = CryptoJS.AES.decrypt(encrypted, aesKey);
  const plain = bytes.toString(CryptoJS.enc.Utf8);
  return plain;
};

const crypto = {
  hashPassword,
  encryptKey,
  decryptKey,
  decryptPrivateKey,
  generateAESkey,
  decryptMessage,
  encryptMessage,
};
export default crypto;
