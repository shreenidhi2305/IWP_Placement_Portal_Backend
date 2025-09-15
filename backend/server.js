const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const { GridFSBucket } = require("mongodb");
const cors = require("cors");

const app = express();

// ⚡ Allow CORS only from your frontend (optional, safer)
// Replace YOUR_FRONTEND_URL with your deployed frontend link
app.use(cors({
    origin: "*", // or ["https://your-frontend.onrender.com"]
}));
app.use(express.json());

// ---------------------
// MongoDB connection
// ---------------------
const mongoURI = process.env.MONGO_URI; // ⚡ use env var

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const conn = mongoose.connection;

let gfsBucket;
conn.once("open", () => {
    gfsBucket = new GridFSBucket(conn.db, { bucketName: "resumes" });
    console.log("MongoDB connected & GridFS ready");
});

// ---------------------
// Multer setup (memory storage)
// ---------------------
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ---------------------
// Schemas + Models
// ---------------------
const studentSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    registrationNo: String,
    dob: String, // dd-mm-yyyy
    course: String,
    semester: Number,
    address: String,
    state: String,
    cgpa: Number,
    activeBacklogs: Number,
    certifications: Number,
    projects: Number,
    internships: Number,
    researchPapers: Number,
    resumeFileId: mongoose.Schema.Types.ObjectId,
    photoFileId: mongoose.Schema.Types.ObjectId,
});
const Student = mongoose.model("Student", studentSchema);

const companySchema = new mongoose.Schema({
    companyName: String,
    pocName: String,
    pocPhone: String,
    pocEmail: String,
    minCgpa: Number,
    avgPackageLpa: Number,
});
const Company = mongoose.model("Company", companySchema);

const sessionSchema = new mongoose.Schema({
    company: { type: String, required: true },
    start: { type: Date, required: true },
});
const Session = mongoose.model("sessions", sessionSchema);

const notificationSchema = new mongoose.Schema({
    message: String,
    time: { type: Date, default: Date.now },
});
const Notification = mongoose.model("Notification", notificationSchema);

// 🔹 Faculty, Student, Company Login Schemas
const facultyLoginSchema = new mongoose.Schema({
    uname: String,
    password: String,
});
const FacultyLogin = mongoose.model("facultylogin", facultyLoginSchema);

const studentLoginSchema = new mongoose.Schema({
    name: String,
    uname: String,
    password: String,
    registrationNo: String,
});
const StudentLogin = mongoose.model("studentlogin", studentLoginSchema);

const companyLoginSchema = new mongoose.Schema({
    uname: String,
    password: String,
});
const CompanyLogin = mongoose.model("companylogin", companyLoginSchema);

// ---------------------
// Routes
// ---------------------
// (keep all your routes the same)
// ...

// ---------------------
// Start server
// ---------------------
const PORT = process.env.PORT || 5000; // ⚡ use env var
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
