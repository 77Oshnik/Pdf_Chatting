const express= require('express');
const dotenv=require('dotenv');
const path=require('path');
const cors=require('cors');
const uploadRoutes=require('./routes/uploadRoutes');
const queryRoutes=require('./routes/queryRoutes');
const userRoutes=require('./routes/userRoutes');
const pool=require('./utlis/db');


// Load env from backend/.env and fallback to project root .env
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const PORT=process.env.PORT || 8000
const app=express();
app.use(cors())
app.use(express.json())

app.use("/api", uploadRoutes);
app.use("/api", queryRoutes);
app.use('/api/users',userRoutes);

// Healthcheck
app.get('/api/health', (req, res) => {
    res.json({ ok: true });
});


app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})