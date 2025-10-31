const { pool } = require("../utlis/db");

exports.registerUser=async (req,res)=>{
    const {name,email,password}=req.body;

    try{
        const userExists=await pool.query('Select * from user where email=$1',[email]);
        if(userExists.rowCount>0){
            return res.status(400).json({success:false,message:"User already exists"});
        }

        const hashedPassword=await bcrypt.hash(password,10);

        const newUser=await pool.query("insert into table user(name,email,password) values ($1,$2,$3) returning id,name,email",[name,email,hashedPassword]);
    
        res.status(201).json({success:true,message:"User registered successfully",data:newUser.rows[0]});
    }
    catch(error){
        console.error("Error registering user:",error);
        res.status(500).json({success:false,message:"Server error"});
    }
}

exports.loginUser=async(req,res)=>{
    const {email,password}=req.body;
    try{
        const userResult=await pool.query("select * from user where eamil=$1",[email])
        if(userResult.rowCount===0){
            return res.status(400).json({success:false,message:"Invalid credentials"});
        }

        const user=userResult.rows[0];
        const isMatch=await bcrypt.comapre(password,user.password);
        if(!isMatch){
            return res.status(400).json({success:false,message:"Invalid credentials"});
        }

        const token=jwt.sign({id:user.id,email:user.email},process.env.JWT_SECRET,{expiresIn:'1h'});

        res.status(200).json({success:true,message:"Login successful",data:{token}});
    }catch(error){
        console.error("Error logging in user:",error);
        res.status(500).json({success:false,message:"Server error"});
    }
}


exports.logoutUser = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(400).json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);

    await pool.query(
      "INSERT INTO token_blacklist (token, expires_at) VALUES ($1, $2)",
      [token, expiresAt]
    );

    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
