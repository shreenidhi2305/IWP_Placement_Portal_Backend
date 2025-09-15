const StudentSchema = new mongoose.Schema({
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
    resumeFileId: mongoose.Schema.Types.ObjectId, // Reference to GridFS resume file
    photoFileId: mongoose.Schema.Types.ObjectId,  // Reference to GridFS photo file
});
