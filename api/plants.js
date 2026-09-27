import vzdyzeleneKry from "../src/data/plants/vzdyzelene_kry.js";
import popinaveRastliny from "../src/data/plants/popinave_rastliny.js";
import buriny from "../src/data/plants/buriny.js";
import ihlicnany from "../src/data/plants/ihlicnany.js";
import opadaveStromy from "../src/data/plants/opadave_stromy.js";

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const allPlants = [
    ...vzdyzeleneKry,
    ...popinaveRastliny,
    ...buriny,
    ...ihlicnany,
    ...opadaveStromy
  ];

  res.status(200).json({ plants: allPlants });
}