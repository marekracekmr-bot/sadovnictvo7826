
import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import plants from "../data/plants";

function GroupOrganizer({ category, goBack }) {

  const [testType, setTestType] = useState("");
  const [testLimit, setTestLimit] = useState("");
  const [allPlants, setAllPlants] = useState(false);

  // =========================================
  // HESLO ORGANIZÁTORA
  // =========================================

  const [organizerPassword, setOrganizerPassword] =
    useState("");

  const [roomCode, setRoomCode] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [room, setRoom] = useState(null);

  const [players, setPlayers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [changingQuestion, setChangingQuestion] =
    useState(false);
  const [finishing, setFinishing] = useState(false);

  const [error, setError] = useState("");

  const [wrongAnswers, setWrongAnswers] =
    useState({});

  // Zabráni dvojitému vyhodnoteniu tej istej odpovede
  const processedAnswersRef =
    useRef(new Set());

  // =========================================
  // RASTLINY KATEGÓRIE
  // =========================================

  const categoryPlants = plants.filter(
    (plant) =>
      plant.category === category
  );

  // =========================================
  // KATEGÓRIE
  // =========================================

  const categories = {
    vzdyzelene_kry: {
      name: "Vždyzelené listnaté kry",
      icon: "🌿"
    },

    popinave: {
      name: "Popínavé rastliny",
      icon: "🌱"
    },

    ihlicnany: {
      name: "Ihličnany",
      icon: "🌲"
    },

    opadave_stromy: {
      name: "Opadavé listnaté stromy",
      icon: "🌳"
    }
  };

  const selectedCategory =
    categories[category];

  // =========================================
  // NÁHODNÝ KÓD MIESTNOSTI
  // =========================================

  function generateRoomCode() {

    const characters =
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < 4; i++) {

      code += characters.charAt(
        Math.floor(
          Math.random() *
          characters.length
        )
      );

    }

    return code;
  }

  // =========================================
  // VYTVORENIE OTÁZOK
  // =========================================

  function createQuestionData(
    numberOfQuestions
  ) {

    const shuffled =
      [...categoryPlants]
        .sort(
          () => Math.random() - 0.5
        );

    const selectedPlants =
      shuffled.slice(
        0,
        numberOfQuestions
      );

    return selectedPlants.map(
      (plant, index) => ({
        question: index + 1,
        plantId: plant.id
      })
    );
  }

  // =========================================
  // SPRÁVNA RASTLINA AKTUÁLNEJ OTÁZKY
  // =========================================

  function getCurrentQuestionPlant() {

    if (!room?.question_data) {
      return null;
    }

    const questionNumber =
      Number(
        room.current_question || 0
      );

    if (questionNumber < 1) {
      return null;
    }

    const questions =
      Array.isArray(room.question_data)
        ? room.question_data
        : [];

    const question =
      questions[
        questionNumber - 1
      ];

    if (!question) {
      return null;
    }

    const plantId =
      question.plantId;

    if (!plantId) {
      return null;
    }

    return (
      plants.find(
        (plant) =>
          String(plant.id) ===
          String(plantId)
      ) || null
    );
  }

  // =========================================
  // NAČÍTANIE MIESTNOSTI
  // =========================================

  async function loadRoom(id) {

    if (!id) {
      return;
    }

    const {
      data,
      error: roomError
    } = await supabase
      .from("shared_test_rooms")
      .select("*")
      .eq("id", id)
      .single();

    if (roomError) {

      console.error(
        "Chyba pri načítaní miestnosti:",
        roomError
      );

      return;
    }

    setRoom(data);
  }

  // =========================================
  // NAČÍTANIE HRÁČOV
  // =========================================

  async function loadPlayers(id) {

    if (!id) {
      return;
    }

    const {
      data,
      error: playersError
    } = await supabase
      .from("shared_test_players")
      .select("*")
      .eq("room_id", id)
      .order("joined_at", {
        ascending: true
      });

    if (playersError) {

      console.error(
        "Chyba pri načítaní hráčov:",
        playersError
      );

      return;
    }

    setPlayers(data || []);
  }

  // =========================================
  // REALTIME – HRÁČI A MIESTNOSŤ
  // =========================================

  useEffect(() => {

    if (!roomId) {
      return;
    }

    loadRoom(roomId);
    loadPlayers(roomId);

    const playersChannel =
      supabase
        .channel(
          `shared-test-players-${roomId}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "shared_test_players",
            filter:
              `room_id=eq.${roomId}`
          },
          () => {

            loadPlayers(roomId);

          }
        )
        .subscribe((status) => {

          console.log(
            "ORGANIZÁTOR – Realtime hráči:",
            status
          );

        });

    const roomChannel =
      supabase
        .channel(
          `shared-test-room-${roomId}`
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "shared_test_rooms",
            filter:
              `id=eq.${roomId}`
          },
          (payload) => {

            console.log(
              "ORGANIZÁTOR – Zmena miestnosti:",
              payload.new
            );

            setRoom(payload.new);

          }
        )
        .subscribe((status) => {

          console.log(
            "ORGANIZÁTOR – Realtime miestnosť:",
            status
          );

        });

    return () => {

      supabase.removeChannel(
        playersChannel
      );

      supabase.removeChannel(
        roomChannel
      );

    };

  }, [roomId]);

  // =========================================
  // VYTVORENIE MIESTNOSTI
  // =========================================

  async function createRoom() {

    setError("");

    // =======================================
    // KONTROLA HESLA
    // =======================================

    if (!organizerPassword.trim()) {

      setError(
        "Zadaj heslo organizátora."
      );

      return;
    }

    setLoading(true);

    try {

      const {
        data: passwordCorrect,
        error: passwordError
      } = await supabase.rpc(
        "check_organizer_password",
        {
          input_password:
            organizerPassword.trim()
        }
      );

      if (passwordError) {
        throw passwordError;
      }

      if (passwordCorrect !== true) {

        setError(
          "Nesprávne heslo organizátora."
        );

        return;
      }

      // =======================================
      // KONTROLA TESTU
      // =======================================

      if (!testType) {

        setError(
          "Vyber typ testu."
        );

        return;
      }

      if (
        !allPlants &&
        !testLimit
      ) {

        setError(
          "Vyber počet rastlín."
        );

        return;
      }

      const numberOfQuestions =
        allPlants
          ? categoryPlants.length
          : Number(testLimit);

      if (
        numberOfQuestions < 1 ||
        numberOfQuestions >
          categoryPlants.length
      ) {

        setError(
          `Počet musí byť od 1 do ${categoryPlants.length}.`
        );

        return;
      }

      // =======================================
      // GENEROVANIE KÓDU
      // =======================================

      let code =
        generateRoomCode();

      let codeExists = true;

      while (codeExists) {

        const {
          data,
          error: checkError
        } = await supabase
          .from("shared_test_rooms")
          .select("id")
          .eq(
            "room_code",
            code
          )
          .maybeSingle();

        if (checkError) {
          throw checkError;
        }

        if (!data) {

          codeExists = false;

        } else {

          code =
            generateRoomCode();

        }

      }

      // =======================================
      // OTÁZKY
      // =======================================

      const questionData =
        createQuestionData(
          numberOfQuestions
        );

      console.log(
        "SKUPINOVÝ TEST – otázky:",
        questionData
      );

      // =======================================
      // VYTVORENIE MIESTNOSTI
      // =======================================

      const {
        data,
        error: insertError
      } = await supabase
        .from("shared_test_rooms")
        .insert([
          {
            room_code:
              code,

            category:
              category,

            test_type:
              Number(testType),

            total_questions:
              numberOfQuestions,

            current_question:
              0,

            status:
              "waiting",

            question_data:
              questionData
          }
        ])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      console.log(
        "SKUPINOVÝ TEST – miestnosť vytvorená:",
        data
      );

      setWrongAnswers({});

      processedAnswersRef.current =
        new Set();

      setRoomCode(
        data.room_code
      );

      setRoomId(
        data.id
      );

      setRoom(data);

      setPlayers([]);

    } catch (err) {

      console.error(
        "Chyba pri vytváraní miestnosti:",
        err
      );

      setError(
        "Miestnosť sa nepodarilo vytvoriť. " +
        (err?.message || "")
      );

    } finally {

      setLoading(false);

    }

  }

  // =========================================
  // SPUSTENIE TESTU
  // =========================================

  async function startTest() {

    if (!roomId) {
      return;
    }

    if (players.length === 0) {

      setError(
        "Najprv sa musí pripojiť aspoň jeden hráč."
      );

      return;
    }

    setError("");
    setStarting(true);

    try {

      const {
        data,
        error: updateError
      } = await supabase
        .from("shared_test_rooms")
        .update({

          status:
            "running",

          current_question:
            1,

          started_at:
            new Date().toISOString()

        })
        .eq("id", roomId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      console.log(
        "TEST SPUSTENÝ:",
        data
      );

      setWrongAnswers({});

      processedAnswersRef.current =
        new Set();

      setRoom(data);

    } catch (err) {

      console.error(
        "Chyba pri spúšťaní testu:",
        err
      );

      setError(
        "Test sa nepodarilo spustiť. " +
        (err?.message || "")
      );

    } finally {

      setStarting(false);

    }

  }

  // =========================================
  // VYHODNOTENIE AKTUÁLNEJ OTÁZKY
  // =========================================

  async function evaluateCurrentQuestion() {

    const currentQuestion =
      Number(
        room?.current_question || 0
      );

    const questions =
      Array.isArray(
        room?.question_data
      )
        ? room.question_data
        : [];

    const currentQuestionData =
      questions[
        currentQuestion - 1
      ];

    const correctPlantId =
      currentQuestionData?.plantId;

    if (
      currentQuestion < 1 ||
      !correctPlantId
    ) {
      return;
    }

    console.log(
      "VYHODNOCUJEM OTÁZKU:",
      currentQuestion
    );

    console.log(
      "SPRÁVNA ODPOVEĎ:",
      correctPlantId
    );

    // ---------------------------------------
    // Vyhodnotenie každého hráča
    // ---------------------------------------

    for (const player of players) {

      const answerKey =
        `${player.id}-${currentQuestion}`;

      // Už sme túto odpoveď vyhodnotili
      if (
        processedAnswersRef.current.has(
          answerKey
        )
      ) {
        continue;
      }

      processedAnswersRef.current.add(
        answerKey
      );

      // -------------------------------------
      // Hráč neodpovedal
      // -------------------------------------

      if (!player.answered) {

        console.log(
          "HRÁČ NESTIHOL ODPOVEDAŤ:",
          player.name
        );

        setWrongAnswers(
          (previous) => ({
            ...previous,
            [player.id]:
              (previous[player.id] || 0) + 1
          })
        );

        continue;
      }

      // -------------------------------------
      // Kontrola odpovede
      // -------------------------------------

      const isCorrect =
        String(
          player.current_answer
        ) ===
        String(
          correctPlantId
        );

      // -------------------------------------
      // SPRÁVNA ODPOVEĎ
      // -------------------------------------

      if (isCorrect) {

        console.log(
          "SPRÁVNA ODPOVEĎ:",
          player.name
        );

        const newScore =
          Number(
            player.score || 0
          ) + 1;

        const {
          data,
          error
        } = await supabase
          .from("shared_test_players")
          .update({
            score:
              newScore
          })
          .eq(
            "id",
            player.id
          )
          .select()
          .single();

        if (error) {

          console.error(
            "Chyba pri zvýšení skóre:",
            error
          );

          continue;
        }

        // Okamžite aktualizujeme lokálny zoznam hráčov
        setPlayers(
          (previous) =>
            previous.map(
              (p) =>
                p.id === data.id
                  ? data
                  : p
            )
        );

      }

      // -------------------------------------
      // NESPRÁVNA ODPOVEĎ
      // -------------------------------------

      else {

        console.log(
          "NESPRÁVNA ODPOVEĎ:",
          player.name,
          player.current_answer
        );

        setWrongAnswers(
          (previous) => ({
            ...previous,
            [player.id]:
              (previous[player.id] || 0) + 1
          })
        );

      }

    }

  }

  // =========================================
  // ĎALŠIA OTÁZKA
  // =========================================

  async function nextQuestion() {

    if (!roomId || !room) {
      return;
    }

    const currentQuestion =
      Number(
        room.current_question || 0
      );

    const totalQuestions =
      Number(
        room.total_questions || 0
      );

    if (
      currentQuestion < 1 ||
      currentQuestion > totalQuestions
    ) {
      return;
    }

    setError("");
    setChangingQuestion(true);

    try {

      // =====================================
      // NAJPRV VYHODNOTIŤ ODPOVEDE
      // =====================================

      await evaluateCurrentQuestion();

      // =====================================
      // POSLEDNÁ OTÁZKA
      // =====================================

      if (
        currentQuestion >=
        totalQuestions
      ) {

        console.log(
          "POSLEDNÁ OTÁZKA VYHODNOTENÁ."
        );

        return;
      }

      // =====================================
      // VYNULOVANIE ODPOVEDÍ HRÁČOV
      // =====================================

      const {
        error: resetError
      } = await supabase
        .from(
          "shared_test_players"
        )
        .update({

          current_answer:
            null,

          answered:
            false,

          finished:
            false

        })
        .eq(
          "room_id",
          roomId
        );

      if (resetError) {
        throw resetError;
      }

      // =====================================
      // ĎALŠIA OTÁZKA
      // =====================================

      const nextQuestionNumber =
        currentQuestion + 1;

      const {
        data,
        error: updateError
      } = await supabase
        .from(
          "shared_test_rooms"
        )
        .update({

          current_question:
            nextQuestionNumber

        })
        .eq(
          "id",
          roomId
        )
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      console.log(
        "SKUPINOVÝ TEST – ďalšia otázka:",
        nextQuestionNumber
      );

      setRoom(data);

    } catch (err) {

      console.error(
        "Chyba pri prechode na ďalšiu otázku:",
        err
      );

      setError(
        "Nepodarilo sa prejsť na ďalšiu otázku. " +
        (err?.message || "")
      );

    } finally {

      setChangingQuestion(false);

    }

  }

  // =========================================
  // UKONČENIE TESTU
  // =========================================

  async function finishTest() {

    if (!roomId || !room) {
      return;
    }

    setError("");
    setFinishing(true);

    try {

      const currentQuestion =
        Number(
          room.current_question || 0
        );

      const totalQuestions =
        Number(
          room.total_questions || 0
        );

      // =====================================
      // POSLEDNÁ OTÁZKA
      // =====================================

      if (
        room.status === "running" &&
        currentQuestion === totalQuestions
      ) {

        await evaluateCurrentQuestion();

      }

      // =====================================
      // UKONČENIE MIESTNOSTI
      // =====================================

      const {
        data,
        error: updateError
      } = await supabase
        .from(
          "shared_test_rooms"
        )
        .update({

          status:
            "finished",

          finished_at:
            new Date().toISOString()

        })
        .eq(
          "id",
          roomId
        )
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      console.log(
        "SKUPINOVÝ TEST – ukončený:",
        data
      );

      setRoom(data);

    } catch (err) {

      console.error(
        "Chyba pri ukončení testu:",
        err
      );

      setError(
        "Test sa nepodarilo ukončiť. " +
        (err?.message || "")
      );

    } finally {

      setFinishing(false);

    }

  }

  // =========================================
  // ZOBRAZENIE SKÓRE
  // =========================================

  function getPlayerScoreText(
    player
  ) {

    const correct =
      Number(
        player.score || 0
      );

    const wrong =
      Number(
        wrongAnswers[player.id] || 0
      );

    const total =
      totalQuestions;

    return {
      correct,
      wrong,
      total
    };

  }

  // =========================================
  // STAV TESTU
  // =========================================

  const currentQuestion =
    Number(
      room?.current_question || 0
    );

  const totalQuestions =
    Number(
      room?.total_questions || 0
    );

  const currentQuestionPlant =
    getCurrentQuestionPlant();

  const answeredPlayers =
    players.filter(
      (player) =>
        player.answered
    ).length;

  const testRunning =
    room?.status === "running";

  const testFinished =
    room?.status === "finished";

  // =========================================
  // ORGANIZÁTOR – ČAKÁREŇ / TEST
  // =========================================

  if (roomCode) {

    return (
      <div className="app">

        <h1>
          👑 Organizátor testu
        </h1>

        <h2>
          {selectedCategory?.icon}{" "}
          {selectedCategory?.name}
        </h2>

        <div
          style={{
            margin: "30px auto",
            padding: "25px",
            maxWidth: "500px",
            border: "2px solid #ccc",
            borderRadius: "12px"
          }}
        >

          <p>
            Kód spoločného testu:
          </p>

          <div
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              letterSpacing: "8px",
              margin: "20px 0"
            }}
          >
            {roomCode}
          </div>

          <hr />

          <p>
            <strong>
              Test:
            </strong>{" "}
            Test {testType}
          </p>

          <p>
            <strong>
              Počet otázok:
            </strong>{" "}
            {room?.total_questions ||
              (
                allPlants
                  ? categoryPlants.length
                  : testLimit
              )}
          </p>

          {/* =================================
              AKTUÁLNA OTÁZKA
              ================================= */}

          {testRunning && (
            <>

              <hr />

              <h2>
                📝 Otázka{" "}
                {currentQuestion} /{" "}
                {totalQuestions}
              </h2>

              {currentQuestionPlant && (
                <div
                  style={{
                    margin: "15px 0",
                    padding: "15px",
                    border:
                      "2px solid #2196f3",
                    borderRadius:
                      "10px",
                    background:
                      "#e3f2fd"
                  }}
                >

                  <p>
                    Ktorá rastlina je:
                  </p>

                  <div
                    style={{
                      fontSize: "22px",
                      marginTop: "8px"
                    }}
                  >

                    <i>
                      {currentQuestionPlant.latin}
                    </i>

                  </div>

                </div>
              )}

              <div
                style={{
                  margin: "20px 0",
                  padding: "20px",
                  border:
                    "2px solid #4caf50",
                  borderRadius:
                    "12px"
                }}
              >

                <p>
                  Odpovedalo:{" "}
                  <strong>
                    {answeredPlayers}
                  </strong>{" "}
                  z{" "}
                  <strong>
                    {players.length}
                  </strong>
                </p>

                <p>
                  Organizátor môže
                  pokračovať aj bez toho,
                  aby odpovedali všetci
                  hráči.
                </p>

              </div>

              <button
                onClick={
                  nextQuestion
                }
                disabled={
                  changingQuestion
                }
                style={{
                  fontSize:
                    "18px",
                  padding:
                    "12px 24px"
                }}
              >

                {changingQuestion
                  ? "⏳ Vyhodnocujem..."
                  : currentQuestion >=
                    totalQuestions
                  ? "✅ Vyhodnotiť poslednú otázku"
                  : "➡ Ďalšia otázka"}

              </button>

              {currentQuestion >=
                totalQuestions && (
                <>

                  <br />
                  <br />

                  <button
                    onClick={
                      finishTest
                    }
                    disabled={
                      finishing
                    }
                    style={{
                      fontSize:
                        "18px",
                      padding:
                        "12px 24px"
                    }}
                  >

                    {finishing
                      ? "⏳ Ukončujem..."
                      : "🏁 Ukončiť test"}

                  </button>

                </>
              )}

            </>
          )}

          {/* =================================
              TEST UKONČENÝ
              ================================= */}

          {testFinished && (
            <>

              <hr />

              <h2>
                🏁 Test je ukončený
              </h2>

              <p>
                Test bol dokončený.
              </p>

              <h3>
                👥 Výsledky hráčov
              </h3>

              <div
                style={{
                  marginTop:
                    "20px",
                  textAlign:
                    "left"
                }}
              >

                {players.map(
                  (
                    player,
                    index
                  ) => {

                    const score =
                      getPlayerScoreText(
                        player
                      );

                    return (
                      <div
                        key={
                          player.id
                        }
                        style={{
                          padding:
                            "12px",
                          marginBottom:
                            "8px",
                          border:
                            "1px solid #ccc",
                          borderRadius:
                            "8px",
                          background:
                            "#f5f5f5"
                        }}
                      >

                        <strong>
                          {index + 1}.{" "}
                          {player.name}
                        </strong>

                        <div
                          style={{
                            marginTop:
                              "5px"
                          }}
                        >

                          Skóre:{" "}

                          <span
                            style={{
                              color:
                                "green",
                              fontWeight:
                                "bold"
                            }}
                          >
                            {score.correct}
                          </span>

                          {" / "}

                          <span
                            style={{
                              color:
                                "red",
                              fontWeight:
                                "bold"
                            }}
                          >
                            {score.wrong}
                          </span>

                          {" / "}

                          <strong>
                            {score.total}
                          </strong>

                        </div>

                      </div>
                    );

                  }
                )}

              </div>

            </>
          )}

          {/* =================================
              ČAKÁREŇ
              ================================= */}

          {!testRunning &&
            !testFinished && (
              <>

                <hr />

                <h3>
                  👥 Pripojení hráči:{" "}
                  {players.length}
                </h3>

                {players.length === 0 ? (

                  <div>

                    <p>
                      ⏳ Zatiaľ sa
                      nepripojil žiadny
                      hráč.
                    </p>

                    <p>
                      Hráči sa môžu
                      pripojiť pomocou
                      kódu:
                    </p>

                    <strong
                      style={{
                        fontSize:
                          "24px"
                      }}
                    >
                      {roomCode}
                    </strong>

                  </div>

                ) : (

                  <div
                    style={{
                      marginTop:
                        "20px",
                      textAlign:
                        "left"
                    }}
                  >

                    {players.map(
                      (
                        player,
                        index
                      ) => {

                        const score =
                          getPlayerScoreText(
                            player
                          );

                        return (
                          <div
                            key={
                              player.id
                            }
                            style={{
                              padding:
                                "12px",
                              marginBottom:
                                "8px",
                              border:
                                "1px solid #ccc",
                              borderRadius:
                                "8px",
                              background:
                                "#f5f5f5"
                            }}
                          >

                            <strong>
                              {index + 1}.{" "}
                              {player.name}
                            </strong>

                            <div
                              style={{
                                marginTop:
                                  "5px"
                              }}
                            >

                              Skóre:{" "}

                              <span
                                style={{
                                  color:
                                    "green",
                                  fontWeight:
                                    "bold"
                                }}
                              >
                                {score.correct}
                              </span>

                              {" / "}

                              <span
                                style={{
                                  color:
                                    "red",
                                  fontWeight:
                                    "bold"
                                }}
                              >
                                {score.wrong}
                              </span>

                              {" / "}

                              <strong>
                                {score.total}
                              </strong>

                            </div>

                          </div>
                        );

                      }
                    )}

                  </div>

                )}

                {error && (
                  <p
                    style={{
                      color:
                        "red",
                      fontWeight:
                        "bold"
                    }}
                  >
                    {error}
                  </p>
                )}

                <br />

                <button
                  onClick={
                    startTest
                  }
                  disabled={
                    starting ||
                    players.length ===
                      0
                  }
                  style={{
                    fontSize:
                      "18px",
                    padding:
                      "12px 24px"
                  }}
                >

                  {starting
                    ? "⏳ Spúšťam test..."
                    : "🚀 Spustiť test"}

                </button>

              </>
            )}

          {/* =================================
              HRÁČI POČAS TESTU
              ================================= */}

          {testRunning && (
            <div
              style={{
                marginTop:
                  "25px",
                textAlign:
                  "left"
              }}
            >

              <hr />

              <h3>
                👥 Hráči
              </h3>

              {players.map(
                (
                  player,
                  index
                ) => {

                  const score =
                    getPlayerScoreText(
                      player
                    );

                  return (
                    <div
                      key={
                        player.id
                      }
                      style={{
                        padding:
                          "12px",
                        marginBottom:
                          "8px",
                        border:
                          "1px solid #ccc",
                        borderRadius:
                          "8px",
                        background:
                          player.answered
                            ? "#e8f5e9"
                            : "#f5f5f5"
                      }}
                    >

                      <strong>
                        {index + 1}.{" "}
                        {player.name}
                      </strong>

                      <div
                        style={{
                          marginTop:
                            "5px"
                        }}
                      >

                        Skóre:{" "}

                        <span
                          style={{
                            color:
                              "green",
                            fontWeight:
                              "bold"
                          }}
                        >
                          {score.correct}
                        </span>

                        {" / "}

                        <span
                          style={{
                            color:
                              "red",
                            fontWeight:
                              "bold"
                          }}
                        >
                          {score.wrong}
                        </span>

                        {" / "}

                        <strong>
                          {score.total}
                        </strong>

                      </div>

                      <div>
                        {player.answered
                          ? "✅ Odpovedal"
                          : "⏳ Ešte neodpovedal"}
                      </div>

                    </div>
                  );

                }
              )}

            </div>
          )}

          {error &&
            (
              testRunning ||
              testFinished
            ) && (
              <p
                style={{
                  color:
                    "red",
                  fontWeight:
                    "bold"
                }}
              >
                {error}
              </p>
            )}

        </div>

        <button
          onClick={
            goBack
          }
        >
          ⬅ Späť
        </button>

      </div>
    );

  }

  // =========================================
  // VYTVORENIE TESTU
  // =========================================

  return (

    <div className="app">

      <h1>
        👑 Organizátor testu
      </h1>

      <h2>
        {selectedCategory?.icon}{" "}
        {selectedCategory?.name}
      </h2>

      <p>
        Nastav spoločný test:
      </p>

      {/* ===================================
          HESLO ORGANIZÁTORA
          =================================== */}

      <p>
        <strong>
          Heslo organizátora:
        </strong>
      </p>

      <input
        type="password"
        value={
          organizerPassword
        }
        onChange={(e) =>
          setOrganizerPassword(
            e.target.value
          )
        }
        placeholder="Zadaj heslo"
        autoComplete="off"
        style={{
          fontSize: "18px",
          padding: "10px",
          width: "280px",
          maxWidth: "90%"
        }}
      />

      <p
        style={{
          fontSize: "14px",
          color: "#666"
        }}
      >
        Heslo sa overí cez Supabase.
      </p>

      <p>
        Koľko rastlín bude v teste?
      </p>

      <input
        type="number"
        min="1"
        max={
          categoryPlants.length
        }
        value={
          testLimit
        }
        disabled={
          allPlants
        }
        onChange={(e) => {

          setTestLimit(
            e.target.value
          );

          setAllPlants(
            false
          );

        }}
      />

      <div
        style={{
          margin:
            "15px 0"
        }}
      >

        <label>

          <input
            type="checkbox"
            checked={
              allPlants
            }
            onChange={(e) => {

              const checked =
                e.target.checked;

              setAllPlants(
                checked
              );

              if (checked) {

                setTestLimit(
                  categoryPlants.length
                );

              } else {

                setTestLimit(
                  ""
                );

              }

            }}
          />

          {" "}
          Všetky rastliny

        </label>

      </div>

      <h3>
        Vyber test:
      </h3>

      <div className="test-list">

        <button
          onClick={() =>
            setTestType("1")
          }
        >
          🌿 Test 1
        </button>

        <button
          onClick={() =>
            setTestType("2")
          }
        >
          🌱 Test 2
        </button>

        <button
          onClick={() =>
            setTestType("3")
          }
        >
          🌳 Test 3
        </button>

        <button
          onClick={() =>
            setTestType("4")
          }
        >
          🪴 Test 4
        </button>

      </div>

      {testType && (
        <p>
          Vybraný test:{" "}
          <strong>
            Test {testType}
          </strong>
        </p>
      )}

      {error && (
        <p
          style={{
            color:
              "red",
            fontWeight:
              "bold"
          }}
        >
          {error}
        </p>
      )}

      <br />

      <button
        onClick={
          createRoom
        }
        disabled={
          loading
        }
      >
        {loading
          ? "⏳ Vytváram test..."
          : "🚀 Vytvoriť spoločný test"}
      </button>

      <br />
      <br />

      <button
        onClick={
          goBack
        }
      >
        ⬅ Späť
      </button>

    </div>

  );

}

export default GroupOrganizer;
