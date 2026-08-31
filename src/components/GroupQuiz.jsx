
import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import plants from "../data/plants";

function GroupQuiz({
  room,
  player,
  goBack
}) {

  const [questionPlant, setQuestionPlant] = useState(null);
  const [options, setOptions] = useState([]);
  const [result, setResult] = useState(null);
  const [photoIndexes, setPhotoIndexes] = useState({});
  const [sending, setSending] = useState(false);

  const [displayScore, setDisplayScore] =
    useState(Number(player?.score || 0));

  const loadedQuestionRef = useRef(null);

  // =========================================
  // PRÍPRAVA OTÁZKY
  // =========================================

  useEffect(() => {

    if (!room) {
      return;
    }

    if (room.status !== "running") {
      return;
    }

    if (!room.question_data) {
      return;
    }

    const questionNumber =
      Number(room.current_question || 1);

    if (
      loadedQuestionRef.current ===
      questionNumber
    ) {
      return;
    }

    const questions = room.question_data;

    if (!Array.isArray(questions)) {
      console.error(
        "GROUP QUIZ: question_data nie je pole:",
        questions
      );
      return;
    }

    const question =
      questions[questionNumber - 1];

    if (!question) {
      console.error(
        "GROUP QUIZ: Otázka neexistuje:",
        questionNumber
      );
      return;
    }

    const correctPlantId =
      question.correctPlantId ||
      question.plantId;

    const correctPlant =
      plants.find(
        (plant) =>
          plant.id === correctPlantId
      );

    if (!correctPlant) {
      console.error(
        "GROUP QUIZ: Správna rastlina nebola nájdená:",
        correctPlantId
      );
      return;
    }

    let optionIds = [];

    if (
      Array.isArray(
        question.optionPlantIds
      )
    ) {
      optionIds = [
        ...question.optionPlantIds
      ];
    }

    // =======================================
    // AK CHÝBAJÚ MOŽNOSTI
    // =======================================

    if (optionIds.length === 0) {

      const categoryPlants =
        plants.filter(
          (plant) =>
            plant.category === room.category
        );

      const otherPlants =
        categoryPlants.filter(
          (plant) =>
            plant.id !== correctPlant.id
        );

      const shuffledOthers =
        [...otherPlants]
          .sort(
            () =>
              Math.random() - 0.5
          )
          .slice(0, 3);

      optionIds = [
        correctPlant.id,
        ...shuffledOthers.map(
          (plant) => plant.id
        )
      ];
    }

    const questionOptions =
      optionIds
        .map(
          (id) =>
            plants.find(
              (plant) =>
                plant.id === id
            )
        )
        .filter(Boolean);

    if (
      questionOptions.length === 0
    ) {
      console.error(
        "GROUP QUIZ: Neboli nájdené možnosti."
      );
      return;
    }

    loadedQuestionRef.current =
      questionNumber;

    setQuestionPlant(
      correctPlant
    );

    setOptions(
      questionOptions
    );

    setResult(null);
    setSending(false);

    setDisplayScore(
      Number(player?.score || 0)
    );

    const initialIndexes = {};

    questionOptions.forEach(
      (plant) => {
        initialIndexes[
          plant.id
        ] = 0;
      }
    );

    setPhotoIndexes(
      initialIndexes
    );

  }, [
    room?.current_question,
    room?.status
  ]);

  // =========================================
  // RESET PRI UKONČENÍ
  // =========================================

  useEffect(() => {

    if (
      room?.status !== "running"
    ) {
      loadedQuestionRef.current =
        null;
    }

  }, [
    room?.status
  ]);

  // =========================================
  // MENENIE FOTOGRAFIÍ
  // =========================================

  useEffect(() => {

    if (
      !options.length ||
      result
    ) {
      return;
    }

    const interval =
      setInterval(() => {

        setPhotoIndexes(
          (previous) => {

            const next = {
              ...previous
            };

            options.forEach(
              (plant) => {

                const photos =
                  plant.images || [];

                if (
                  photos.length > 0
                ) {

                  next[plant.id] =
                    (
                      previous[
                        plant.id
                      ] || 0
                    ) + 1;

                }

              }
            );

            return next;
          }
        );

      }, 2000);

    return () =>
      clearInterval(interval);

  }, [
    options,
    result
  ]);

  // =========================================
  // ODPOVEĎ HRÁČA
  // =========================================

  async function checkAnswer(
    selectedPlant
  ) {

    if (
      result ||
      sending ||
      !player ||
      !questionPlant
    ) {
      return;
    }

    setSending(true);

    const correct =
      selectedPlant.id ===
      questionPlant.id;

    setResult({
      correct,
      selected:
        selectedPlant
    });

    try {

      // =====================================
      // AKTUÁLNE SKÓRE Z DATABÁZY
      // =====================================

      const {
        data: currentPlayer,
        error: fetchError
      } = await supabase
        .from(
          "shared_test_players"
        )
        .select("score")
        .eq(
          "id",
          player.id
        )
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const currentScore =
        Number(
          currentPlayer?.score || 0
        );

      const newScore =
        correct
          ? currentScore + 1
          : currentScore;

      setDisplayScore(
        newScore
      );

      // =====================================
      // ULOŽENIE ODPOVEDE
      // =====================================

      const {
        error: updateError
      } = await supabase
        .from(
          "shared_test_players"
        )
        .update({

          current_answer:
            selectedPlant.id,

          answered:
            true,

          score:
            newScore

        })
        .eq(
          "id",
          player.id
        );

      if (updateError) {
        throw updateError;
      }

      console.log(
        "GROUP QUIZ – odpoveď uložená:",
        {
          player:
            player.name,

          current_answer:
            selectedPlant.id,

          selected:
            selectedPlant.name,

          correct,

          oldScore:
            currentScore,

          newScore
        }
      );

    } catch (err) {

      console.error(
        "GROUP QUIZ – chyba pri ukladaní odpovede:",
        err
      );

    } finally {

      setSending(false);

    }
  }

  // =========================================
  // TEST UKONČENÝ
  // =========================================

  if (
    room &&
    room.status === "finished"
  ) {

    return (
      <div className="app">

        <h1>
          👤 Skupinový test
        </h1>

        <h2>
          🏁 TEST UKONČENÝ
        </h2>

        <p>
          Organizátor test ukončil.
        </p>

        <p>
          Tvoje skóre:{" "}
          <strong>
            {displayScore}
          </strong>
          {" / "}
          {room.total_questions}
        </p>

        <br />

        <button
          onClick={goBack}
          style={{
            fontSize: "18px",
            padding: "12px 24px"
          }}
        >
          🏠 Úvodná stránka
        </button>

      </div>
    );
  }

  // =========================================
  // ČAKANIE
  // =========================================

  if (
    !room ||
    room.status !== "running"
  ) {

    return (
      <div className="app">

        <h1>
          👤 Skupinový test
        </h1>

        <h2>
          ⏳ Čakáme...
        </h2>

      </div>
    );
  }

  // =========================================
  // CHÝBAJÚCE DÁTA
  // =========================================

  if (
    !questionPlant ||
    options.length === 0
  ) {

    return (
      <div className="app">

        <h1>
          👤 Skupinový test
        </h1>

        <h2>
          📝 Otázka{" "}
          {room.current_question}
          {" / "}
          {room.total_questions}
        </h2>

        <p>
          ⏳ Pripravuje sa otázka...
        </p>

      </div>
    );
  }

  // =========================================
  // TEST
  // =========================================

  return (

    <div className="app">

      <h1>
        👤 Skupinový test
      </h1>

      <div className="progress">

        <p>

          📝 Otázka{" "}

          <strong>
            {room.current_question}
          </strong>

          {" / "}

          <strong>
            {room.total_questions}
          </strong>

          &nbsp;&nbsp;&nbsp;

          ✅ Správne:{" "}

          <strong>
            {displayScore}
          </strong>

        </p>

      </div>

      <h2>

        Ktorá rastlina je{" "}

        <i>
          {questionPlant.latin}
        </i>

        ?

      </h2>

      <p>
        Vyber správny obrázok.
      </p>

      <div className="images">

        {options.map(
          (option) => {

            const photos =
              option.images || [];

            if (
              photos.length === 0
            ) {
              return null;
            }

            const currentIndex =
              photoIndexes[
                option.id
              ] || 0;

            const currentPhoto =
              photos[
                currentIndex %
                photos.length
              ];

            const isSelected =
              result &&
              result.selected.id ===
                option.id;

            const isCorrectPlant =
              option.id ===
              questionPlant.id;

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
                  onClick={() => {

                    if (
                      result ||
                      sending
                    ) {
                      return;
                    }

                    checkAnswer(
                      option
                    );

                  }}
                />

              </div>
            );
          }
        )}

        {result && (

          <div
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
                  {
                    result
                      .selected
                      .latin
                  }
                </i>

              </div>

            </div>

            <p>
              ⏳ Čakaj na organizátora...
            </p>

          </div>

        )}

      </div>

    </div>
  );
}

export default GroupQuiz;
