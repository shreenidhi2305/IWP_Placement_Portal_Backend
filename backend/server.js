const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const { GridFSBucket } = require("mongodb");
const cors = require("cors");


const app = express();
app.use(cors());
app.use(express.json());

// ---------------------
// MongoDB connection
// ---------------------
const mongoURI =
    "mongodb+srv://Shreenidhi:Newyork2305@placement-portal.wabrzub.mongodb.net/placementPortal?retryWrites=true&w=majority&appName=placement-portal";

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
    resumeFileId: mongoose.Schema.Types.ObjectId, // Reference to GridFS file
    photoFileId: mongoose.Schema.Types.ObjectId,  // GridFS photo
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

// ---------------------
// Session Schema + Model
// ---------------------
const sessionSchema = new mongoose.Schema({
    company: { type: String, required: true },
    start: { type: Date, required: true }, // ISO datetime
});

const Session = mongoose.model("sessions", sessionSchema);

// 🔹 Schema & Model
const notificationSchema = new mongoose.Schema({
    message: String,
    time: { type: Date, default: Date.now },
});

//NOTIFICATION ROUTES
const Notification = mongoose.model("Notification", notificationSchema);

// 🔹 Faculty sends notification
app.post("/notifications", async (req, res) => {
    const { message } = req.body;
    try {
        const newNotification = new Notification({ message });
        await newNotification.save();
        res.json({ success: true, msg: "Notification saved" });
    } catch (error) {
        console.error("Error saving notification:", error);
        res.status(500).json({ success: false, msg: "Failed to save notification" });
    }
});

// 🔹 Students fetch notifications
app.get("/notifications", async (req, res) => {
    const notifications = await Notification.find().sort({ time: -1 }).limit(20);
    res.json(notifications);
});

// ---------------------
// Session Routes
// ---------------------

// Get all sessions
// Sorted sessions
app.get("/sessions", async (req, res) => {
    try {
        const sessions = await Session.find().sort({ start: 1 });
        const data = sessions.map(s => ({
            id: s._id,          // needed for edit/delete
            title: s.company,   // what shows up in calendar
            start: s.start
        }));
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch sessions" });
    }
});

