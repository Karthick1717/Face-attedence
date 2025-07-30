const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.json({ limit: '10mb' }));

mongoose.connect("mongodb+srv://palanidevelopers:palani123@cluster0.4a7h51a.mongodb.net/Hospital?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

const faceSchema = new mongoose.Schema({
  name: String,
  descriptor: [Number],
});
const Face = mongoose.model("Face", faceSchema);

const attendanceSchema = new mongoose.Schema({
  name: String,
  date: { type: Date, default: Date.now },
});
const Attendance = mongoose.model("Attendance", attendanceSchema);

app.post('/register', async (req, res) => {
  const { name, descriptor } = req.body;
  if (!name || !descriptor) return res.status(400).send("Missing name or descriptor");

  await Face.findOneAndDelete({ name });
  const face = new Face({ name, descriptor });
  await face.save();
  res.send("✅ Face registered successfully");
});

app.post('/check', async (req, res) => {
  const { descriptor } = req.body;
  if (!descriptor) return res.status(400).json({ error: 'Missing descriptor' });

  const allFaces = await Face.find();
  for (let face of allFaces) {
    const dist = euclideanDistance(descriptor, face.descriptor);
    if (dist < 0.5) {
      return res.json({ exists: true, name: face.name });
    }
  }

  res.json({ exists: false });
});


app.get('/faces', async (req, res) => {
  const faces = await Face.find();
  res.json(faces);
});

app.post('/mark', async (req, res) => {
  const { descriptor } = req.body;
  if (!descriptor) return res.status(400).send("Missing descriptor");

  const allFaces = await Face.find();
  let bestMatch = null;
  let minDistance = Infinity;

  for (let face of allFaces) {
    const dist = euclideanDistance(descriptor, face.descriptor);
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = face;
    }
  }

  if (minDistance < 0.5) {
    const log = new Attendance({ name: bestMatch.name });
    await log.save();
    res.json({ status: "success", name: bestMatch.name });
  } else {
    res.json({ status: "fail", message: "Face not recognized" });
  }
});

function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
