const schoolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    // only  superAdmin
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
},
    { timestamps: true });

export default mongoose.model("School", schoolSchema);