// Add a new session
app.post("/sessions", async (req, res) => {
    try {
        const { company, start } = req.body;
        if (!company || !start) {
            return res.status(400).json({ error: "Company and start time are required" });
        }

        const session = new Session({ company, start });
        await session.save();

        res.json({ message: "Session added successfully", session });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// (Optional) Update a session
app.put("/sessions/:id", async (req, res) => {
    try {
        const updated = await Session.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: "Session not found" });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// (Optional) Delete a session
app.delete("/sessions/:id", async (req, res) => {
    try {
        const deleted = await Session.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Session not found" });
        res.json({ message: "Session deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Faculty login schema
const facultyLoginSchema = new mongoose.Schema({
    uname: String,
    password: String, // ⚠️ plain-text for now
});
const FacultyLogin = mongoose.model("facultylogin", facultyLoginSchema);

// Student login schema
const studentLoginSchema = new mongoose.Schema({
    name: String,
    uname: String,
    password: String,
    registrationNo: String // ⚠️ plain-text for now
});
const StudentLogin = mongoose.model("studentlogin", studentLoginSchema);
// Company login schema
const companyLoginSchema = new mongoose.Schema({
    uname: String,
    password: String, // ⚠️ plain-text for now
});
const CompanyLogin = mongoose.model("companylogin", companyLoginSchema);



// ---------------------
// Routes
// ---------------------



// Get all students
app.get("/students", async (req, res) => {
    const students = await Student.find();
    res.json(students);
});

// ✅ Add student with resume
// ✅ Add student with resume
app.post("/students", upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "photo", maxCount: 1 },
]), async (req, res) => {
    try {
        let resumeId = null;
        let photoId = null;

        // Upload resume
        if (req.files?.resume?.[0]) {
            const file = req.files.resume[0];
            const uploadStream = gfsBucket.openUploadStream(`${Date.now()}-${file.originalname}`, { contentType: file.mimetype });
            uploadStream.end(file.buffer);
            await new Promise((resolve, reject) => {
                uploadStream.on("finish", () => {
                    resumeId = uploadStream.id;
                    resolve();
                });
                uploadStream.on("error", reject);
            });
        }

        // Upload photo
        if (req.files?.photo?.[0]) {
            const file = req.files.photo[0];
            const uploadStream = gfsBucket.openUploadStream(`${Date.now()}-${file.originalname}`, { contentType: file.mimetype });
            uploadStream.end(file.buffer);
            await new Promise((resolve, reject) => {
                uploadStream.on("finish", () => {
                    photoId = uploadStream.id;
                    resolve();
                });
                uploadStream.on("error", reject);
            });
        }

        // Save student
        const studentData = {
            ...req.body,
            resumeFileId: resumeId,
            photoFileId: photoId,
        };

        const student = new Student(studentData);
        await student.save();

        res.json({ message: "Student added successfully", student });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error saving student");
    }
});

// Update student 
app.put("/student/:regNo", async (req, res) => {
    try {
        const updates = req.body;

        const updated = await Student.updateOne(
            { registrationNo: req.params.regNo },
            { $set: updates }
        );

        if (updated.matchedCount === 0) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        res.json({ success: true, message: "Student profile updated" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


// Delete student
app.delete("/students/:id", async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ error: "Student not found" });

        if (student.resumeFileId) {
            try {
                await gfsBucket.delete(student.resumeFileId);
            } catch (e) {
                console.warn("Resume already deleted or not found");
            }
        }

        await student.deleteOne();
        res.json({ message: "Student and resume deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get resume
app.get("/students/:id/resume", async (req, res) => {
    const student = await Student.findById(req.params.id);
    if (!student || !student.resumeFileId) {
        return res.status(404).send("Resume not found");
    }

    // Assuming you're streaming the file from GridFS or disk
    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${student.registrationNo.replace(/\s+/g, "_")}_Resume.pdf"`
    });

    // Example: if using GridFS
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "resumes" });
    bucket.openDownloadStream(student.resumeFileId).pipe(res);
});

// Get student photo
app.get("/students/:id/photo", async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student || !student.photoFileId) {
            return res.status(404).json({ error: "Photo not found" });
        }

        const downloadStream = gfsBucket.openDownloadStream(student.photoFileId);
        downloadStream.on("error", () => res.status(404).json({ error: "File not found" }));
        res.set("Content-Type", "image/jpeg"); // or image/png depending on file
        downloadStream.pipe(res);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all companies
app.get("/companies", async (req, res) => {
    try {
        const companies = await Company.find();
        res.json(companies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a new company
app.post("/companies", async (req, res) => {
    try {
        const company = new Company(req.body);
        await company.save();
        res.json({ message: "Company added successfully", company });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a company
app.put("/companies/:id", async (req, res) => {
    try {
        const updated = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: "Company not found" });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a company
app.delete("/companies/:id", async (req, res) => {
    try {
        const deleted = await Company.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Company not found" });
        res.json({ message: "Company deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Get student by registration no:
// Fetch student by registrationNo
app.get("/student/:regNo", async (req, res) => {
    const student = await Student.findOne({ registrationNo: req.params.regNo });
    if (!student) return res.status(404).send("Student not found");
    res.json(student);
});


app.post("/login", async (req, res) => {
    const { uname, password } = req.body;
    try {
        // First, try to find a faculty member
        const faculty = await FacultyLogin.findOne({ uname });
        if (faculty) {
            if (faculty.password !== password) {
                return res.status(400).json({ success: false, message: "Wrong password" });
            }
            return res.json({ success: true, message: "Login successful", userType: "faculty" });
        }

        // If no faculty member, try to find a student
        const student = await StudentLogin.findOne({ uname });
        if (student) {
            if (student.password !== password) {
                return res.status(400).json({ success: false, message: "Wrong password" });
            }
            console.log("Student registrationNo:", student.registrationNo);
            return res.json({ success: true, message: "Login successful", userType: "student", registrationNo: student.registrationNo });
        }

        // If no student, try to find a company
        const company = await CompanyLogin.findOne({ uname });
        if (company) {
            if (company.password !== password) {
                return res.status(400).json({ success: false, message: "Wrong password" });
            }
            return res.json({ success: true, message: "Login successful", userType: "company" });
        }

        // If none is found, return an invalid username error
        return res.status(400).json({ success: false, message: "Invalid username" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});
// ---------------------
// Start server
// ---------------------
app.listen(5000, () => console.log("Server running on http://localhost:5000"));
