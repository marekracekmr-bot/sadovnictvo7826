import { useState, useEffect } from "react";
import plants from "../data/plants";
import Quiz2 from "./Quiz2";
import Quiz3 from "./Quiz3";

function Quiz({ category, testType, testLimit, goBack }) {

  if (testType === 2) {
  return (
    <Quiz2
      category={category}
      testLimit={testLimit}
      goBack={goBack}
    />
  );
}

if (testType === 3) {
  return (
    <Quiz3
      category={category}
      testLimit={testLimit}
      goBack={goBack}
    />
  );
}

  const [plant, setPlant] = useState(null);
  const [result, setResult] = useState(null);
  const [options, setOptions] = useState([]);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [usedPlants, setUsedPlants] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);

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

useEffect(() => {
  if (testPlants.length > 0 && !plant) {
    const firstPlant = getRandomPlant([]);

    setPlant(firstPlant);

    setUsedPlants([
      firstPlant.id
    ]);
  }
}, [testPlants.length]);
  

  useEffect(() => {

    if (plant) {
      createOptions(plant);
    }

  }, [plant]);

  useEffect(() => {

  if (!plant) return;

  const interval = setInterval(() => {
    setShowDetails(prev => !prev);
  }, 2000);

  return () => clearInterval(interval);

}, [plant]);

  function getOptions(correctPlant) {

    const wrongPlants = testPlants
      .filter((p) => p.image !== correctPlant.image)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);


    return [
      correctPlant,
      ...wrongPlants
    ].sort(() => Math.random() - 0.5);

  }


  function createOptions(newPlant) {
    setOptions(getOptions(newPlant));
  }


  function checkAnswer(selectedPlant) {

  if (result) {
    return;
  }

  const correct =
    selectedPlant.image === plant.image;

  if (correct) {
    setScore((prev) => prev + 1);
  }

  setResult({
    correct: correct,
    selected: selectedPlant,
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
    setResult(null);
    setQuestionNumber((prev) => prev + 1);

  }


  function restartTest() {

    const firstPlant = getRandomPlant([]);


    setUsedPlants([
      firstPlant.id
    ]);

    setPlant(firstPlant);
    setResult(null);
    setScore(0);
    setQuestionNumber(1);
    setFinished(false);

  }


  if (testPlants.length === 0) {
    return <div>V tejto kategórii nie sú rastliny.</div>;
  }

  

  if (!plant) {
    return <div>Načítavam...</div>;
  }


  if (finished) {

    return (

      <div className="app">

        <h1>🌿 Test dokončený</h1>

        <h2>
          Výsledok: {score} / {totalQuestions}
        </h2>

        <h3>
          Úspešnosť: {Math.round((score / totalQuestions) * 100)} %
        </h3>


        <button onClick={goBack}>
          ⬅ Späť na kategórie
        </button>


        <button onClick={restartTest}>
          🔄 Nový test
        </button>


      </div>

    );

  }


  return (

    <div className="app">

      <button
        className="back-button"
        onClick={goBack}
      >
        ⬅ Späť
      </button>


      <h1>🌿 Poznaj rastlinu</h1>


      <div className="progress">

  <p>
    Otázka {questionNumber} / {totalQuestions}
    &nbsp;&nbsp;&nbsp;
    ✅ Správne: {score}
  </p>

      </div>


      <h2>
        Ktorá rastlina je <i>{plant.latin}</i>?
      </h2>


      <p>
        Vyber správny obrázok.
      </p>


      <div className="images">

        {options.map((option) => (

          <img
  key={option.id}
  src={`/plants/${
  showDetails && option.detailImage
    ? option.detailImage
    : option.image
}`}
  alt={option.name}

  className={
  result
    ? result.selected.image === option.image
      ? result.correct
        ? "correct-image"
        : "wrong-image"
      : option.image === plant.image
        ? "correct-image"
        : "disabled-image"
    : ""
}

  onClick={() => !result && checkAnswer(option)}
/>

        ))}

      </div>


      {result && (

        <div className="result">

          <h2>
            {result.correct
              ? "✅ Správne!"
              : "❌ Nesprávne!"}
          </h2>


          <p>
            Klikol si na:
          </p>


          <h3>
            <i>{result.selected.latin}</i>
          </h3>


          <p>
            {result.selected.name}
          </p>


          <p>
            Čeľaď: {result.selected.family}
          </p>


          <button onClick={nextQuestion}>
            ➡️ Ďalšia otázka
          </button>


        </div>

      )}

    </div>

  );

}

export default Quiz;