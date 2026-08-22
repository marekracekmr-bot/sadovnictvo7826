import { useState, useEffect } from "react";
import plants from "../data/plants";

function Study({ category, plantId, goBack }) {
  
  const [limit, setLimit] = useState("");
  const [started, setStarted] = useState(!!plantId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const categoryPlants = plants.filter(
    (plant) => plant.category === category
  );

  const selectedPlantIndex = plantId
    ? categoryPlants.findIndex((plant) => plant.id === plantId)
    : 0;

  const studyPlants = plantId
    ? categoryPlants
    : categoryPlants.slice(
        0,
        limit ? Number(limit) : categoryPlants.length
      );

  useEffect(() => {
    if (plantId) {
      const index = categoryPlants.findIndex(
        (plant) => plant.id === plantId
      );

      if (index >= 0) {
        setCurrentIndex(index);
      }
    }
  }, [plantId, category]);

  if (!started) {
    return (
      <div className="app">

        <h1>📖 Výuka rastlín</h1>

        <p>Koľko rastlín chceš precvičiť?</p>

        <input
          type="number"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
        />

        <br /><br />

        <button onClick={() => setStarted(true)}>
          ▶️ Začať výuku
        </button>

        <br />

        <button
          onClick={() => {
            setLimit(categoryPlants.length);
            setStarted(true);
          }}
        >
          🌿 Všetky rastliny
        </button>

        <br /><br />

        <button onClick={goBack}>
          ⬅ Späť
        </button>

      </div>
    );
  }

  const plant = studyPlants[currentIndex];

  function nextPlant() {
    if (currentIndex < studyPlants.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowInfo(false);
      setShowDetail(false);
    }
  }

  function previousPlant() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowInfo(false);
      setShowDetail(false);
    }
  }

  return (
    <div className="app">

      <button
        className="back-button"
        onClick={goBack}
      >
        ⬅ Späť
      </button>

      <h1>📖 Výuka rastlín</h1>

      <p>
        {currentIndex + 1} / {studyPlants.length}
      </p>


      {/* FOTOGRAFIA + INFORMÁCIE */}
      <div
        style={{
          position: "relative",
          width: "650px",
          maxWidth: "90%",
          margin: "0 auto"
        }}
      >

        <img
          src={`/plants/${
            showDetail && plant.detailImage
              ? plant.detailImage
              : plant.image
          }`}
          alt={plant.name}
          onClick={() => {
            if (plant.detailImage) {
              setShowDetail(!showDetail);
            }
          }}
          style={{
            width: "100%",
            display: "block",
            borderRadius: "15px",
            cursor: plant.detailImage ? "pointer" : "default"
          }}
        />


        {/* INFORMAČNÝ PANEL CEZ FOTOGRAFIU */}
        {showInfo && (
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.72)",
              color: "white",
              borderRadius: "15px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: "25px",
              boxSizing: "border-box",
              textAlign: "center",
              overflowY: "auto"
            }}
          >

            <h2>
              <i>{plant.latin}</i>
            </h2>

            <h3>{plant.name}</h3>

            <p>
              <strong>Čeľaď:</strong> {plant.family}
            </p>

            {plant.height && (
              <p>
                <strong>Výška:</strong> {plant.height}
              </p>
            )}

            {plant.description && (
              <p>
                {plant.description}
              </p>
            )}

          </div>
        )}

      </div>


      {/* TLAČIDLO INFORMÁCIE */}
      <div style={{ marginTop: "20px" }}>

        <button
          onClick={() => setShowInfo(!showInfo)}
        >
          {showInfo
            ? "🙈 Skryť informácie"
            : "ℹ️ Informácie o rastline"}
        </button>

      </div>


      {/* NAVIGÁCIA */}
      <div
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "center",
          gap: "15px"
        }}
      >

        <button
          onClick={previousPlant}
          disabled={currentIndex === 0}
        >
          ⬅ Predchádzajúca
        </button>

        <button
          onClick={nextPlant}
          disabled={currentIndex === studyPlants.length - 1}
        >
          Ďalšia ➡
        </button>

      </div>

    </div>
  );
}

export default Study;