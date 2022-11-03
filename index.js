const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const cors = require("cors");

const serviceAccount = require("./kimberly-clark-adb29-firebase-adminsdk-hfvyp-d594c68128.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

app.get("/checkUsername", (req, res) => {
  const { username } = req.query;
  db.collection("users")
    .where("username", "==", username)
    .get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        res.send({ exists: false });
      } else {
        res.send({ exists: true });
      }
    });
});

app.post("/postUserProfile", (req, res) => {
  const {
    uid,
    name,
    username,
    age,
    firstTimeParent,
    motherOrFather,
    partnerUsername,
    genderOfBaby,
    ageOfBaby,
  } = req.body;
  db.collection("users")
    .doc(uid)
    .set({
      name,
      username,
      age,
      firstTimeParent,
      motherOrFather,
      partnerUsername,
      genderOfBaby,
      ageOfBaby,
      xp: 0,
      lastLoginDate: new Date(),
      streak: 0,
    })
    .then(() => {
      res.status(200).send("success");
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.post("/getDiseaseFromSymptoms", (req, res) => {
  const diseases = [
    {
      name: "Diaper Rash",
      symptoms: ["isItchy", "isReddish", "isMoist", "isGenital", "isThigh"],
    },
    {
      name: "Psoriasis",
      symptoms: ["isItchy", "isScaly", "isScalp", "isElbow", "isPainful"],
    },
    {
      name: "Candidasis",
      symptoms: [
        "isScalp",
        "isGenital",
        "isMouth",
        "isMoist",
        "isTropical",
        "isItchy",
      ],
    },
  ];
  const { symptoms } = req.body;
  let maxScore = {
    value: 0,
    index: 0,
  };
  diseases.forEach((element, i) => {
    let score = 0;
    element.symptoms.forEach((element) => {
      if (symptoms.includes(element)) {
        score++;
      }
    });
    if (score > maxScore.value) {
      maxScore.value = score;
      maxScore.index = i;
    }
  });
  res.send({ disease: diseases[maxScore.index].name });
});

app.get("/getUserProfile", (req, res) => {
  const { uid } = req.query;
  db.collection("users")
    .doc(uid)
    .get()
    .then((doc) => {
      if (doc.exists) {
        res.send(doc.data());
      } else {
        res.status(404).send("No such document!");
      }
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.post("/postQuestion", (req, res) => {
  const { uid, question, tags } = req.body;
  db.collection("questions")
    .add({
      uid,
      question,
      tags,
      createdAt: new Date(),
    })
    .then((docRef) => {
      res.status(200).send(docRef.id);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.get("/getQuestions", (req, res) => {
  db.collection("questions")
    .get()
    .then((querySnapshot) => {
      const questions = [];
      querySnapshot.forEach((doc) => {
        questions.push({ id: doc.id, ...doc.data() });
      });
      res.send(questions);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.post("/postAnswer", (req, res) => {
  const { uid, questionId, answer } = req.body;
  db.collection("answers")
    .add({
      uid,
      questionId,
      answer,
      createdAt: new Date(),
    })
    .then((docRef) => {
      res.status(200).send(docRef.id);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.get("/getAnswers", (req, res) => {
  const { questionId } = req.query;
  db.collection("answers")
    .where("questionId", "==", questionId)
    .get()
    .then((querySnapshot) => {
      const answers = [];
      querySnapshot.forEach((doc) => {
        answers.push({ id: doc.id, ...doc.data() });
      });
      res.send(answers);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.get("/getUserQuestions", (req, res) => {
  const { uid } = req.query;
  db.collection("questions")
    .where("uid", "==", uid)
    .get()
    .then((querySnapshot) => {
      const questions = [];
      querySnapshot.forEach((doc) => {
        questions.push({ id: doc.id, ...doc.data() });
      });
      res.send(questions);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.get("/getPartnerUsername", (req, res) => {
  const { uid } = req.query;
  db.collection("users")
    .doc(uid)
    .get()
    .then((doc) => {
      const { partnerUsername } = doc.data();
      res.send({ partnerUsername });
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.post("/postPartnerUsername", (req, res) => {
  const { uid, partnerUsername } = req.body;
  db.collection("users")
    .doc(uid)
    .update({
      partnerUsername,
    })
    .then(() => {
      res.status(200).send("success");
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.get("/getUidForUsername", (req, res) => {
  const { username } = req.query;
  db.collection("users")
    .where("username", "==", username)
    .get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        res.status(404).send("No such document!");
      } else {
        querySnapshot.forEach((doc) => {
          res.send({ uid: doc.id });
        });
      }
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.get("/getXp", (req, res) => {
  const { uid } = req.query;
  db.collection("users")
    .doc(uid)
    .get()
    .then((doc) => {
      if (doc.exists) {
        res.send(doc.data().xp);
      } else {
        res.status(404).send("No such document!");
      }
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.post("/updateXp", (req, res) => {
  const { uid } = req.body;
  db.collection("users")
    .doc(uid)
    .update({
      xp: admin.firestore.FieldValue.increment(10),
    })
    .then(() => {
      res.status(200).send("success");
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.get("/getLeaderboard", (req, res) => {
  db.collection("users")
    .orderBy("xp", "desc")
    .limit(10)
    .get()
    .then((querySnapshot) => {
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      res.send(users);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.get("/getLeaderboardRank", (req, res) => {
  const { uid } = req.query;
  db.collection("users")
    .orderBy("xp", "desc")
    .get()
    .then((querySnapshot) => {
      let rank = 0;
      querySnapshot.forEach((doc) => {
        rank++;
        if (doc.id === uid) {
          res.send({ rank: rank });
        }
      });
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.get("/getPartnerLeaderboardRank", (req, res) => {
  const { uid } = req.query;
  db.collection("users")
    .doc(uid)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const partnerUsername = doc.data().partnerUsername;
        db.collection("users")
          .orderBy("xp", "desc")
          .get()
          .then((querySnapshot) => {
            let rank = 0;
            querySnapshot.forEach((doc) => {
              rank++;
              if (doc.data().username === partnerUsername) {
                res.send({ rank: rank });
              }
            });
          })
          .catch((err) => {
            res.status(500).send(err);
          });
      } else {
        res.status(404).send("No such document!");
      }
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.get("/getStreak", (req, res) => {
  const { uid } = req.query;
  db.collection("users")
    .doc(uid)
    .get()
    .then((doc) => {
      if (doc.exists) {
        res.send(doc.data().streak);
      } else {
        res.status(404).send("No such document!");
      }
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.post("/updateStreak", (req, res) => {
  const { uid } = req.body;
  db.collection("users")
    .doc(uid)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const lastLoginDate = doc.data().lastLoginDate;
        const today = new Date();

        if (today.getDate() - lastLoginDate.toDate().getDate() > 2) {
          db.collection("users")
            .doc(uid)
            .update({
              streak: 0,
            })
            .then(() => {
              res.status(200).send("success");
            })
            .catch((err) => {
              res.status(500).send(err);
            });
        } else if (today.getDate() - lastLoginDate.toDate().getDate() != 0) {
          db.collection("users")
            .doc(uid)
            .update({
              streak: admin.firestore.FieldValue.increment(1),
              lastLoginDate: today,
            })
            .then(() => {
              res.status(200).send("success");
            })
            .catch((err) => {
              res.status(500).send(err);
            });
        }
      } else {
        res.status(404).send("No such document!");
      }
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

const PORT = 3000;
app.listen(PORT, () => console.log("Connected!"));
