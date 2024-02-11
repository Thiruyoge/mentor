const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mentor_student_db', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));

// Define Mentor schema and model
const Mentor = mongoose.model('Mentor', {
  name: String,
  email: String,
  // Other mentor fields
});

// Define Student schema and model
const Student = mongoose.model('Student', {
  name: String,
  email: String,
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor' }
  // Other student fields
});

app.use(bodyParser.json());

// 1. Create Mentor API
app.post('/api/mentors', async (req, res) => {
  try {
    const mentor = new Mentor(req.body);
    await mentor.save();
    res.status(201).send(mentor);
  } catch (error) {
    res.status(400).send(error);
  }
});

// 2. Create Student API
app.post('/api/students', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).send(student);
  } catch (error) {
    res.status(400).send(error);
  }
});

// 3. Assign a student to Mentor API
app.post('/api/assign', async (req, res) => {
  try {
    const { mentorId, studentIds } = req.body;
    const students = await Student.find({ mentor: null, _id: { $in: studentIds } });
    if (students.length === 0) {
      return res.status(404).send('No eligible students found.');
    }
    const updatedStudents = await Student.updateMany({ _id: { $in: studentIds } }, { mentor: mentorId });
    res.send(updatedStudents);
  } catch (error) {
    res.status(400).send(error);
  }
});

// 4. Assign or Change Mentor for particular Student API
app.put('/api/assign/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { mentorId } = req.body;
    const student = await Student.findByIdAndUpdate(studentId, { mentor: mentorId }, { new: true });
    res.send(student);
  } catch (error) {
    res.status(400).send(error);
  }
});

// 5. Show all students for a particular mentor API
app.get('/api/mentors/:mentorId/students', async (req, res) => {
  try {
    const { mentorId } = req.params;
    const students = await Student.find({ mentor: mentorId });
    res.send(students);
  } catch (error) {
    res.status(400).send(error);
  }
});

// 6. Show the previously assigned mentor for a particular student API
app.get('/api/students/:studentId/mentor', async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    const mentor = await Mentor.findById(student.mentor);
    res.send(mentor);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
