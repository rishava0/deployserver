const mongoose = require ('mongoose');

const connectDB = async () => {
    try{
        const conn = await mongoose.connect('mongodb+srv://rishava0_db_user:AOMLlPZkKbx9xvZd@cluster0.xyadgm7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',{
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB connected: ${conn.connection.host}`);

    }catch(error){
        console.error(`Error:${error.message}`);
    }
};

module.exports= connectDB;
