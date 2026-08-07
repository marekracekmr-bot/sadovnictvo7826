import { useState } from "react";
import plants from "../data/plants";

function Quiz({ category, goBack }) {
    const [result, setResult] = useState(null);

  const categoryPlants = plants.filter(
  (item) => item.category === category
);

function nextQuestion() {
  const newPlant =
    categoryPlants[
      Math.floor(Math.random() * categoryPlants.length)
    ];

  setPlant(newPlant);
  setResult(null);
}

const [plant, setPlant] = useState(
  categoryPlants[
    Math.floor(Math.random() * categoryPlants.length)
  ]
);

  const shuffledImages = [...plant.options].sort(
  () => Math.random() - 0.5
);

  function findPlantByImage(image) {
  return plants.find((item) =>
    item.correctImage === image
  );
}

  function checkAnswer(image) {

  const selectedPlant = plants.find(
    (item) => item.correctImage === image
  );

  setResult({
    correct: image === plant.correctImage,
    text: image === plant.correctImage 
      ? "Správne!" 
      : "Nesprávne!",
    selected: selectedPlant
  });
}

  return (
    <div className="app">

      <button className="back-button" onClick={goBack}>
      ⬅ Späť
      </button>

      <h1>🌿 Poznaj rastlinu</h1>

      <h2>🌿 Ktorá rastlina je {plant.latin}?</h2>
        <p>Vyber správny obrázok zo 4 možností.</p>

      <div className="images">
        {shuffledImages.map((image) => (
          <img
            key={image}
            src={`/plants/${image}`}
            onClick={() => checkAnswer(image)}
            alt="rastlina"
          />
        ))}
      </div>
      {result && (
  <div className="result">

    <h2>
      {result.correct ? "✅ Správne!" : "❌ Nesprávne!"}
    </h2>

    {result.correct ? (
      <div>
        <h3>{plant.name}</h3>
        <p><i>{plant.latin}</i></p>
        <p>Čeľaď: {plant.family}</p>
      </div>
    ) : (
      <div>
        <p>Klikol si na:</p>

        <h3>{result.selected.name}</h3>
        <p><i>{result.selected.latin}</i></p>
        <p>Čeľaď: {result.selected.family}</p>
      </div>
    )}
    {result && (
  <button onClick={nextQuestion}>
    ➡️ Ďalšia otázka
  </button>
)}

  </div>
)}


    </div>
  );
}

export default Quiz;