import { useState, useEffect } from "react";
import plants from "../data/plants";

function Quiz2({ category, testLimit, goBack }) {

  const categoryPlants = plants.filter(
    (plant) => plant.category === category
  );

  const testPlants = categoryPlants.slice(
    0,
    testLimit
  );

  const totalQuestions = Math.min(
    testLimit,
    categoryPlants.length
  );

  const [plant, setPlant] = useState(null);
  const [options, setOptions] = useState([]);
  const [usedPlants, setUsedPlants] = useState([]);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState(null);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [photoIndex, setPhotoIndex] = useState(0);

  function getRandomPlant(currentUsed = usedPlants) {

    const availablePlants = testPlants.filter(
      (plant) => !currentUsed.includes(plant.id)
    );

    if (availablePlants.length === 0) {
      return null;
    }

    return availablePlants[
      Math.floor(Math.random() * availablePlants.length)
    ];
  }

  function getOptions(correctPlant) {

    const wrongPlants = testPlants
      .filter((p) => p.id !== correctPlant.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    return [
      correctPlant,
      ...wrongPlants
    ].sort(() => Math.random() - 0.5);
  }

  useEffect(() => {

    if (testPlants.length > 0 && !plant) {

      const firstPlant = getRandomPlant([]);

      setPlant(firstPlant);

      setUsedPlants([
        firstPlant.id
      ]);

      setOptions(getOptions(firstPlant));
    }

  }, [testPlants.length]);

  // Časovač 15 sekúnd
  useEffect(() => {

    if (!plant || result || finished) {
      return;
    }

    setTimeLeft(15);

    const timer = setInterval(() => {

      setTimeLeft((prev) => {

        if (prev <= 1) {
          clearInterval(timer);

          handleTimeOut();

          return 0;
        }

        return prev - 1;
      });

    }, 1000);

    return () => clearInterval(timer);

  }, [plant, questionNumber, result, finished]);

  // Automatická zmena fotografie každé 2 sekundy
  useEffect(() => {

    if (!plant || result || finished) {
      return;
    }

    setPhotoIndex(0);

    const interval = setInterval(() => {

      setPhotoIndex((prev) => prev + 1);

    }, 2000);

    return () => clearInterval(interval);

  }, [plant, result, finished]);

  function checkAnswer(selectedPlant) {

    if (result) {
      return;
    }

    const correct =
      selectedPlant.id === plant.id;

    if (correct) {
      setScore((prev) => prev + 1);
    }

    setResult({
      correct: correct,
      selected: selectedPlant
    });
  }

  function handleTimeOut() {

    if (result) {
      return;
    }

    setResult({
      correct: false,
      selected: null,
      timeout: true
    });
  }

  function nextQuestion() {

    if (questionNumber >= totalQuestions) {

      setFinished(true);
      return;
    }

    const newPlant = getRandomPlant();

    setUsedPlants((prev) => [
      ...prev,
      newPlant.id
    ]);

    setPlant(newPlant);
    setOptions(getOptions(newPlant));
    setResult(null);
    setTimeLeft(15);
    setPhotoIndex(0);

    setQuestionNumber((prev) => prev + 1);
  }

  if (testPlants.length === 0) {
    return (
      <div className="app">
        <p>V tejto kategórii nie sú rastliny.</p>
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="app">
        <p>Načítavam...</p>
      </div>
    );
  }

  if (finished) {

    return (
      <div className="app">

        <h1>🌿 Test 2 dokončený</h1>

        <h2>
          Výsledok: {score} / {totalQuestions}
        </h2>

        <h3>
          Úspešnosť:{" "}
          {Math.round(
            (score / totalQuestions) * 100
          )} %
        </h3>

        <button onClick={goBack}>
          ⬅ Späť
        </button>

      </div>
    );
  }

  // Fotografie aktuálnej rastliny
  const photos = plant.images || [];

  const currentPhoto =
    photos.length > 0
      ? photos[photoIndex % photos.length]
      : null;

  return (
    <div className="app">

      <button
        className="back-button"
        onClick={goBack}
      >
        ⬅ Späť
      </button>

      <h1>🌱 Test 2</h1>

      <div className="progress">

        <p>
          Otázka {questionNumber} / {totalQuestions}
          &nbsp;&nbsp;&nbsp;
          ✅ Správne: {score}
        </p>

      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "25px",
          flexWrap: "wrap"
        }}
      >

        {currentPhoto && (
          <img
            src={`/plants/${currentPhoto}`}
            alt={plant.name}
            style={{
              width: "400px",
              maxWidth: "90%",
              borderRadius: "15px"
            }}
          />
        )}

      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "20px",
          marginTop: "15px"
        }}
      >

        <h2 style={{ margin: 0 }}>
          Urči rastlinu
        </h2>

        <div
          style={{
            fontSize: "30px",
            fontWeight: "bold"
          }}
        >
          ⏱️ {timeLeft}
        </div>

      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
          marginTop: "20px"
        }}
      >

        {options.map((option) => (

          <button
            key={option.id}
            onClick={() => checkAnswer(option)}
            disabled={!!result}
            style={{
              width: "350px",
              maxWidth: "90%",
              fontSize: "16px",
              padding: "10px"
            }}
          >
            <i>{option.latin}</i> – {option.name}
          </button>

        ))}

      </div>

      {result && (

        <div className="result">

          <h2>
            {result.timeout
              ? "⏰ Čas vypršal!"
              : result.correct
              ? "✅ Správne!"
              : "❌ Nesprávne!"}
          </h2>

          <p>
            Správna odpoveď:
          </p>

          <h3>
            <i>{plant.latin}</i>
          </h3>

          <p>
            {plant.name}
          </p>

          <p>
            Čeľaď: {plant.family}
          </p>

          <button onClick={nextQuestion}>
            ➡️ Ďalšia otázka
          </button>

        </div>

      )}

    </div>
  );
}

export default Quiz2;