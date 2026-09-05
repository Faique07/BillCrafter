import mongoose from 'mongoose'

export const connectDB = async () => {
    await mongoose.connect(`${process.env.MONGODB_URI}/BillCrafter`)
    .then(() => {console.log("DB Connected")})
}