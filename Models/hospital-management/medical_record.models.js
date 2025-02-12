import mongoose from "mongoose";

const medicalRedcordSchema = new mongoose.Schema({}, {timestamps: true})

export const MedicalRecord = mongoose.model('MedicalRecord', medicalRedcordSchema)