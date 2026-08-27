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

  // ČAS CELÉHO TESTU
  const [startTime, setStartTime] = useState(null);
  const [testTime, setTestTime] = useState(0);

  // false = fotografie sa automaticky menia
  // true = automatika je vypnutá a fotografie meníme kliknutím
  const [manualPhotoChange, setManualPhotoChange] =
    useState(false);


  // =========================================
  // NÁHODNÁ RASTLINA
  // =========================================

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


  // =========================================
  // MOŽNOSTI ODPOVEDÍ
  // =========================================

  function getOptions(correctPlant) {

    const wrongPlants = testPlants
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


  // =========================================
  // PRVÁ OTÁZKA
  // =========================================

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

      setPhotoIndex(0);

      setManualPhotoChange(false);

      // ZAČIATOK MERANIA ČASU
      setStartTime(Date.now());

    }

  }, [testPlants.length]);


  // =========================================
  // ČASOVAČ 15 SEKÚND
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
  // AUTOMATICKÉ MENENIE FOTOGRAFIÍ
  // =========================================

  useEffect(() => {

    if (
      !plant ||
      result ||
      finished ||
      manualPhotoChange
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
    finished,
    manualPhotoChange
  ]);


  // =========================================
  // KLIKNUTIE NA FOTOGRAFIU
  // =========================================

  function nextPhoto() {

    if (
      result ||
      finished
    ) {
      return;
    }

    const photos =
      plant.images || [];

    if (photos.length <= 1) {
      return;
    }

    // Prvý klik vypne automatické menenie.
    setManualPhotoChange(true);

    // A zároveň zmení fotografiu.
    setPhotoIndex(
      (prev) => prev + 1
    );
  }


  // =========================================
  // ODPOVEĎ
  // =========================================

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
  // ĎALŠIA OTÁZKA / VYHODNOTENIE
  // =========================================

  function nextQuestion() {

    // POSLEDNÁ OTÁZKA
    if (
      questionNumber >= totalQuestions
    ) {

      const elapsed =
        Math.floor(
          (Date.now() - startTime) / 1000
        );

      setTestTime(elapsed);

      setFinished(true);

      return;
    }


    // NÁJDEME ĎALŠIU RASTLINU

    const newPlant =
      getRandomPlant();

    if (!newPlant) {

      const elapsed =
        Math.floor(
          (Date.now() - startTime) / 1000
        );

      setTestTime(elapsed);

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

    // Pri novej otázke sa automatické
    // menenie fotografií znova zapne.
    setManualPhotoChange(false);

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

    setManualPhotoChange(false);

    setScore(0);

    setQuestionNumber(1);

    setFinished(false);

    // NOVÝ TEST = NOVÉ MERANIE ČASU
    setStartTime(Date.now());

    setTestTime(0);

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
  // VYHODNOTENIE TESTU
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


    // PREVOD SEKÚND NA MM:SS

    const minutes =
      Math.floor(testTime / 60);

    const seconds =
      testTime % 60;

    const formattedTime =
      `${String(minutes).padStart(2, "0")}:${String(
        seconds
      ).padStart(2, "0")}`;


    return (

      <div className="app">

        {/* NADPIS */}

        <h1>
          🏆 Vyhodnotenie
        </h1>


        {/* GIF RAKA */}

        <img
          src={resultGif}
          alt="Výsledok testu"
          style={{
            maxWidth: "270px",
            width: "90%",
            margin: "20px auto",
            display: "block"
          }}
        />


        {/* =================================
            TABUĽKA VÝSLEDKU
            ================================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, 1fr)",
            maxWidth: "500px",
            width: "90%",
            margin: "20px auto",
            border: "1px solid #ccc",
            borderRadius: "10px",
            overflow: "hidden",
            background: "white"
          }}
        >

          {/* OTÁZKY */}

          <div
            style={{
              padding: "10px 5px",
              textAlign: "center",
              borderRight:
                "1px solid #ccc"
            }}
          >

            <div
              style={{
                fontSize: "14px",
                marginBottom: "5px"
              }}
            >
              Otázky
            </div>

            <strong
              style={{
                fontSize: "18px"
              }}
            >
              {score} / {totalQuestions}
            </strong>

          </div>


          {/* ÚSPEŠNOSŤ */}

          <div
            style={{
              padding: "10px 5px",
              textAlign: "center",
              borderRight:
                "1px solid #ccc"
            }}
          >

            <div
              style={{
                fontSize: "14px",
                marginBottom: "5px"
              }}
            >
              Úspešnosť
            </div>

            <strong
              style={{
                fontSize: "18px"
              }}
            >
              {percentage} %
            </strong>

          </div>


          {/* ČAS */}

          <div
            style={{
              padding: "10px 5px",
              textAlign: "center"
            }}
          >

            <div
              style={{
                fontSize: "14px",
                marginBottom: "5px"
              }}
            >
              Čas
            </div>

            <strong
              style={{
                fontSize: "18px"
              }}
            >
              {formattedTime}
            </strong>

          </div>

        </div>


        {/* =================================
            TLAČIDLÁ
            ================================= */}

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
  // AKTUÁLNA FOTOGRAFIA
  // =========================================

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
        🌱 Test 2
      </h1>


      <div className="progress">

        <p>

          Otázka {questionNumber} / {totalQuestions}

          &nbsp;&nbsp;&nbsp;

          ✅ Správne: {score}

        </p>

      </div>


      {/* =====================================
          FOTOGRAFIA
          ===================================== */}

      <div
        className="quiz2-photo-wrapper"
        onClick={nextPhoto}
      >

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


            {/* POSLEDNÁ OTÁZKA = VYHODNOTENIE */}

            <button
              className="answer-next-button"
              onClick={(event) => {

                event.stopPropagation();

                nextQuestion();

              }}
            >

              {questionNumber === totalQuestions
                ? "🏆 Vyhodnotenie"
                : "➡️ Ďalšia otázka"}

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

        {options.map((option) => (

          <button
            key={option.id}

            onClick={() =>
              checkAnswer(option)
            }

            disabled={!!result}

            style={{
              width: "350px",
              maxWidth: "90%",
              fontSize: "16px",
              padding: "10px"
            }}
          >

            <i>
              {option.latin}
            </i>

            {" – "}

            {option.name}

          </button>

        ))}

      </div>

    </div>

  );

}

export default Quiz2;