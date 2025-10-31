const express= require ('express');
const router= express.Router();
const {registerUser,loginUser,logoutUser}=require('../controller/userController');
const {validate}=require('../middleware/validate');
const { userLoginValidator, userRegistrationValidator } = require('../validator/userValidator');
const { protect } = require('../middleware/auth');

router.post('/register',userRegistrationValidator,validate,registerUser);

router.post('/login',userLoginValidator,validate,loginUser);

router.post("/logout", protect, logoutUser);

module.exports=router;