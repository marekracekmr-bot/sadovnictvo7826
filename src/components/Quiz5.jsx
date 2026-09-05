import { useEffect, useState } from "react";
import plants from "../data/plants";

function Quiz5({ category, testLimit, goBack }) {
  const categoryPlants = plants.filter(
    (plant) => plant.category === category
  );

  const selectedLimit = Number(testLimit);
  const testPlants = categoryPlants.slice(0, selectedLimit);

  const totalCircles = Math.min(
    selectedLimit,
    categoryPlants.length
  );

  const [plant, setPlant] = useState(null);
  const [options, setOptions] = useState([]);
  const [greenCircles, setGreenCircles] = useState(0);
  const [result, setResult] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [testTime, setTestTime] = useState(0);

  function getRandomPlant() {
    if (testPlants.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(
      Math.random() * testPlants.length
    );

    return testPlants[randomIndex];
  }

  function getOptions(correctPlant) {
    if (!correctPlant) {
      return [];
    }

    const otherPlants = categoryPlants.filter(
      (item) => item.id !== correctPlant.id
    );

    const shuffledPlants = otherPlants.sort(
      () => Math.random() - 0.5
    );

    const wrongPlants = shuffledPlants.slice(0, 3);

    const allOptions = [];

    allOptions.push(correctPlant);

    wrongPlants.forEach((wrongPlant) => {
      allOptions.push(wrongPlant);
    });

    return allOptions.sort(
      () => Math.random() - 0.5
    );
  }

  useEffect(() => {
    if (
      testPlants.length > 0 &&
      plant === null
    ) {
      const firstPlant = getRandomPlant();

      setPlant(firstPlant);
      setStartTime(Date.now());
    }
  }, [testPlants.length, plant]);

  useEffect(() => {
    if (!plant) {
      return;
    }

    const newOptions = getOptions(plant);

    setOptions(newOptions);
    setPhotoIndex(0);
  }, [plant]);

  useEffect(() => {
    if (
      !plant ||
      result !== null ||
      finished ||
      gaveUp
    ) {
      return;
    }

    const interval = setInterval(() => {
      setPhotoIndex(
        (previousIndex) => previousIndex + 1
      );
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [
    plant,
    result,
    finished,
    gaveUp
  ]);

  function checkAnswer(selectedPlant) {
    if (
      result !== null ||
      finished ||
      gaveUp ||
      !plant
    ) {
      return;
    }

    const correct =
      selectedPlant.id === plant.id;

    if (correct) {
      setGreenCircles(
        (previousValue) =>
          Math.min(
            previousValue + 1,
            totalCircles
          )
      );
    } else {
      setGreenCircles(
        (previousValue) =>
          Math.max(
            previousValue - 2,
            0
          )
      );
    }

    setResult({
      correct: correct,
      selected: selectedPlant
    });
  }

  function nextPlant() {
    if (
      result !== null &&
      result.correct &&
      greenCircles >= totalCircles
    ) {
      finishTest();
      return;
    }

    const newPlant = getRandomPlant();

    if (!newPlant) {
      return;
    }

    setPlant(newPlant);
setOptions(getOptions(newPlant));
setResult(null);
setPhotoIndex(0);
  }

  function finishTest() {
    if (!startTime) {
      return;
    }

    const elapsed = Math.floor(
      (Date.now() - startTime) / 1000
    );

    setTestTime(elapsed);
    setFinished(true);
  }

  function giveUp() {
    const confirmed = window.confirm(
      "Naozaj sa chceš vzdať testu?"
    );

    if (!confirmed) {
      return;
    }

    if (startTime) {
      const elapsed = Math.floor(
        (Date.now() - startTime) / 1000
      );

      setTestTime(elapsed);
    }

    setGaveUp(true);
  }

  function restartTest() {
    const firstPlant = getRandomPlant();

    setPlant(firstPlant);
    setOptions([]);
    setGreenCircles(0);
    setResult(null);
    setPhotoIndex(0);
    setFinished(false);
    setGaveUp(false);
    setStartTime(Date.now());
    setTestTime(0);
  }

  if (testPlants.length === 0) {
    return (
      <div className="app">
        <p>
          V tejto kategórii nie sú rastliny.
        </p>

        <button onClick={goBack}>
          Späť
        </button>
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="app">
        Načítavam...
      </div>
    );
  }

  if (finished || gaveUp) {
    const completed =
      greenCircles >= totalCircles;

    const minutes = Math.floor(
      testTime / 60
    );

    const seconds = testTime % 60;

    const formattedTime =
      String(minutes).padStart(2, "0") +
      ":" +
      String(seconds).padStart(2, "0");

    let resultGif = "";

    if (gaveUp) {
      resultGif = "/gifs/testdo25.gif";
    }

    if (completed && !gaveUp) {
      resultGif = "/gifs/test100.gif";
    }

    return (
      <div className="app">
        <button
          className="back-button"
          onClick={goBack}
        >
          Späť
        </button>

        <h1>
          {completed && !gaveUp
            ? "Test dokončený"
            : "Test ukončený"}
        </h1>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "7px",
            margin: "25px auto"
          }}
        >
          {Array.from({
            length: totalCircles
          }).map((_, index) => (
            <div
              key={index}
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                border: "2px solid #777",
                backgroundColor:
                  index < greenCircles
                    ? "#4caf50"
                    : "transparent"
              }}
            />
          ))}
        </div>

       

        {resultGif && (
          <div
            style={{
              width: "100%",
              maxWidth: "600px",
              margin: "25px auto",
              textAlign: "center"
            }}
          >
            <img
              src={resultGif}
              alt="Výsledok testu"
              style={{
                width: "100%",
                maxWidth: "500px",
                height: "auto",
                display: "block",
                margin: "0 auto",
                borderRadius: "12px"
              }}
            />
          </div>
        )}

        <p>
          {gaveUp
            ? "Test si ukončil vzdaním sa."
            : "Výborne! Získal si všetky zelené kruhy."}
        </p>

        <div
          style={{
            maxWidth: "400px",
            margin: "25px auto",
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "12px",
            backgroundColor: "white"
          }}
        >
        

          <p>
            <strong>
              Čas:
            </strong>{" "}
            {formattedTime}
          </p>
        </div>

        <button onClick={goBack}>
          Späť na kategórie
        </button>

        <button
          onClick={restartTest}
          style={{
            marginLeft: "10px"
          }}
        >
          Nový test
        </button>
      </div>
    );
  }

  const photos = plant.images || [];

  let currentPhoto = null;

  if (photos.length > 0) {
    const photoPosition =
      photoIndex % photos.length;

    currentPhoto =
      photos[photoPosition];
  }

  return (
    <div className="app">
      <button
        className="back-button"
        onClick={goBack}
      >
        Späť
      </button>

      <h1>
        Test 5
      </h1>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "7px",
          margin: "20px auto 30px",
          maxWidth: "700px"
        }}
      >
        {Array.from({
          length: totalCircles
        }).map((_, index) => (
          <div
            key={index}
            style={{
              width: "25px",
              height: "25px",
              borderRadius: "50%",
              border: "3px solid #777",
              backgroundColor:
                index < greenCircles
                  ? "#4caf50"
                  : "transparent",
              transition:
                "background-color 0.3s"
            }}
          />
        ))}
      </div>

      
      <div
        className="quiz5-photo-wrapper"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "600px",
          margin: "20px auto",
          overflow: "hidden",
          borderRadius: "12px",
          lineHeight: 0
        }}
      >
        {currentPhoto && (
          <img
            className="quiz5-photo"
            src={"/plants/" + currentPhoto}
            alt={plant.name}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              margin: "0",
              borderRadius: "12px"
            }}
          />
        )}

        {result !== null && (
          <div
            className="quiz5-answer-overlay"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
              padding: "20px",
              borderRadius: "12px",
              backgroundColor:
                result.correct
                  ? "rgba(46, 125, 50, 0.88)"
                  : "rgba(198, 40, 40, 0.88)",
              color: "white",
              zIndex: 100,
              lineHeight: "normal"
            }}
          >
            <div
              className="quiz5-answer-content"
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center"
              }}
            >
              <div
                style={{
                  fontSize: "38px",
                  fontWeight: "bold",
                  marginBottom: "15px"
                }}
              >
                {result.correct
                  ? "SPRÁVNE!"
                  : "NESPRÁVNE!"}
              </div>

              <div
                style={{
                  fontSize: "18px"
                }}
              >
                Správna odpoveď:
              </div>

              <div
                style={{
                  fontSize: "22px",
                  marginTop: "5px"
                }}
              >
                <i>
                  {plant.latin}
                </i>
              </div>

              <div
                style={{
                  fontSize: "22px",
                  fontWeight: "bold"
                }}
              >
                {plant.name}
              </div>

              <button
                onClick={nextPlant}
                style={{
                  marginTop: "20px",
                  fontSize: "18px",
                  padding: "12px 25px",
                  lineHeight: "normal",
                  cursor: "pointer"
                }}
              >
                {result.correct &&
                greenCircles >= totalCircles
                  ? "Dokončiť test"
                  : "Ďalšia rastlina"}
              </button>
            </div>
          </div>
        )}
      </div>

      <h2>
        Ktorá rastlina je na obrázku?
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: "12px",
          width: "100%",
          maxWidth: "600px",
          margin: "20px auto"
        }}
      >
        {options.map((option) => {
          const isSelected =
            result !== null &&
            result.selected.id === option.id;

          const isCorrect =
            option.id === plant.id;

          let backgroundColor =
            "transparent";

          if (result !== null) {
            if (isCorrect) {
              backgroundColor =
                "#c8e6c9";
            }

            if (
              isSelected &&
              !result.correct
            ) {
              backgroundColor =
                "#ffcdd2";
            }
          }

          return (
            <button
              key={option.id}
              onClick={() => {
                if (result === null) {
                  checkAnswer(option);
                }
              }}
              disabled={result !== null}
              style={{
                fontSize: "16px",
                padding: "15px 10px",
                minHeight: "60px",
                backgroundColor:
                  backgroundColor,
                borderRadius: "10px",
                border: "1px solid #bbb",
                cursor:
                  result !== null
                    ? "default"
                    : "pointer"
              }}
            >
              <i>
                {option.latin}
              </i>

              <br />

              {option.name}
            </button>
          );
        })}
      </div>

      {result === null && (
        <button
          onClick={giveUp}
          style={{
            marginTop: "25px",
            padding: "10px 25px",
            fontSize: "16px"
          }}
        >
          Vzdávam sa
        </button>
      )}
    </div>
  );
}

export default Quiz5;