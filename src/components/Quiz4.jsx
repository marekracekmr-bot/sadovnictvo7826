import { useState, useEffect, useRef } from "react";
import plants from "../data/plants";

function Quiz4({ category, testLimit, goBack }) {

  const categories = [
    {
      name: "Vždyzelené listnaté kry",
      value: "vzdyzelene_kry",
      icon: "🌿"
    },
    {
      name: "Popínavé rastliny",
      value: "popinave",
      icon: "🌱"
    },
    {
      name: "Ihličnany",
      value: "ihlicnany",
      icon: "🌲"
    },
    {
      name: "Opadavé listnaté stromy",
      value: "opadave_stromy",
      icon: "🌳"
    }
  ];

  // =========================================
  // RASTLINY
  // =========================================

  const categoryPlants = plants.filter(
    (plant) =>
      plant.category === category
  );

  const otherPlants = plants.filter(
    (plant) =>
      plant.category !== category &&
      categories.some(
        (item) =>
          item.value === plant.category
      )
  );

  const totalQuestions = Math.min(
    Number(testLimit),
    categoryPlants.length
  );

  const selectedCategory =
    categories.find(
      (item) =>
        item.value === category
    );


  // =========================================
  // STAVY
  // =========================================

  const [plant, setPlant] =
    useState(null);

  const [options, setOptions] =
    useState([]);

  const [usedPlants, setUsedPlants] =
    useState([]);

  const [questionNumber, setQuestionNumber] =
    useState(1);

  const [score, setScore] =
    useState(0);

  const [result, setResult] =
    useState(null);

  const [finished, setFinished] =
    useState(false);

  const [photoIndex, setPhotoIndex] =
    useState(0);

  // Čas začiatku testu
  const startTimeRef =
    useRef(null);

  // Celkový čas testu v sekundách
  const [testTime, setTestTime] =
    useState(0);


  // =========================================
  // NÁHODNÁ RASTLINA Z HĽADANEJ KATEGÓRIE
  // =========================================

  function getRandomPlant(
    currentUsed = usedPlants
  ) {

    const availablePlants =
      categoryPlants.filter(
        (plant) =>
          !currentUsed.includes(
            plant.id
          )
      );

    if (
      availablePlants.length === 0
    ) {
      return null;
    }

    return availablePlants[
      Math.floor(
        Math.random() *
        availablePlants.length
      )
    ];
  }


  // =========================================
  // 3 NESPRÁVNE RASTLINY
  // =========================================

  function getWrongPlants() {

    const shuffled =
      [...otherPlants].sort(
        () =>
          Math.random() - 0.5
      );

    return shuffled.slice(
      0,
      3
    );
  }


  // =========================================
  // VYTVORENIE 4 MOŽNOSTÍ
  // =========================================

  function createOptions(
    correctPlant
  ) {

    const wrongPlants =
      getWrongPlants();

    const allOptions = [
      correctPlant,
      ...wrongPlants
    ];

    return allOptions.sort(
      () =>
        Math.random() - 0.5
    );
  }


  // =========================================
  // PRVÁ OTÁZKA
  // =========================================

  useEffect(() => {

    if (
      categoryPlants.length > 0 &&
      !plant
    ) {

      startTimeRef.current =
        Date.now();

      const firstPlant =
        getRandomPlant([]);

      if (!firstPlant) {
        return;
      }

      setPlant(
        firstPlant
      );

      setUsedPlants([
        firstPlant.id
      ]);

      setOptions(
        createOptions(
          firstPlant
        )
      );

      setPhotoIndex(0);

    }

  }, [
    category,
    categoryPlants.length
  ]);


  // =========================================
  // AUTOMATICKÉ MENENIE FOTOGRAFIÍ
  // =========================================

  useEffect(() => {

    if (
      !plant ||
      result ||
      finished
    ) {
      return;
    }

    const interval =
      setInterval(() => {

        setPhotoIndex(
          (prev) =>
            prev + 1
        );

      }, 2000);

    return () =>
      clearInterval(
        interval
      );

  }, [
    plant,
    result,
    finished
  ]);


  // =========================================
  // ODPOVEĎ
  // =========================================

  function checkAnswer(
    selectedPlant
  ) {

    if (result) {
      return;
    }

    const correct =
      selectedPlant.id ===
      plant.id;

    if (correct) {

      setScore(
        (prev) =>
          prev + 1
      );

    }

    setResult({

      correct:
        correct,

      selected:
        selectedPlant

    });

  }


  // =========================================
  // VÝPOČET ČASU
  // =========================================

  function calculateTestTime() {

    if (
      !startTimeRef.current
    ) {
      return 0;
    }

    return Math.floor(
      (
        Date.now() -
        startTimeRef.current
      ) / 1000
    );

  }


  // =========================================
  // ĎALŠIA OTÁZKA
  // =========================================

  function nextQuestion() {

    // =====================================
    // POSLEDNÁ OTÁZKA
    // =====================================

    if (
      questionNumber >=
      totalQuestions
    ) {

      const elapsed =
        calculateTestTime();

      setTestTime(
        elapsed
      );

      setFinished(
        true
      );

      return;
    }


    // =====================================
    // NOVÁ OTÁZKA
    // =====================================

    const newPlant =
      getRandomPlant();

    if (!newPlant) {

      const elapsed =
        calculateTestTime();

      setTestTime(
        elapsed
      );

      setFinished(
        true
      );

      return;
    }


    setUsedPlants(
      (prev) => [
        ...prev,
        newPlant.id
      ]
    );


    setPlant(
      newPlant
    );


    setOptions(
      createOptions(
        newPlant
      )
    );


    setResult(
      null
    );


    setPhotoIndex(
      0
    );


    setQuestionNumber(
      (prev) =>
        prev + 1
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

    // Nový začiatok času
    startTimeRef.current =
      Date.now();

    setTestTime(
      0
    );

    setPlant(
      firstPlant
    );

    setUsedPlants([
      firstPlant.id
    ]);

    setOptions(
      createOptions(
        firstPlant
      )
    );

    setResult(
      null
    );

    setPhotoIndex(
      0
    );

    setScore(
      0
    );

    setQuestionNumber(
      1
    );

    setFinished(
      false
    );

  }


  // =========================================
  // KONTROLA KATEGÓRIE
  // =========================================

  if (
    categoryPlants.length === 0
  ) {

    return (

      <div className="app">

        <p>
          V tejto kategórii nie sú
          rastliny.
        </p>

        <button
          onClick={goBack}
        >
          ⬅ Späť
        </button>

      </div>

    );

  }


  // =========================================
  // KONTROLA NESPRÁVNYCH RASTLÍN
  // =========================================

  if (
    otherPlants.length < 3
  ) {

    return (

      <div className="app">

        <p>
          Na vytvorenie Testu 4
          nie je dostatok rastlín
          v ostatných kategóriách.
        </p>

        <button
          onClick={goBack}
        >
          ⬅ Späť
        </button>

      </div>

    );

  }


  // =========================================
  // NAČÍTAVANIE
  // =========================================

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
  // VYHODNOTENIE
  // =========================================

  if (finished) {

    const percentage =
      totalQuestions > 0
        ? Math.round(
            (score /
              totalQuestions) *
            100
          )
        : 0;


    let resultGif;


    if (
      percentage === 100
    ) {

      resultGif =
        "/gifs/test100.gif";

    } else if (
      percentage >= 61
    ) {

      resultGif =
        "/gifs/testdo99.gif";

    } else if (
      percentage >= 26
    ) {

      resultGif =
        "/gifs/testdo60.gif";

    } else {

      resultGif =
        "/gifs/testdo25.gif";

    }


    // =====================================
    // ČAS MM:SS
    // =====================================

    const minutes =
      Math.floor(
        testTime / 60
      );

    const seconds =
      testTime % 60;

    const formattedTime =
      String(minutes).padStart(
        2,
        "0"
      ) +
      ":" +
      String(seconds).padStart(
        2,
        "0"
      );


    return (

      <div className="app">

        <h1>
          🌿 Vyhodnotenie
        </h1>


        {/* =================================
            GIF
            ================================= */}

        <img
          src={resultGif}
          alt="Výsledok testu"
          style={{
            maxWidth:
              "270px",
            width:
              "90%",
            margin:
              "20px auto",
            display:
              "block"
          }}
        />


        {/* =================================
            TABUĽKA
            ================================= */}

        <table
          style={{
            margin:
              "20px auto",
            borderCollapse:
              "collapse",
            width:
              "90%",
            maxWidth:
              "500px",
            textAlign:
              "center"
          }}
        >

          <thead>

            <tr>

              <th
                style={{
                  border:
                    "1px solid #ccc",
                  padding:
                    "8px"
                }}
              >
                Otázky
              </th>

              <th
                style={{
                  border:
                    "1px solid #ccc",
                  padding:
                    "8px"
                }}
              >
                Úspešnosť
              </th>

              <th
                style={{
                  border:
                    "1px solid #ccc",
                  padding:
                    "8px"
                }}
              >
                Čas
              </th>

            </tr>

          </thead>


          <tbody>

            <tr>

              <td
                style={{
                  border:
                    "1px solid #ccc",
                  padding:
                    "8px",
                  fontSize:
                    "18px"
                }}
              >
                {score} /{" "}
                {totalQuestions}
              </td>


              <td
                style={{
                  border:
                    "1px solid #ccc",
                  padding:
                    "8px",
                  fontSize:
                    "18px"
                }}
              >
                {percentage} %
              </td>


              <td
                style={{
                  border:
                    "1px solid #ccc",
                  padding:
                    "8px",
                  fontSize:
                    "18px"
                }}
              >
                {formattedTime}
              </td>

            </tr>

          </tbody>

        </table>


        {/* =================================
            TLAČIDLÁ
            ================================= */}

        <button
          onClick={goBack}
        >
          ⬅ Späť na kategórie
        </button>


        <button
          onClick={restartTest}
        >
          🔄 Nový test
        </button>

      </div>

    );

  }


  // =========================================
  // FOTOGRAFIE
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
        🌿 Test 4
      </h1>


      {/* =====================================
          PROGRESS
          ===================================== */}

      <div className="progress">

        <p>

          Otázka{" "}
          {questionNumber}{" "}
          /{" "}
          {totalQuestions}

          &nbsp;&nbsp;&nbsp;

          ✅ Správne:{" "}
          {score}

        </p>

      </div>


      {/* =====================================
          KATEGÓRIA
          ===================================== */}

      <h2>
        Ktorá rastlina patrí do
        skupiny:
      </h2>


      <h3>

        {selectedCategory?.icon}{" "}

        {selectedCategory?.name}

      </h3>


      {/* =====================================
          4 OBRÁZKY
          ===================================== */}

      <div className="images">

        {options.map(
          (option) => {

            const optionPhotos =
              option.images || [];


            if (
              optionPhotos.length ===
              0
            ) {
              return null;
            }


            const currentOptionPhoto =
              optionPhotos[
                photoIndex %
                optionPhotos.length
              ];


            const isSelected =
              result &&
              result.selected.id ===
                option.id;


            const isCorrectPlant =
              option.id ===
              plant.id;


            return (

              <div
                className="quiz-image-wrapper"
                key={
                  option.id
                }
              >

                <img
                  src={`/plants/${currentOptionPhoto}`}
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
                    checkAnswer(
                      option
                    )
                  }

                />

              </div>

            );

          }
        )}


        {/* =================================
            VÝSLEDOK CEZ OBRÁZKY
            ================================= */}

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

            {/* =================================
                SPRÁVNE / NESPRÁVNE
                ================================= */}

            <div className="answer-title">

              {result.correct
                ? "SPRÁVNE!"
                : "NESPRÁVNE!"}

            </div>


            {/* =================================
                NESPRÁVNA ODPOVEĎ
                ================================= */}

            {!result.correct && (

              <div className="answer-info">

                <div>
                  Vybral si:
                </div>


                <div className="answer-latin">

                  <i>
                    {result.selected.latin}
                  </i>

                </div>


                <div className="answer-name">

                  {result.selected.name}

                </div>


                <div
                  style={{
                    marginTop:
                      "8px"
                  }}
                >
                  Táto rastlina patrí do
                  skupiny:
                </div>


                <div className="answer-latin">

                  {
                    categories.find(
                      (item) =>
                        item.value ===
                        result.selected.category
                    )?.icon
                  }{" "}

                  {
                    categories.find(
                      (item) =>
                        item.value ===
                        result.selected.category
                    )?.name
                  }

                </div>

              </div>

            )}


            {/* =================================
                SPRÁVNA ODPOVEĎ
                ================================= */}

            {result.correct && (

              <div className="answer-info">

                <div>
                  Správne si vybral:
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

            )}


            {/* =================================
                ĎALŠIA OTÁZKA / VYHODNOTENIE
                ================================= */}

            <button
              className="answer-next-button"
              onClick={
                nextQuestion
              }
            >

              ➡️{" "}

              {questionNumber >=
              totalQuestions
                ? "Vyhodnotenie"
                : "Ďalšia otázka"}

            </button>

          </div>

        )}

      </div>

    </div>

  );

}

export default Quiz4;