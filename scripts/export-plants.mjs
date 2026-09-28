import fs from "fs";
import vzdyzeleneKry from "../src/data/plants/vzdyzelene_kry.js";
import popinaveRastliny from "../src/data/plants/popinave_rastliny.js";

const output = {
  vzdyzelene_kry: vzdyzeleneKry,
  popinave: popinaveRastliny
};

fs.mkdirSync("public", { recursive: true });
fs.writeFileSync("public/plants.json", JSON.stringify(output));
console.log("plants.json vygenerovaný");
