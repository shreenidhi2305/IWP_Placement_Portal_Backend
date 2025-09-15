const mongoose = require("mongoose");

// ✅ connect directly to placementPortal DB
mongoose.connect("mongodb+srv://Shreenidhi:Newyork2305@placement-portal.wabrzub.mongodb.net/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const studentSchema = new mongoose.Schema({
    name: String,
    rollNo: String,
    department: String,
    email: String,
});

// ✅ force collection name "students"
const Student = mongoose.model("Student", studentSchema, "students");

async function seedStudents() {
    try {
        await Student.deleteMany({}); // clears old data each run

        await Student.insertMany([
            { name: "A. Sharma", rollNo: "21CS123", department: "CSE", email: "a.sharma@univ.edu" },
            { name: "B. Kumar", rollNo: "21IT456", department: "IT", email: "b.kumar@univ.edu" },
            { name: "C. Rao", rollNo: "21EC789", department: "ECE", email: "c.rao@univ.edu" },
            { name: "D. Patel", rollNo: "21ME321", department: "ME", email: "d.patel@univ.edu" },
            { name: "E. Reddy", rollNo: "21CE654", department: "CE", email: "e.reddy@univ.edu" },
            { name: "F. Thomas", rollNo: "21CS678", department: "CSE", email: "f.thomas@univ.edu" },
            { name: "G. Roy", rollNo: "21IT111", department: "IT", email: "g.roy@univ.edu" },
            { name: "H. Iyer", rollNo: "21EC222", department: "ECE", email: "h.iyer@univ.edu" },
        ]);

        console.log("✅ Student data seeded into placementPortal.students");
    } catch (err) {
        console.error("❌ Error seeding students:", err);
    } finally {
        mongoose.connection.close();
    }
}

seedStudents();
