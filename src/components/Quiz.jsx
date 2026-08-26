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
  const [photoIndex, setPhotoIndex] = useState(0);

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
      Math.floor(
        Math.random() * availablePlants.length
      )
    ];
  }

  useEffect(() => {

    if (testPlants.length > 0 && !plant) {

      const firstPlant =
        getRandomPlant([]);

      setPlant(firstPlant);

      setUsedPlants([
        firstPlant.id
      ]);
    }

  }, [testPlants.length]);

  useEffect(() => {

    if (plant) {

      createOptions(plant);
      setPhotoIndex(0);

    }

  }, [plant]);

  // Automatické menenie fotografií každé 2 sekundy.
  // Po odpovedi sa zastavia.

  useEffect(() => {

    if (
      !plant ||
      options.length === 0 ||
      result
    ) {
      return;
    }

    const interval = setInterval(() => {

      setPhotoIndex(
        (prev) => prev + 1
      );

    }, 2000);

    return () =>
      clearInterval(interval);

  }, [plant, options, result]);

  function getOptions(correctPlant) {

    const wrongPlants =
      testPlants
        .filter(
          (p) => p.id !== correctPlant.id
        )
        .sort(
          () => Math.random() - 0.5
        )
        .slice(0, 3);

    return [
      correctPlant,
      ...wrongPlants
    ].sort(
      () => Math.random() - 0.5
    );
  }

  function createOptions(newPlant) {

    setOptions(
      getOptions(newPlant)
    );

  }

  function checkAnswer(selectedPlant) {

    if (result) {
      return;
    }

    const correct =
      selectedPlant.id === plant.id;

    if (correct) {

      setScore(
        (prev) => prev + 1
      );

    }

    setResult({

      correct: correct,

      selected: selectedPlant,

    });

  }

  function nextQuestion() {

    if (
      questionNumber >= totalQuestions
    ) {

      setFinished(true);

      return;
    }

    const newPlant =
      getRandomPlant();

    if (!newPlant) {
      setFinished(true);
      return;
    }

    setUsedPlants(
      (prev) => [
        ...prev,
        newPlant.id
      ]
    );

    setPlant(newPlant);

    setResult(null);

    setPhotoIndex(0);

    setQuestionNumber(
      (prev) => prev + 1
    );

  }

  function restartTest() {

    const firstPlant =
      getRandomPlant([]);

    setUsedPlants([
      firstPlant.id
    ]);

    setPlant(firstPlant);

    setResult(null);

    setPhotoIndex(0);

    setScore(0);

    setQuestionNumber(1);

    setFinished(false);

  }

  if (testPlants.length === 0) {

    return (
      <div>
        V tejto kategórii nie sú rastliny.
      </div>
    );

  }

  if (!plant) {

    return (
      <div>
        Načítavam...
      </div>
    );

  }

  if (finished) {

    const percentage =
      Math.round(
        (score / totalQuestions) * 100
      );

    let resultGif;

    if (percentage === 100) {

      resultGif =
        "/gifs/test100.gif";

    } else if (percentage >= 61) {

      resultGif =
        "/gifs/testdo99.gif";

    } else if (percentage >= 26) {

      resultGif =
        "/gifs/testdo60.gif";

    } else {

      resultGif =
        "/gifs/testdo25.gif";

    }

    return (

      <div className="app">

        <h1>
          🌿 Test dokončený
        </h1>

        <h2>
          Výsledok: {score} / {totalQuestions}
        </h2>

        <h3>
          Úspešnosť: {percentage} %
        </h3>

        <img
          src={resultGif}
          alt="Výsledok testu"
          style={{
            maxWidth: "300px",
            width: "100%",
            margin: "20px auto",
            display: "block"
          }}
        />

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

      <h1>
        🌿 Poznaj rastlinu
      </h1>

      <div className="progress">

        <p>

          Otázka {questionNumber} / {totalQuestions}

          &nbsp;&nbsp;&nbsp;

          ✅ Správne: {score}

        </p>

      </div>

      <h2>

        Ktorá rastlina je{" "}

        <i>
          {plant.latin}
        </i>?

      </h2>

      <p>
        Vyber správny obrázok.
      </p>


      {/* ================================
          FOTOGRAFIE + VÝSLEDOK
          ================================ */}

      <div className="images">

        {options.map((option) => {

          const photos =
            option.images || [];

          if (
            photos.length === 0
          ) {
            return null;
          }

          const currentPhoto =
            photos[
              photoIndex %
              photos.length
            ];

          const isSelected =
            result &&
            result.selected.id ===
              option.id;

          const isCorrectPlant =
            option.id === plant.id;

          return (

            <div
              className="quiz-image-wrapper"
              key={option.id}
            >

              <img
                src={`/plants/${currentPhoto}`}
                alt={option.name}

                className={
                  result
                    ? isSelected
                      ? result.correct
                        ? "correct-image"
                        : "wrong-image"
                      : isCorrectPlant
                        ? "correct-image"
                        : "disabled-image"
                    : ""
                }

                onClick={() =>
                  !result &&
                  checkAnswer(option)
                }

              />

            </div>

          );

        })}


        {/* ================================
            TEXT CEZ VŠETKY FOTOGRAFIE
            ================================ */}

        {result && (

          <div
            key={
              result.correct
                ? "correct"
                : "incorrect"
            }

            className={`answer-overlay ${
              result.correct
                ? "correct"
                : "incorrect"
            }`}
          >

            <div className="answer-title">

              {result.correct
                ? "SPRÁVNE!"
                : "NESPRÁVNE!"}

            </div>


            <div className="answer-info">

              <div>
                Klikol si na:
              </div>

              <div className="answer-latin">

                <i>
                  {result.selected.latin}
                </i>

              </div>

            </div>


            <button
              className="answer-next-button"
              onClick={nextQuestion}
            >
              ➡️ Ďalšia otázka
            </button>

          </div>

        )}

      </div>

    </div>

  );

}

export default Quiz;