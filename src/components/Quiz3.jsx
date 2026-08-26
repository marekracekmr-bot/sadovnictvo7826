import { useState, useEffect } from "react";
import plants from "../data/plants";

function Quiz3({ category, testLimit, goBack }) {

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
      Math.floor(
        Math.random() * availablePlants.length
      )
    ];
  }

  function getSpeciesName(latin) {

    const parts = latin.trim().split(/\s+/);

    return parts.length >= 2
      ? parts[1]
      : parts[0];
  }

  function getGenusName(latin) {

    const parts = latin.trim().split(/\s+/);

    return parts[0];
  }

  function getOptions(correctPlant) {

    const correctSpecies =
      getSpeciesName(correctPlant.latin);

    const wrongPlants = testPlants
      .filter(
        (p) => p.id !== correctPlant.id
      )
      .filter(
        (p) =>
          getSpeciesName(p.latin) !== correctSpecies
      )
      .sort(
        () => Math.random() - 0.5
      )
      .slice(0, 3);

    return [
      correctSpecies,
      ...wrongPlants.map(
        (p) => getSpeciesName(p.latin)
      )
    ].sort(
      () => Math.random() - 0.5
    );
  }

  useEffect(() => {

    if (
      testPlants.length > 0 &&
      !plant
    ) {

      const firstPlant =
        getRandomPlant([]);

      setPlant(firstPlant);

      setUsedPlants([
        firstPlant.id
      ]);

      setOptions(
        getOptions(firstPlant)
      );
    }

  }, [testPlants.length]);


  // =========================================
  // ČASOVAČ
  // =========================================

  useEffect(() => {

    if (
      !plant ||
      result ||
      finished
    ) {
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

    return () =>
      clearInterval(timer);

  }, [
    plant,
    questionNumber,
    result,
    finished
  ]);


  // =========================================
  // MENENIE FOTOGRAFIE
  // =========================================

  useEffect(() => {

    if (
      !plant ||
      result ||
      finished
    ) {
      return;
    }

    setPhotoIndex(0);

    const interval = setInterval(() => {

      setPhotoIndex(
        (prev) => prev + 1
      );

    }, 2000);

    return () =>
      clearInterval(interval);

  }, [
    plant,
    result,
    finished
  ]);


  // =========================================
  // KONTROLA ODPOVEDE
  // =========================================

  function checkAnswer(selectedSpecies) {

    if (result) {
      return;
    }

    const correctSpecies =
      getSpeciesName(plant.latin);

    const correct =
      selectedSpecies === correctSpecies;

    if (correct) {

      setScore(
        (prev) => prev + 1
      );

    }

    setResult({

      correct: correct,

      selected: selectedSpecies,

      timeout: false

    });

  }


  // =========================================
  // ČAS VYPRŠAL
  // =========================================

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


  // =========================================
  // ĎALŠIA OTÁZKA
  // =========================================

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

    setOptions(
      getOptions(newPlant)
    );

    setResult(null);

    setTimeLeft(15);

    setPhotoIndex(0);

    setQuestionNumber(
      (prev) => prev + 1
    );

  }


  // =========================================
  // NOVÝ TEST
  // =========================================

  function restartTest() {

    const firstPlant =
      getRandomPlant([]);

    if (!firstPlant) {
      return;
    }

    setUsedPlants([
      firstPlant.id
    ]);

    setPlant(firstPlant);

    setOptions(
      getOptions(firstPlant)
    );

    setResult(null);

    setTimeLeft(15);

    setPhotoIndex(0);

    setScore(0);

    setQuestionNumber(1);

    setFinished(false);

  }


  // =========================================
  // KONTROLY
  // =========================================

  if (testPlants.length === 0) {

    return (
      <div className="app">

        <p>
          V tejto kategórii nie sú rastliny.
        </p>

      </div>
    );

  }

  if (!plant) {

    return (
      <div className="app">

        <p>
          Načítavam...
        </p>

      </div>
    );

  }


  // =========================================
  // KONIEC TESTU
  // =========================================

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
          🌿 Test 3 dokončený
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


  // =========================================
  // FOTOGRAFIA
  // =========================================

  const genus =
    getGenusName(plant.latin);

  const photos =
    plant.images || [];

  const currentPhoto =
    photos.length > 0
      ? photos[
          photoIndex %
          photos.length
        ]
      : null;


  // =========================================
  // HLAVNÁ STRÁNKA
  // =========================================

  return (

    <div className="app">

      <button
        className="back-button"
        onClick={goBack}
      >
        ⬅ Späť
      </button>


      <h1>
        🌱 Test 3
      </h1>


      <div className="progress">

        <p>

          Otázka {questionNumber} / {totalQuestions}

          &nbsp;&nbsp;&nbsp;

          ✅ Správne: {score}

        </p>

      </div>


      <h2>
        {genus}
      </h2>


      {/* =====================================
          FOTOGRAFIA + VÝSLEDOK
          ===================================== */}

      <div className="quiz2-photo-wrapper">

        {currentPhoto && (

          <img
            className="quiz2-photo"
            src={`/plants/${currentPhoto}`}
            alt={plant.name}
          />

        )}


        {/* ===================================
            VÝSLEDOK CEZ FOTOGRAFIU
            =================================== */}

        {result && (

          <div
            key={
              result.timeout
                ? "timeout"
                : result.correct
                ? "correct"
                : "incorrect"
            }

            className={`quiz2-answer-overlay ${
              result.timeout
                ? "timeout"
                : result.correct
                ? "correct"
                : "incorrect"
            }`}
          >

            <div className="answer-title">

              {result.timeout
                ? "ČAS VYPRŠAL!"
                : result.correct
                ? "SPRÁVNE!"
                : "NESPRÁVNE!"}

            </div>


            <div className="answer-info">

              <div>
                Správna odpoveď:
              </div>

              <div className="answer-latin">

                <i>
                  {plant.latin}
                </i>

              </div>

              <div className="answer-name">

                {plant.name}

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


      {/* =====================================
          OTÁZKA + ČAS
          ===================================== */}

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
          Vyber druhové meno
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


      {/* =====================================
          ODPOVEDE
          ===================================== */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
          marginTop: "20px"
        }}
      >

        {options.map((option) => {

          const correctSpecies =
            getSpeciesName(plant.latin);

          let buttonStyle = {

            width: "350px",

            maxWidth: "90%",

            fontSize: "18px",

            padding: "10px"

          };


          if (result) {

            if (
              option === correctSpecies
            ) {

              buttonStyle = {

                ...buttonStyle,

                backgroundColor:
                  "#90ee90"

              };

            } else if (
              option === result.selected
            ) {

              buttonStyle = {

                ...buttonStyle,

                backgroundColor:
                  "#ff9999"

              };

            }

          }


          return (

            <button
              key={option}

              onClick={() =>
                checkAnswer(option)
              }

              disabled={!!result}

              style={buttonStyle}
            >

              <i>
                {option}
              </i>

            </button>

          );

        })}

      </div>

    </div>

  );

}

export default Quiz3;